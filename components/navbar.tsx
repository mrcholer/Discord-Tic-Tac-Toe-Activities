import { useEffect, useState } from "react";
import { useDiscordUser } from "ludicord/discord";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

const links = [
  { hash: "#/", label: "Home" },
  { hash: "#/xo", label: "XO Arena" },
  { hash: "#/me", label: "Me" },
];

export default function Navbar() {
  const user = useDiscordUser();
  const [hash, setHash] = useState(() => window.location.hash || "#/");

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  function go(target: string) {
    window.location.hash = target;
  }

  return (
    <nav
      aria-label="Main navigation"
      className="relative flex items-center gap-1 border-b-[6px] border-[#4a2e1a] bg-gradient-to-b from-[#1a352c] to-[#12251f] px-4 py-3 pl-[calc(1rem+var(--ludicord-safe-left))] pr-[calc(1rem+var(--ludicord-safe-right))]"
    >
      {links.map((link) => {
        const active = hash === link.hash;
        return (
          <button
            className="relative rounded-sm px-3 py-2 text-sm text-[#F1ECDD]/80 transition hover:text-[#F1ECDD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD]/60"
            key={link.hash}
            onClick={() => go(link.hash)}
            style={{ fontFamily: chalkFont, fontSize: "1.05rem" }}
            type="button"
          >
            {link.label}
            {active && (
              <svg aria-hidden className="absolute -bottom-1 left-2 right-2 h-2 w-[calc(100%-1rem)]" preserveAspectRatio="none" viewBox="0 0 100 8">
                <path d="M2 4 C 25 1, 75 7, 98 3" fill="none" stroke="#F4C860" strokeLinecap="round" strokeWidth="3" />
              </svg>
            )}
          </button>
        );
      })}

      <div
        aria-label={user ? `Logged in as ${user.displayName}` : "Not logged in"}
        className="ml-auto flex items-center gap-2 bg-[#F1ECDD] py-1.5 pl-1.5 pr-3 text-[#1a2e26]"
        style={{ transform: "rotate(-1deg)" }}
      >
        {user?.avatar ? (
          <img alt="" className="h-7 w-7 rounded-full object-cover" src={user.avatar} />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1a2e26]/10 text-xs font-bold text-[#1a2e26]/50">?</span>
        )}
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block" style={{ fontFamily: chalkFont }}>
          {user?.displayName ?? "Not logged in"}
        </span>
        <span
          className="hidden h-1.5 w-1.5 shrink-0 rounded-full sm:block"
          style={{ backgroundColor: user ? "#4f8f5c" : "#c98a2f" }}
        />
      </div>
    </nav>
  );
}