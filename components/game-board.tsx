import type { ReactNode } from "react";

export const gameButton = "rounded border-2 border-[#F1ECDD]/40 px-4 py-3 text-[#F1ECDD] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C860]";
export default function GameBoard({ title, status, children }: { title: string; status: string; children: ReactNode }) {
  return <main className="min-h-[calc(100dvh-80px)] bg-[#12251f] px-6 py-8 text-[#F1ECDD]" style={{ fontFamily: "'Segoe Print','Bradley Hand',cursive", paddingBottom: "calc(2rem + var(--ludicord-safe-bottom))" }}>
    <div className="mx-auto max-w-3xl rounded border-4 border-[#6b4226] p-6 shadow-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl text-[#F4C860]">{title}</h1><span role="status" className="text-sm">{status}</span></div>
      {children}
    </div>
  </main>;
}
