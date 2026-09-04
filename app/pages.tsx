import { EmbedOutlet, LudicordActivity } from "ludicord";
import Navbar from "../components/navbar";
import "./globals.css";

export default function Pages() {
  return <LudicordActivity defaultEmbed="home"><Navbar /><EmbedOutlet /></LudicordActivity>;
}
