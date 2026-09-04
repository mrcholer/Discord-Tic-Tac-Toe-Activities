import { ChalkboardShell, chalkFont } from "../../components/auth-shell";
export default function denied() { return <ChalkboardShell><h1 className="text-3xl" style={{ fontFamily: chalkFont }}>Access declined</h1><p>Reopen the Activity to authorize Discord access.</p></ChalkboardShell>; }
