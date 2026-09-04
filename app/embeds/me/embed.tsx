import { useDiscordUser } from "ludicord/discord";
import { formatUserName } from "../../../lib/format-user";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

export default function embed() {
  const user = useDiscordUser();

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 0 14px #4a2e1a, inset 0 0 0 18px #6b4226, inset 0 0 46px 20px rgba(0,0,0,0.35)" }}
      />

      <div
        className="relative mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10"
        style={{ paddingTop: "calc(2rem + var(--ludicord-safe-top))", paddingBottom: "calc(2rem + var(--ludicord-safe-bottom))" }}
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
      </div>
    </main>
  );
}
