import { ChalkboardShell, chalkFont } from "../components/auth-shell";

export default function NotFound() {
  return (
    <ChalkboardShell>
      <h1 className="text-3xl" style={{ fontFamily: chalkFont }}>
        Nowhere on this board
      </h1>
      <p className="mt-3 text-[#F1ECDD]/60">
        The requested route is empty chalk dust. Head back to the arena.
      </p>
    </ChalkboardShell>
  );
}