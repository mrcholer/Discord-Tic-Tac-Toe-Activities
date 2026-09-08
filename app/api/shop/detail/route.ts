import type { LudicordRequest } from "ludicord/server";
import { detailSound } from "../../../../lib/myinstants";

export const auth = false;

export async function GET(request: LudicordRequest): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (id.trim() === "") return Response.json({ sound: null }, { status: 400 });
  try {
    const sound = await detailSound(id);
    return Response.json({ sound });
  } catch (error) {
    return Response.json({ sound: null, error: error instanceof Error ? error.message : "detail failed" }, { status: 502 });
  }
}