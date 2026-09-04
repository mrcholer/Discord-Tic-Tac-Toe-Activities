import { defineWS } from "ludicord/ws/server";

type Mark = "A" | "B";
type Zone = 0 | 1 | 2 | 3 | 4 | 5; // goal mouth: 0-2 top row (L/C/R), 3-5 bottom row (L/C/R)
type GameStatus = "waiting" | "playing" | "finished";

interface Player { readonly id: string; readonly name: string; readonly mark: Mark }
interface ShotResult { readonly shooter: Mark; readonly aim: Zone; readonly dive: Zone; readonly scored: boolean }
export interface Game {
    players: Player[];
    score: Record<Mark, number>;
    shooter: Mark;
    keeper: Mark;
    aimReady: boolean;
    diveReady: boolean;
    shotsTaken: number;
    status: GameStatus;
    winner: Mark | null;
    lastResult: ShotResult | null;
}
interface Pending { aim: Zone | null; dive: Zone | null }

const ROUNDS = 3; // each player takes 3 shots in regulation
const REGULATION_SHOTS = ROUNDS * 2;

const games = new Map<string, Game>();
const connections = new Map<string, Map<string, string>>();
const pendingShots = new Map<string, Pending>();

function freshGame(): Game {
    return {
        players: [],
        score: { A: 0, B: 0 },
        shooter: "A",
        keeper: "B",
        aimReady: false,
        diveReady: false,
        shotsTaken: 0,
        status: "waiting",
        winner: null,
        lastResult: null,
    };
}

function gameFor(instanceId: string): Game {
    const existing = games.get(instanceId);
    if (existing) return existing;
    const game = freshGame();
    games.set(instanceId, game);
    return game;
}

function pendingFor(instanceId: string): Pending {
    const existing = pendingShots.get(instanceId);
    if (existing) return existing;
    const fresh: Pending = { aim: null, dive: null };
    pendingShots.set(instanceId, fresh);
    return fresh;
}

function swap(mark: Mark): Mark {
    return mark === "A" ? "B" : "A";
}

function resolveShot(game: Game, pending: Pending) {
    if (pending.aim === null || pending.dive === null) return;
    const scored = pending.aim !== pending.dive;
    if (scored) game.score[game.shooter] += 1;
    game.lastResult = { shooter: game.shooter, aim: pending.aim, dive: pending.dive, scored };
    game.shotsTaken += 1;

    if (game.shotsTaken >= REGULATION_SHOTS && game.shotsTaken % 2 === 0 && game.score.A !== game.score.B) {
        game.status = "finished";
        game.winner = game.score.A > game.score.B ? "A" : "B";
    } else {
        game.shooter = swap(game.shooter);
        game.keeper = swap(game.keeper);
    }
    pending.aim = null;
    pending.dive = null;
    game.aimReady = false;
    game.diveReady = false;
}

export default defineWS({
    connect(client) {
        const instanceId = client.ludicord.instanceId ?? "browser-preview";
        const game = gameFor(instanceId);
        const activityConnections = connections.get(instanceId) ?? new Map<string, string>();
        const existingPlayer = game.players.find((player) => player.id === client.ludicord.user.id);
        activityConnections.set(client.id, client.ludicord.user.id);
        connections.set(instanceId, activityConnections);
        client.activity.join();
        client.emit("state", { ...game, yourMark: existingPlayer?.mark ?? null });
        client.activity.broadcast("state", game, { includeSelf: false });
    },
    events: {
        join(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const activityConnections = connections.get(instanceId) ?? new Map<string, string>();
            const requestedMark = typeof data === "object" && data !== null && "mark" in data && (data.mark === "A" || data.mark === "B") ? data.mark : null;
            if (requestedMark === null || game.players.length >= 2 || game.players.some((player) => player.id === client.ludicord.user.id || player.mark === requestedMark)) return;
            game.players.push({ id: client.ludicord.user.id, name: client.ludicord.user.displayName, mark: requestedMark });
            activityConnections.set(client.id, client.ludicord.user.id);
            connections.set(instanceId, activityConnections);
            if (game.players.length === 2) game.status = "playing";
            client.emit("state", { ...game, yourMark: requestedMark });
            client.activity.broadcast("state", game, { includeSelf: false });
        },
        aim(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const pending = pendingFor(instanceId);
            const mark = game.players.find((player) => player.id === client.ludicord.user.id)?.mark;
            const zone = typeof data === "object" && data !== null && "zone" in data && typeof data.zone === "number" ? data.zone : -1;
            if (mark !== game.shooter || game.status !== "playing" || !Number.isInteger(zone) || zone < 0 || zone > 5 || game.aimReady) return;
            pending.aim = zone as Zone;
            game.aimReady = true;
            resolveShot(game, pending);
            client.activity.broadcast("state", game, { includeSelf: true });
        },
        dive(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const pending = pendingFor(instanceId);
            const mark = game.players.find((player) => player.id === client.ludicord.user.id)?.mark;
            const zone = typeof data === "object" && data !== null && "zone" in data && typeof data.zone === "number" ? data.zone : -1;
            if (mark !== game.keeper || game.status !== "playing" || !Number.isInteger(zone) || zone < 0 || zone > 5 || game.diveReady) return;
            pending.dive = zone as Zone;
            game.diveReady = true;
            resolveShot(game, pending);
            client.activity.broadcast("state", game, { includeSelf: true });
        },
        reset(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const existing = gameFor(instanceId);
            if (!existing.players.some((player) => player.id === client.ludicord.user.id)) return;
            const fresh = freshGame();
            fresh.players = existing.players;
            fresh.status = existing.players.length === 2 ? "playing" : "waiting";
            games.set(instanceId, fresh);
            pendingShots.set(instanceId, { aim: null, dive: null });
            client.activity.broadcast("state", fresh, { includeSelf: true });
        },
    },
    disconnect(client) {
        const instanceId = client.ludicord.instanceId ?? "browser-preview";
        const game = games.get(instanceId);
        if (!game) return;
        connections.get(instanceId)?.delete(client.id);
        if (connections.get(instanceId)?.size === 0) { connections.delete(instanceId); games.delete(instanceId); pendingShots.delete(instanceId); return; }
        const stillConnected = [...(connections.get(instanceId)?.values() ?? [])].includes(client.ludicord.user.id);
        if (stillConnected || !game.players.some((player) => player.id === client.ludicord.user.id)) return;
        game.players = game.players.filter((player) => player.id !== client.ludicord.user.id);
        game.status = "waiting";
        game.score = { A: 0, B: 0 }; game.shotsTaken = 0; game.shooter = "A"; game.keeper = "B"; game.winner = null;
        game.aimReady = false;
        game.diveReady = false;
        game.lastResult = null;
        pendingShots.set(instanceId, { aim: null, dive: null });
        client.activity.broadcast("state", game, { includeSelf: false });
    },
});
