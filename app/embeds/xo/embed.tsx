import { useEffect, useState } from "react";
import { useDiscordUser } from "ludicord/discord";
import { useWS } from "ludicord/ws/client";
import type { ShopSound } from "../../../lib/shop";
import { stopSound } from "../../../lib/sound-player";
import { SoundToast, useSoundToast } from "../../../components/sound-toast";

type Mark = "X" | "O";
type Cell = Mark | null;
type GameStatus = "waiting" | "playing" | "won" | "draw";

interface GameState {
    readonly board: readonly Cell[];
    readonly players: readonly { readonly id: string; readonly name: string; readonly mark: Mark }[];
    readonly turn: Mark;
    readonly status: GameStatus;
    readonly winner: Mark | null;
    readonly readyForNext: readonly string[];
    readonly watchers: number;
}

const emptyState: GameState = {
    board: Array<Cell>(9).fill(null),
    players: [],
    turn: "X",
    status: "waiting",
    winner: null,
    readyForNext: [],
    watchers: 0,
};

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";
const cellRotations = [-2, 1, -1, 2, 0, -2, 1, -1, 2];

export default function embed() {
    const user = useDiscordUser();
    const connection = useWS("/ws/xo");
    const { toast, play } = useSoundToast();
    const [game, setGame] = useState<GameState>(emptyState);
    const [myMark, setMyMark] = useState<Mark | null>(null);
    const [winSound, setWinSound] = useState<ShopSound | null>(null);

    useEffect(() => connection.on("state", (data) => {
        const next = data as GameState & { readonly yourMark?: Mark | null };
        setGame(next);
        if ("yourMark" in next) setMyMark(next.yourMark ?? null);
    }), [connection]);

    useEffect(() => connection.on("win", (data) => {
        const payload = data as { readonly winnerId?: string; readonly sound?: ShopSound };
        const sound = payload?.sound;
        if (sound?.mp3) {
            setWinSound(sound);
            play(sound.mp3, sound.title);
        }
    }), [connection, play]);

    useEffect(() => () => stopSound(), []);

    const myId = user?.id ?? null;
    const isRoundOver = game.status === "won" || game.status === "draw";
    const iAmReady = myId !== null && game.readyForNext.includes(myId);
    const canMove = connection.status === "open" && game.status === "playing" && game.turn === myMark;
    const statusText = game.status === "waiting"
        ? "Waiting for an opponent"
        : game.status === "won"
            ? `${game.winner} takes the round`
            : game.status === "draw"
                ? "A perfect draw"
                : game.turn === myMark ? "Your move" : `${game.turn}'s move`;

    function move(index: number) {
        if (!canMove || game.board[index] !== null) return;
        connection.emit("move", { index });
    }

    function reset() {
        if (connection.status === "open") connection.emit("reset");
    }

    function readyNext() {
        if (connection.status === "open" && myMark !== null) connection.emit("readyNext");
    }

    const winner = game.winner ? game.players.find((player) => player.mark === game.winner) : undefined;
    function join(mark: Mark) {
        if (connection.status === "open" && myMark === null) connection.emit("join", { mark });
    }

    return (
        <main
            className="relative h-full w-full overflow-hidden text-[#F1ECDD]"
        >
            <div className="relative flex h-full min-h-0 w-full flex-col gap-4 p-6 sm:flex-row sm:gap-6 sm:p-8">
                {/* roster ledge */}
                <aside className="flex w-full shrink-0 flex-row items-stretch gap-3 sm:w-64 sm:flex-col sm:justify-between">
                    <div className="flex flex-1 flex-row gap-3 sm:flex-col">
                        <h1
                            className="hidden text-3xl leading-none sm:block"
                            style={{ fontFamily: chalkFont, transform: "rotate(-1.5deg)" }}
                        >
                            XO Duel
                        </h1>
                        {(["X", "O"] as Mark[]).map((mark) => {
                            const player = game.players.find((item) => item.mark === mark);
                            const isMe = myMark === mark;
                            const accent = mark === "X" ? "#D98A1E" : "#C24A38";
                            const playerReady = player ? game.readyForNext.includes(player.id) : false;
                            return (
                                <div
                                    key={mark}
                                    className="relative flex flex-1 items-center gap-3 bg-[#F1ECDD] px-3 py-3 text-[#1a2e26] shadow-[0_6px_14px_rgba(0,0,0,0.35)] sm:flex-none"
                                    style={{ transform: mark === "X" ? "rotate(-1.2deg)" : "rotate(1deg)" }}
                                >
                                    <span
                                        aria-hidden
                                        className="absolute -top-2 left-1/2 hidden h-4 w-10 -translate-x-1/2 rotate-2 bg-[#F1ECDD]/70 sm:block"
                                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                                    />
                                    <div
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg font-black"
                                        style={{ color: accent, border: `2px solid ${accent}` }}
                                    >
                                        {mark}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold" style={{ fontFamily: chalkFont }}>
                                            {player?.name ?? "Empty seat"}
                                        </p>
                                        <p className="text-[11px] text-[#5a4a3a]">
                                            {isMe ? "You" : player ? "Opponent" : "Open"}
                                            {isRoundOver && player && (playerReady ? " · Ready" : " · Deciding...")}
                                        </p>
                                    </div>
                                    {!player && myMark === null && (
                                        <button
                                            className="shrink-0 rounded-sm border border-[#1a2e26]/30 px-2 py-1 text-xs font-semibold text-[#1a2e26] transition hover:bg-[#1a2e26] hover:text-[#F1ECDD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2e26] disabled:cursor-not-allowed disabled:opacity-40"
                                            disabled={connection.status !== "open"}
                                            onClick={() => join(mark)}
                                            type="button"
                                        >
                                            Sit here
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="hidden shrink-0 flex-col gap-3 sm:flex">
                        <div className="flex items-center gap-2 text-xs text-[#F1ECDD]/60">
                            <span
                                aria-hidden
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: connection.status === "open" ? "#8fd19e" : "#e8b25a" }}
                            />
                            {connection.status === "open" ? "Connected" : "Connecting"}
                        </div>
                        {game.watchers > 0 && (
                            <p className="text-xs text-[#F1ECDD]/40">
                                {game.watchers} {game.watchers === 1 ? "person" : "people"} watching
                            </p>
                        )}
                        {isRoundOver ? (
                            <button
                                className="rounded-sm border border-[#F1ECDD]/25 px-3 py-2 text-sm text-[#F1ECDD]/90 transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD] disabled:cursor-not-allowed disabled:opacity-30"
                                disabled={myMark === null || connection.status !== "open" || iAmReady}
                                onClick={readyNext}
                                style={{ fontFamily: chalkFont }}
                                type="button"
                            >
                                {myMark === null ? "Watching" : iAmReady ? "Waiting for opponent..." : "Ready for next round"}
                            </button>
                        ) : (
                            <button
                                className="rounded-sm border border-[#F1ECDD]/25 px-3 py-2 text-sm text-[#F1ECDD]/90 transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD] disabled:cursor-not-allowed disabled:opacity-30"
                                disabled={game.status === "waiting"}
                                onClick={reset}
                                style={{ fontFamily: chalkFont }}
                                type="button"
                            >
                                Wipe the board
                            </button>
                        )}
                        {!user && <p className="text-[11px] text-[#F1ECDD]/40">Sign in with Discord to play</p>}
                    </div>
                </aside>

                {/* board */}
                <section className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center">
                    <p
                        className="text-center text-2xl"
                        style={{ fontFamily: chalkFont, transform: "rotate(-0.5deg)" }}
                    >
                        {statusText}
                    </p>
                    <p className="mb-3 mt-1 text-center text-xs text-[#F1ECDD]/40 sm:hidden">
                        {game.watchers > 0 && `${game.watchers} watching`}
                    </p>

                    <div className="relative aspect-square" style={{ width: "min(100%, 60vh)", maxWidth: "560px" }}>
                        <svg aria-hidden className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 300 300">
                            <path d="M 101 12 C 99 90, 103 180, 100 288" opacity="0.8" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="4" />
                            <path d="M 201 10 C 198 100, 203 190, 200 290" opacity="0.8" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="4" />
                            <path d="M 12 101 C 90 98, 200 104, 288 100" opacity="0.8" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="4" />
                            <path d="M 10 201 C 100 198, 190 203, 290 200" opacity="0.8" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="4" />
                        </svg>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            {game.board.map((cell, index) => (
                                <button
                                    aria-label={cell ? `Cell ${index + 1}, ${cell}` : `Cell ${index + 1}, empty`}
                                    className="grid place-items-center text-6xl transition hover:bg-[#F1ECDD]/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F1ECDD]/60 disabled:cursor-default disabled:hover:bg-transparent sm:text-7xl"
                                    disabled={!canMove || cell !== null}
                                    key={index}
                                    onClick={() => move(index)}
                                    style={{
                                        color: cell === "X" ? "#F4C860" : cell === "O" ? "#EF7F6C" : "transparent",
                                        fontFamily: chalkFont,
                                        textShadow: cell ? "0 0 14px rgba(241,236,221,0.25)" : "none",
                                        transform: `rotate(${cellRotations[index]}deg)`,
                                    }}
                                    type="button"
                                >
                                    {cell ?? ""}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isRoundOver && (
                        <p className="mt-3 text-sm text-[#F1ECDD]/60" style={{ fontFamily: chalkFont }}>
                            {game.status === "won" ? `${winner?.name ?? game.winner} wins the round` : "Nobody wins this one"} · {game.readyForNext.length}/{Math.min(game.players.length, 2)} ready
                        </p>
                    )}

                    {isRoundOver && winSound && (
                        <p className="mt-3 flex items-center gap-2 rounded-sm border border-[#F4C860]/40 px-3 py-1.5 text-sm text-[#F4C860]" style={{ fontFamily: chalkFont }}>
                            <button
                                className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C860]"
                                onClick={() => play(winSound.mp3, winSound.title)}
                                style={{ border: "2px solid #F4C860" }}
                                type="button"
                            >
                                ♪
                            </button>
                            <span className="max-w-60 truncate">{winSound.title}</span>
                        </p>
                    )}

                    <div className="mt-4 flex sm:hidden">
                        {isRoundOver ? (
                            <button
                                className="rounded-sm border border-[#F1ECDD]/25 px-4 py-2 text-sm text-[#F1ECDD]/90 disabled:cursor-not-allowed disabled:opacity-30"
                                disabled={myMark === null || connection.status !== "open" || iAmReady}
                                onClick={readyNext}
                                style={{ fontFamily: chalkFont }}
                                type="button"
                            >
                                {myMark === null ? "Watching" : iAmReady ? "Waiting for opponent..." : "Ready for next round"}
                            </button>
                        ) : (
                            <button
                                className="rounded-sm border border-[#F1ECDD]/25 px-4 py-2 text-sm text-[#F1ECDD]/90 disabled:cursor-not-allowed disabled:opacity-30"
                                disabled={game.status === "waiting"}
                                onClick={reset}
                                style={{ fontFamily: chalkFont }}
                                type="button"
                            >
                                Wipe the board
                            </button>
                        )}
                    </div>
                </section>
            </div>
            <SoundToast message={toast} />
        </main>
    );
}