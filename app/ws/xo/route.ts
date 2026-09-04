import { defineWS } from "ludicord/ws/server";

type Mark = "X" | "O";
type Cell = Mark | null;
type GameStatus = "waiting" | "playing" | "won" | "draw";
interface Player { readonly id: string; readonly name: string; readonly mark: Mark }
interface Game {
    board: Cell[];
    players: Player[];
    turn: Mark;
    status: GameStatus;
    winner: Mark | null;
    readyForNext: string[]; // player ids who've confirmed they want the next round
}

const games = new Map<string, Game>();
const connections = new Map<string, Map<string, string>>(); // instanceId -> clientId -> userId (players and watchers alike)
const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function gameFor(instanceId: string): Game {
    const existing = games.get(instanceId);
    if (existing) return existing;
    const game: Game = { board: Array<Cell>(9).fill(null), players: [], turn: "X", status: "waiting", winner: null, readyForNext: [] };
    games.set(instanceId, game);
    return game;
}

function result(game: Game): Mark | null {
    return wins.find(([a, b, c]) => game.board[a] !== null && game.board[a] === game.board[b] && game.board[a] === game.board[c]) ? game.board.find((cell, index) => cell !== null && wins.some(([a, b, c]) => [a, b, c].includes(index) && game.board[a] === cell && game.board[b] === cell && game.board[c] === cell)) as Mark : null;
}

function markFor(game: Game, userId: string): Mark | null {
    return game.players.find((player) => player.id === userId)?.mark ?? null;
}

function watcherCount(instanceId: string, game: Game): number {
    const connectedUserIds = new Set(connections.get(instanceId)?.values() ?? []);
    let count = 0;
    for (const userId of connectedUserIds) {
        if (!game.players.some((player) => player.id === userId)) count += 1;
    }
    return count;
}

function withWatchers(instanceId: string, game: Game) {
    return { ...game, watchers: watcherCount(instanceId, game) };
}

export default defineWS({
    connect(client) {
        const instanceId = client.ludicord.instanceId ?? "browser-preview";
        const game = gameFor(instanceId);
        const activityConnections = connections.get(instanceId) ?? new Map<string, string>();
        activityConnections.set(client.id, client.ludicord.user.id);
        connections.set(instanceId, activityConnections);
        client.activity.join();
        const yourMark = markFor(game, client.ludicord.user.id);
        client.emit("state", { ...withWatchers(instanceId, game), yourMark });
        client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: false });
    },
    events: {
        join(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const userId = client.ludicord.user.id;
            const requestedMark = typeof data === "object" && data !== null && "mark" in data && (data.mark === "X" || data.mark === "O") ? data.mark : null;
            if (requestedMark === null || game.players.length >= 2 || game.players.some((player) => player.id === userId || player.mark === requestedMark)) return;
            game.players.push({ id: userId, name: client.ludicord.user.displayName, mark: requestedMark });
            if (game.players.length === 2) game.status = "playing";
            client.emit("state", { ...withWatchers(instanceId, game), yourMark: requestedMark });
            client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: false });
        },
        move(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const mark = markFor(game, client.ludicord.user.id);
            const index = typeof data === "object" && data !== null && "index" in data && typeof data.index === "number" ? data.index : -1;
            if (mark !== game.turn || game.status !== "playing" || !Number.isInteger(index) || index < 0 || index > 8 || game.board[index] !== null) return;
            game.board[index] = mark;
            game.winner = result(game);
            game.status = game.winner ? "won" : game.board.every(Boolean) ? "draw" : "playing";
            if (!game.winner && game.status === "playing") game.turn = mark === "X" ? "O" : "X";
            if (game.status === "won" || game.status === "draw") game.readyForNext = [];
            client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: true });
        },
        // Both players confirm before the board clears, instead of either one
        // being able to yank it out from under the other mid-celebration.
        readyNext(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const userId = client.ludicord.user.id;
            if ((game.status !== "won" && game.status !== "draw") || !game.players.some((player) => player.id === userId)) return;
            if (!game.readyForNext.includes(userId)) game.readyForNext.push(userId);
            if (game.players.length === 2 && game.readyForNext.length >= 2) {
                game.board.fill(null);
                game.turn = "X";
                game.winner = null;
                game.status = "playing";
                game.readyForNext = [];
            }
            client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: true });
        },
        reset(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            if (!game.players.some((player) => player.id === client.ludicord.user.id)) return;
            game.board.fill(null);
            game.turn = "X";
            game.winner = null;
            game.readyForNext = [];
            game.status = game.players.length === 2 ? "playing" : "waiting";
            client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: true });
        },
    },
    disconnect(client) {
        const instanceId = client.ludicord.instanceId ?? "browser-preview";
        const game = games.get(instanceId);
        if (!game) return;
        const activityConnections = connections.get(instanceId);
        activityConnections?.delete(client.id);
        const userId = client.ludicord.user.id;
        const stillConnected = [...(activityConnections?.values() ?? [])].includes(userId);
        if (activityConnections?.size === 0) { connections.delete(instanceId); games.delete(instanceId); return; }
        const wasPlayer = game.players.some((player) => player.id === userId);
        if (!stillConnected && wasPlayer) {
            game.players = game.players.filter((player) => player.id !== userId);
            game.readyForNext = game.readyForNext.filter((id) => id !== userId);
            game.status = "waiting";
            game.board.fill(null);
            game.winner = null;
            game.turn = "X";
        }
        client.activity.broadcast("state", withWatchers(instanceId, game), { includeSelf: false });
    },
});
