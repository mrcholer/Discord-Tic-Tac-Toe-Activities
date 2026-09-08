import type { LudicordRequest } from "ludicord/server";
import { recentSounds } from "../../../../lib/myinstants";

export const auth = false;

export async function GET(_request: LudicordRequest): Promise<Response> {
  try {
    const sounds = await recentSounds();
    return Response.json({ sounds });
  } catch (error) {
    return Response.json({ sounds: [], error: error instanceof Error ? error.message : "recent failed" }, { status: 502 });
  }
}