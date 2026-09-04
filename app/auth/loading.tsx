import { ChalkboardShell, ChalkSpinner, chalkFont } from "../../components/auth-shell";
export default function loading() {
  return <ChalkboardShell><ChalkSpinner /><h1 className="text-3xl" style={{ fontFamily: chalkFont }}>Signing you in</h1><p className="mt-2 text-[#F1ECDD]/50">Connecting to Discord…</p></ChalkboardShell>;
}
