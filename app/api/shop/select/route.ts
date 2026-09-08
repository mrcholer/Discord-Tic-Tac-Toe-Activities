import type { LudicordRequest } from "ludicord/server";
import { selectSound } from "../../../../lib/user-store";

export async function POST(request: LudicordRequest): Promise<Response> {
  const userId = request.ludicord?.user.id;
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
  let body: { soundId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  const soundId = typeof body?.soundId === "string" ? body.soundId : null;
  const result = await selectSound(userId, soundId);
  if (!result.ok) return Response.json({ error: result.reason }, { status: 404 });
  return Response.json({ record: result.record });
}