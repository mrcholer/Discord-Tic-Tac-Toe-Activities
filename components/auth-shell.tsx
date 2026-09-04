import type { ReactNode } from "react";

export const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

export function ChalkboardShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative grid min-h-screen place-items-center overflow-hidden px-6 text-center text-[#F1ECDD]"
      style={{
        background:
          "radial-gradient(circle at 22% 18%, rgba(241,236,221,0.05), transparent 40%), radial-gradient(circle at 78% 82%, rgba(241,236,221,0.04), transparent 45%), linear-gradient(160deg, #1a352c 0%, #12251f 60%, #0e1d19 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 0 14px #4a2e1a, inset 0 0 0 18px #6b4226, inset 0 0 46px 20px rgba(0,0,0,0.35)" }}
      />
      <div className="relative">{children}</div>
    </main>
  );
}

export function ChalkSpinner() {
  return (
    <svg aria-hidden className="mx-auto mb-5 h-12 w-12 animate-spin" fill="none" viewBox="0 0 48 48">
      <circle cx="24" cy="24" opacity="0.25" r="19" stroke="#F1ECDD" strokeDasharray="4 5" strokeLinecap="round" strokeWidth="3" />
      <path d="M 24 5 A 19 19 0 0 1 43 24" stroke="#F4C860" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
