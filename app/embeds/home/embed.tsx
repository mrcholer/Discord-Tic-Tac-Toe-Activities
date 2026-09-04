import {
  useActivityInstance,
  useDiscordUser,
  useParticipants,
  useDiscordChannel
} from "ludicord/discord";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

export default function embed() {
  const user = useDiscordUser();
  const activity = useActivityInstance();
  const participants = useParticipants();
  const channel = useDiscordChannel();

  function playNow() {
    window.location.hash = "#/xo";
  }

  return (
    <main className="relative h-[calc(100vh-61px)] w-full overflow-y-auto overflow-x-hidden text-[#F1ECDD]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(241,236,221,0.05), transparent 40%), radial-gradient(circle at 78% 82%, rgba(241,236,221,0.04), transparent 45%), linear-gradient(160deg, #1a352c 0%, #12251f 60%, #0e1d19 100%)",
          zIndex: -1,
        }}
      />
      {/* wooden chalkboard frame, scoped to this component's own area so it never draws over the navbar above it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 0 14px #4a2e1a, inset 0 0 0 18px #6b4226, inset 0 0 46px 20px rgba(0,0,0,0.35)" }}
      />

      <div
        className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10"
        style={{ paddingTop: "calc(2rem + var(--ludicord-safe-top))", paddingBottom: "calc(2rem + var(--ludicord-safe-bottom))" }}
      >
        <div className="max-w-2xl">
          <h1
            className="mb-4 text-4xl leading-tight sm:text-5xl"
            style={{ fontFamily: chalkFont, transform: "rotate(-1deg)" }}
          >
            Welcome{user ? `, ${user.displayName}` : ""}
          </h1>
          <p className="leading-7 text-[#F1ECDD]/60">
            XO Arena is a two-player duel on a chalkboard — quick to learn, quicker to lose to a friend. Grab a seat and see who draws the better line.
          </p>
          <button
            className="mt-6 rounded-sm border border-[#F1ECDD]/25 px-5 py-2.5 text-sm font-semibold text-[#F1ECDD] transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD]"
            onClick={playNow}
            style={{ fontFamily: chalkFont, fontSize: "1.05rem" }}
            type="button"
          >
            Play now
          </button>
        </div>

        <div className="mt-10 flex flex-col divide-y divide-dashed divide-[#F1ECDD]/15 sm:flex-row sm:divide-x sm:divide-y-0">
          <div className="flex flex-1 items-start gap-3 py-4 sm:py-0 sm:pr-8">
            <svg aria-hidden className="mt-1 h-7 w-7 shrink-0" fill="none" viewBox="0 0 28 28">
              <path d="M10 3 L10 25 M18 3 L18 25 M3 10 L25 10 M3 18 L25 18" opacity="0.5" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.4" />
              <path d="M5 6 L8 9 M8 6 L5 9" stroke="#F4C860" strokeLinecap="round" strokeWidth="1.6" />
              <circle cx="14" cy="14" fill="none" r="2.3" stroke="#EF7F6C" strokeWidth="1.6" />
            </svg>
            <div>
              <strong className="block text-lg" style={{ fontFamily: chalkFont }}>The rules</strong>
              <p className="mt-1 text-sm text-[#F1ECDD]/55">Take turns marking the board. Three in a row — any direction — wins the round.</p>
            </div>
          </div>

          <div className="flex flex-1 items-start gap-3 py-4 sm:py-0 sm:px-8">
            <svg aria-hidden className="mt-1 h-7 w-7 shrink-0" fill="none" viewBox="0 0 28 28">
              <ellipse cx="14" cy="10" rx="10" ry="4" stroke="#F1ECDD" strokeWidth="1.4" />
              <path d="M4 10 L4 16 M24 10 L24 16" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.4" />
              <path d="M4 16 C 4 18, 24 18, 24 16" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.4" />
              <path d="M11 20 L11 25 M17 20 L17 25" opacity="0.6" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.4" />
            </svg>
            <div>
              <strong className="block text-lg" style={{ fontFamily: chalkFont }}>Your table</strong>
              <p className="mt-1 text-sm text-[#F1ECDD]/55">{activity.instanceId ?? "Browser preview"}</p>
            </div>
          </div>

          <div className="flex flex-1 items-start gap-3 py-4 sm:py-0 sm:pl-8">
            <svg aria-hidden className="mt-1 h-7 w-7 shrink-0" fill="none" viewBox="0 0 28 28">
              <circle cx="10" cy="9" r="3.4" stroke="#F1ECDD" strokeWidth="1.4" />
              <path d="M4 22 C 4 16.5, 16 16.5, 16 22" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.4" />
              <circle cx="20" cy="10" opacity="0.6" r="2.6" stroke="#F1ECDD" strokeWidth="1.3" />
              <path d="M15.5 22 C 15.5 18, 25 18, 25 22" opacity="0.6" stroke="#F1ECDD" strokeLinecap="round" strokeWidth="1.3" />
            </svg>
            <div>
              <strong className="block text-lg" style={{ fontFamily: chalkFont }}>Players here</strong>
              <p className="mt-1 text-sm text-[#F1ECDD]/55">{participants.length} in the room</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
