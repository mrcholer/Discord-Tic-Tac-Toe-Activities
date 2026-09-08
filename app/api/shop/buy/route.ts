import type { LudicordRequest } from "ludicord/server";
import { buySound } from "../../../../lib/user-store";
import type { ShopSound } from "../../../../lib/shop";

export async function POST(request: LudicordRequest): Promise<Response> {
  const userId = request.ludicord?.user.id;
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
  let body: { sound?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad body" }, { status: 400 });
  }
  const sound = body?.sound as ShopSound | undefined;
  if (!sound) return Response.json({ error: "missing sound" }, { status: 400 });
  const result = await buySound(userId, sound);
  if (!result.ok) {
    const status = result.reason === "points" ? 409 : result.reason === "owned" ? 409 : 400;
    return Response.json({ error: result.reason }, { status });
  }
  return Response.json({ record: result.record });
}