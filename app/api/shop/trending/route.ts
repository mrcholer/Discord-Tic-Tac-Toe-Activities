import type { LudicordRequest } from "ludicord/server";
import { trendingSounds } from "../../../../lib/myinstants";

export const auth = false;

export async function GET(request: LudicordRequest): Promise<Response> {
  const region = new URL(request.url).searchParams.get("q") ?? "us";
  try {
    const sounds = await trendingSounds(region);
    return Response.json({ sounds });
  } catch (error) {
    return Response.json({ sounds: [], error: error instanceof Error ? error.message : "trending failed" }, { status: 502 });
  }
}