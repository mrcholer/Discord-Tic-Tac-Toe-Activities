import {
  EmbedOutlet,
  LudicordActivity,
  LudicordMinimizeProvider,
  useLudicordMinimize,
} from "ludicord";
import { useAuthError, useAuthStatus } from "ludicord/auth";
import Navbar from "../components/navbar";
import "./globals.css";

import type { ReactNode } from "react";
import MinimizeCard from "./minimize";
import { useActivityLayoutMode } from "ludicord/discord";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

function ChalkboardShell({ children }: { children: ReactNode }) {
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

function ChalkSpinner() {
  return (
    <svg aria-hidden className="mx-auto mb-5 h-12 w-12 animate-spin" fill="none" viewBox="0 0 48 48">
      <circle cx="24" cy="24" opacity="0.25" r="19" stroke="#F1ECDD" strokeDasharray="4 5" strokeLinecap="round" strokeWidth="3" />
      <path d="M 24 5 A 19 19 0 0 1 43 24" stroke="#F4C860" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function AuthGate() {
  const status = useAuthStatus();
  const error = useAuthError();

  if (status === "authenticated") return <><Navbar /><EmbedOutlet /></>;

  if (status === "connecting" || status === "authorizing") {
    return (
      <ChalkboardShell>
        <ChalkSpinner />
        <h1 className="text-3xl" style={{ fontFamily: chalkFont, transform: "rotate(-1deg)" }}>
          Signing you in
        </h1>
        <p className="mt-2 text-[#F1ECDD]/50">Connecting to Discord...</p>
      </ChalkboardShell>
    );
  }

  return (
    <ChalkboardShell>
      <div className="max-w-md">
        <svg aria-hidden className="mx-auto mb-5 h-14 w-14" fill="none" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="26" stroke="#EF7F6C" strokeWidth="2.5" />
          <path d="M 28 16 L 28 32" stroke="#EF7F6C" strokeLinecap="round" strokeWidth="3.5" />
          <circle cx="28" cy="40" fill="#EF7F6C" r="2.2" />
        </svg>
        <h1 className="text-3xl" style={{ fontFamily: chalkFont, transform: "rotate(-1deg)" }}>
          Discord login required
        </h1>
        <p className="mt-3 leading-7 text-[#F1ECDD]/50">
          Open this Activity inside Discord to sign in and play XO. {error ? error.message : "Your session is not available in this browser."}
        </p>
      </div>
    </ChalkboardShell>
  );
}

export default function Pages() {
  // const layoutMode = useActivityLayoutMode();
  // const { minimized: manuallyMinimized } = useLudicordMinimize();
  // const discordMinimized =
  //   layoutMode !== null && layoutMode !== "focused" && layoutMode !== 0;
  // const minimized = manuallyMinimized || discordMinimized;

  // if (minimized) {
  //   return (
  //     <LudicordMinimizeProvider>
  //       <MinimizeCard />
  //     </LudicordMinimizeProvider>
  //   );
  // }

  return (
    <LudicordActivity defaultEmbed="home">
        <AuthGate />
    </LudicordActivity>
  );
}
