import type { LudicordRequest } from "ludicord/server";
import { searchSounds } from "../../../../lib/myinstants";

export const auth = false;

export async function GET(request: LudicordRequest): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim() === "") return Response.json({ sounds: [] });
  try {
    const sounds = await searchSounds(query);
    return Response.json({ sounds });
  } catch (error) {
    return Response.json({ sound: "", sounds: [], error: error instanceof Error ? error.message : "search failed" }, { status: 502 });
  }
}