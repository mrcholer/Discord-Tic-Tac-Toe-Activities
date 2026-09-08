import { useEffect, useState } from "react";
import { useDiscordUser } from "ludicord/discord";
import { useWS } from "ludicord/ws/client";
import { formatUserName } from "../../../lib/format-user";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

interface TableEntry {
  readonly id: string;
  readonly name: string;
  readonly wins: number;
}

export default function embed() {
  const user = useDiscordUser();
  const connection = useWS("/ws/xo");
  const [table, setTable] = useState<readonly TableEntry[]>([]);
  const [rounds, setRounds] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    fetch("/api/shop/me", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Me API unavailable"))))
      .then((data: { readonly points?: number }) => setPoints(data.points ?? 0))
      .catch(() => setPoints(0));
  }, []);

  useEffect(
    () =>
      connection.on("state", (data) => {
        const next = data as { readonly score?: Record<string, number>; readonly rounds?: number; readonly players?: readonly { readonly id: string; readonly name: string }[] };
        if (!next.score) return;
        const wins = next.score;
        const players = next.players ?? [];
        const entries = Object.entries(wins).map(([id, count]) => ({
          id,
          name: players.find((player) => player.id === id)?.name ?? "Unknown",
          wins: count,
        }));
        setTable(entries.sort((left, right) => right.wins - left.wins));
        setRounds(next.rounds ?? 0);
      }),
    [connection],
  );

  const myId = user?.id ?? null;
  const myWins = myId !== null ? (table.find((entry) => entry.id === myId)?.wins ?? 0) : 0;

  return (
    <main className="relative h-full w-full overflow-hidden text-[#F1ECDD]">
      <div
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{ paddingTop: "var(--ludicord-safe-top)", paddingBottom: "var(--ludicord-safe-bottom)" }}
      >
        <div
          className="relative mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10"
        >
        <h1 className="mb-8 text-4xl leading-tight sm:text-5xl" style={{ fontFamily: chalkFont, transform: "rotate(-1deg)" }}>
          About me
        </h1>

        {user ? (
          <div className="flex items-center gap-6">
            <div
              className="relative shrink-0 bg-[#F1ECDD] p-2 shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
              style={{ transform: "rotate(-2deg)" }}
            >
              <span
                aria-hidden
                className="absolute -top-2.5 left-1/2 h-5 w-12 -translate-x-1/2 rotate-1 bg-[#F1ECDD]/70"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
              />
              {user.avatar ? (
                <img alt="" className="h-28 w-28 object-cover sm:h-32 sm:w-32" src={user.avatar} />
              ) : (
                <div className="grid h-28 w-28 place-items-center bg-[#1a2e26]/10 text-3xl font-bold text-[#1a2e26]/40 sm:h-32 sm:w-32">
                  ?
                </div>
              )}
            </div>

            <div>
              <p className="text-2xl" style={{ fontFamily: chalkFont }}>
                {formatUserName(user)}
              </p>
              <p className="mt-1 text-sm text-[#F1ECDD]/50">Signed in with Discord</p>
            </div>
          </div>
        ) : (
          <p className="leading-7 text-[#F1ECDD]/50">Connect Discord to see your profile.</p>
        )}

        <div className="mt-10 flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
          <div
            className="flex flex-1 flex-col items-center gap-2 py-5"
            style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.35)", background: "rgba(241,236,221,0.04)" }}
          >
            <span className="text-4xl leading-none text-[#F4C860]" style={{ fontFamily: chalkFont }}>
              {myWins}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#F1ECDD]/50">Rounds won</span>
          </div>
          <div
            className="flex flex-1 flex-col items-center gap-2 py-5"
            style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.35)", background: "rgba(241,236,221,0.04)" }}
          >
            <span className="text-4xl leading-none text-[#EF7F6C]" style={{ fontFamily: chalkFont }}>
              {rounds}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#F1ECDD]/50">Rounds played</span>
          </div>
          <div
            className="flex flex-1 flex-col items-center gap-2 py-5"
            style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.35)", background: "rgba(241,236,221,0.04)" }}
          >
            <span className="text-4xl leading-none text-[#D98A1E]" style={{ fontFamily: chalkFont }}>
              {points}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-[#F1ECDD]/50">Points</span>
          </div>
        </div>

        <h2 className="mb-4 mt-10 text-2xl" style={{ fontFamily: chalkFont }}>
          Table results
        </h2>
        {table.length > 0 ? (
          <div
            className="w-full max-w-md overflow-hidden text-sm"
            style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.35)", background: "rgba(241,236,221,0.04)" }}
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#F1ECDD]/15 px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-[#F1ECDD]/45">
              <span>Player</span>
              <span className="w-14 text-center">Wins</span>
              <span className="w-8 text-center" />
            </div>
            {table.map((entry, index) => {
              const isMe = entry.id === myId;
              const accent = index === 0 && entry.wins > 0 ? "#F4C860" : isMe ? "#EF7F6C" : undefined;
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-2.5"
                  style={index % 2 === 1 ? { background: "rgba(241,236,221,0.03)" } : undefined}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                      style={accent ? { color: accent, border: `2px solid ${accent}` } : { color: "#F1ECDD/60", border: "2px solid rgba(241,236,221,0.25)" }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate" style={{ fontFamily: chalkFont }}>
                      {entry.name}
                    </span>
                    {isMe && <span className="shrink-0 text-[10px] text-[#F1ECDD]/45">you</span>}
                  </span>
                  <span className="w-14 text-center font-semibold" style={accent ? { color: accent } : undefined}>
                    {entry.wins}
                  </span>
                  <span className="w-8 text-center" aria-hidden>
                    {index === 0 && entry.wins > 0 ? <span style={{ color: "#F4C860" }}>★</span> : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#F1ECDD]/50">No rounds played on this table yet. Head to XO Arena to start.</p>
        )}
      </div>
      </div>
    </main>
  );
}