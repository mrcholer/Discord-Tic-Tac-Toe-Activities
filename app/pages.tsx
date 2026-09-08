import { useEffect } from "react";
import { EmbedOutlet, LudicordActivity } from "ludicord";
import { useDiscord } from "ludicord/discord";
import Navbar from "../components/navbar";
import Chalkboard from "../components/chalkboard";
import { setInsideDiscord, unlockAudioOnFirstGesture } from "../lib/sound-player";
import "./globals.css";

export default function Pages() {
  const discord = useDiscord();
  useEffect(() => {
    unlockAudioOnFirstGesture();
    setInsideDiscord(discord.status === "ready");
  }, [discord.status]);
  return (
    <LudicordActivity defaultEmbed="home">
      <Navbar />
      <Chalkboard>
        <EmbedOutlet />
      </Chalkboard>
    </LudicordActivity>
  );
}
