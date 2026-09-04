import { ChalkboardShell, chalkFont } from "../components/auth-shell";
export default function error({ error, reset }: { readonly error: Error; readonly reset: () => void }) {
  return <ChalkboardShell><h1 className="text-3xl" style={{ fontFamily: chalkFont }}>The Activity hit an error</h1><p className="mt-3 text-[#F1ECDD]/60">{error.message}</p><button className="mt-5 rounded bg-[#F4C860] px-4 py-2 text-[#12251f]" onClick={reset}>Try again</button></ChalkboardShell>;
}
