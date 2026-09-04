import { defineWS } from "ludicord/ws/server";

type Phase = "lobby" | "hiding" | "seeking" | "finished";
type Result = "hidersWin" | "seekerWins";

interface Player { readonly id: string; readonly name: string }
interface SearchResult { readonly spotId: string; readonly hit: boolean; readonly foundNames: string[] }
interface Game {
    players: Player[];
    seekerId: string | null;
    hiddenPlayerIds: string[];
    foundPlayerIds: string[];
    hearts: number;
    phase: Phase;
    hidingEndsAt: number | null;
    result: Result | null;
    lastSearch: SearchResult | null;
}
interface PrivateState {
    spots: Map<string, Set<string>>; // spotId -> unfound player ids hiding there
    spotOf: Map<string, string>; // playerId -> spotId
}

const MAX_HEARTS = 3;
const HIDING_MS = 15000;

const games = new Map<string, Game>();
const connections = new Map<string, Map<string, string>>(); // instanceId -> clientId -> userId
const privateStates = new Map<string, PrivateState>();

function freshGame(): Game {
    return {
        players: [],
        seekerId: null,
        hiddenPlayerIds: [],
        foundPlayerIds: [],
        hearts: MAX_HEARTS,
        phase: "lobby",
        hidingEndsAt: null,
        result: null,
        lastSearch: null,
    };
}

function gameFor(instanceId: string): Game {
    const existing = games.get(instanceId);
    if (existing) return existing;
    const game = freshGame();
    games.set(instanceId, game);
    return game;
}

function privateFor(instanceId: string): PrivateState {
    const existing = privateStates.get(instanceId);
    if (existing) return existing;
    const fresh: PrivateState = { spots: new Map(), spotOf: new Map() };
    privateStates.set(instanceId, fresh);
    return fresh;
}

export default defineWS({
    connect(client) {
        const instanceId = client.ludicord.instanceId ?? "browser-preview";
        const game = gameFor(instanceId);
        const activityConnections = connections.get(instanceId) ?? new Map<string, string>();
        activityConnections.set(client.id, client.ludicord.user.id);
        connections.set(instanceId, activityConnections);
        client.activity.join();
        client.emit("state", game);
        client.activity.broadcast("state", game, { includeSelf: false });
    },
    events: {
        join(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const userId = client.ludicord.user.id;
            if (game.phase === "seeking" || game.players.some((player) => player.id === userId)) return;
            game.players.push({ id: userId, name: client.ludicord.user.displayName });
            client.activity.broadcast("state", game, { includeSelf: true });
        },
        start(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            if ((game.phase !== "lobby" && game.phase !== "finished") || game.players.length < 2) return;

            const priv = privateFor(instanceId);
            priv.spots.clear();
            priv.spotOf.clear();

            const candidates = game.players.filter((player) => player.id !== game.seekerId);
            const pool = candidates.length > 0 ? candidates : game.players;
            const seeker = pool[Math.floor(Math.random() * pool.length)];

            game.seekerId = seeker.id;
            game.hiddenPlayerIds = [];
            game.foundPlayerIds = [];
            game.hearts = MAX_HEARTS;
            game.result = null;
            game.lastSearch = null;
            game.phase = "hiding";
            game.hidingEndsAt = Date.now() + HIDING_MS;
            client.activity.broadcast("state", game, { includeSelf: true });

            setTimeout(() => {
                const current = games.get(instanceId);
                if (!current || current.phase !== "hiding") return;
                current.phase = "seeking";
                current.hidingEndsAt = null;
                client.activity.broadcast("state", current, { includeSelf: true });
            }, HIDING_MS);
        },
        hide(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const priv = privateFor(instanceId);
            const userId = client.ludicord.user.id;
            const spotId = typeof data === "object" && data !== null && "spotId" in data && typeof data.spotId === "string" ? data.spotId : null;
            if (game.phase !== "hiding" || spotId === null || userId === game.seekerId || !game.players.some((player) => player.id === userId)) return;

            const previousSpot = priv.spotOf.get(userId);
            if (previousSpot) priv.spots.get(previousSpot)?.delete(userId);
            priv.spotOf.set(userId, spotId);
            const occupants = priv.spots.get(spotId) ?? new Set<string>();
            occupants.add(userId);
            priv.spots.set(spotId, occupants);

            if (!game.hiddenPlayerIds.includes(userId)) game.hiddenPlayerIds.push(userId);
            client.activity.broadcast("state", game, { includeSelf: true });
        },
        beam(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const userId = client.ludicord.user.id;
            const x = typeof data === "object" && data !== null && "x" in data && typeof data.x === "number" ? data.x : null;
            const y = typeof data === "object" && data !== null && "y" in data && typeof data.y === "number" ? data.y : null;
            if (game.phase !== "seeking" || userId !== game.seekerId || x === null || y === null) return;
            client.activity.broadcast("beam", { x, y }, { includeSelf: false });
        },
        search(client, data) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const game = gameFor(instanceId);
            const priv = privateFor(instanceId);
            const userId = client.ludicord.user.id;
            const spotId = typeof data === "object" && data !== null && "spotId" in data && typeof data.spotId === "string" ? data.spotId : null;
            if (game.phase !== "seeking" || userId !== game.seekerId || spotId === null) return;

            const occupants = priv.spots.get(spotId);
            const hit = !!occupants && occupants.size > 0;

            if (hit && occupants) {
                const foundNames: string[] = [];
                for (const playerId of occupants) {
                    game.foundPlayerIds.push(playerId);
                    const player = game.players.find((candidate) => candidate.id === playerId);
                    if (player) foundNames.push(player.name);
                    priv.spotOf.delete(playerId);
                }
                occupants.clear();
                game.lastSearch = { spotId, hit: true, foundNames };
                const stillHiding = game.hiddenPlayerIds.filter((id) => !game.foundPlayerIds.includes(id));
                if (stillHiding.length === 0) {
                    game.phase = "finished";
                    game.result = "seekerWins";
                }
            } else {
                game.hearts -= 1;
                game.lastSearch = { spotId, hit: false, foundNames: [] };
                if (game.hearts <= 0) {
                    game.phase = "finished";
                    game.result = "hidersWin";
                }
            }
            client.activity.broadcast("state", game, { includeSelf: true });
        },
        reset(client) {
            const instanceId = client.ludicord.instanceId ?? "browser-preview";
            const existing = gameFor(instanceId);
            const fresh = freshGame();
            fresh.players = existing.players;
            games.set(instanceId, fresh);
            privateStates.set(instanceId, { spots: new Map(), spotOf: new Map() });
            client.activity.broadcast("state", fresh, { includeSelf: true });
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
        if (stillConnected) return;

        const priv = privateFor(instanceId);
        const spot = priv.spotOf.get(userId);
        if (spot) priv.spots.get(spot)?.delete(userId);
        priv.spotOf.delete(userId);

        if (game.phase === "lobby" || game.phase === "finished") {
            game.players = game.players.filter((player) => player.id !== userId);
        } else if (userId === game.seekerId) {
            game.phase = "finished";
            game.result = "hidersWin";
        } else {
            game.hiddenPlayerIds = game.hiddenPlayerIds.filter((id) => id !== userId);
            game.foundPlayerIds = game.foundPlayerIds.filter((id) => id !== userId);
            game.players = game.players.filter((player) => player.id !== userId);
        }
        client.activity.broadcast("state", game, { includeSelf: false });
    },
});