import type { LudicordRequest } from "ludicord/server";
import { getRecord } from "../../../../lib/user-store";
import { SOUND_COST } from "../../../../lib/shop";

export async function GET(request: LudicordRequest): Promise<Response> {
  const userId = request.ludicord?.user.id;
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
  const record = await getRecord(userId);
  return Response.json({ points: record.points, sounds: record.sounds, selectedSoundId: record.selectedSoundId, soundCost: SOUND_COST });
}