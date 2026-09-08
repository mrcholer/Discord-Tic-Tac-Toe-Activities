import { type ReactNode } from "react";

export default function Chalkboard({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative h-[calc(100vh-61px)] w-full text-[#F1ECDD]">
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
      {children}
    </div>
  );
}
