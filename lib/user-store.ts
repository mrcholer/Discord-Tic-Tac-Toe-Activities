import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_WIN_SOUND, SOUND_COST } from "./shop";
import type { ShopSound } from "./shop";

export interface UserRecord {
  points: number;
  sounds: ShopSound[];
  selectedSoundId: string | null;
}

export interface BuyResult {
  ok: boolean;
  reason?: "owned" | "points" | "invalid" | "missing";
  record?: UserRecord;
}

export interface SelectResult {
  ok: boolean;
  reason?: "not-owned" | "missing";
  record?: UserRecord;
}

const FILE = path.resolve(process.cwd(), "data", "users.json");
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

async function readStore(): Promise<Record<string, UserRecord>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, UserRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, UserRecord>): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function emptyRecord(): UserRecord {
  return { points: 0, sounds: [], selectedSoundId: null };
}

export async function ensureUserRecord(userId: string): Promise<UserRecord> {
  return withLock(async () => {
    const store = await readStore();
    if (store[userId] !== undefined) return store[userId];
    const record = emptyRecord();
    store[userId] = record;
    await writeStore(store);
    return record;
  });
}

function isValidSound(sound: ShopSound): boolean {
  if (typeof sound.id !== "string" || sound.id === "") return false;
  if (typeof sound.title !== "string" || sound.title === "") return false;
  if (typeof sound.url !== "string" || !sound.url.startsWith("https://www.myinstants.com/")) return false;
  if (typeof sound.mp3 !== "string" || !sound.mp3.startsWith("https://www.myinstants.com/media/sounds/")) return false;
  return true;
}

export async function getRecord(userId: string): Promise<UserRecord> {
  return ensureUserRecord(userId);
}

export async function addPoints(userId: string, amount: number): Promise<UserRecord> {
  return withLock(async () => {
    const store = await readStore();
    const record = store[userId] ?? emptyRecord();
    record.points += amount;
    store[userId] = record;
    await writeStore(store);
    return record;
  });
}

export async function buySound(userId: string, sound: ShopSound): Promise<BuyResult> {
  if (!isValidSound(sound)) return { ok: false, reason: "invalid" };
  return withLock(async () => {
    const store = await readStore();
    const record = store[userId] ?? emptyRecord();
    if (record.sounds.some((item) => item.id === sound.id)) return { ok: false, reason: "owned", record };
    if (record.points < SOUND_COST) return { ok: false, reason: "points", record };
    record.points -= SOUND_COST;
    record.sounds = [...record.sounds, sound];
    store[userId] = record;
    await writeStore(store);
    return { ok: true, record };
  });
}

export async function selectSound(userId: string, soundId: string | null): Promise<SelectResult> {
  return withLock(async () => {
    const store = await readStore();
    const record = store[userId] ?? emptyRecord();
    if (soundId === null || record.sounds.some((item) => item.id === soundId)) {
      record.selectedSoundId = soundId;
      store[userId] = record;
      await writeStore(store);
      return { ok: true, record };
    }
    return { ok: false, reason: "not-owned", record };
  });
}

export async function selectedSound(userId: string): Promise<ShopSound> {
  const record = await getRecord(userId);
  const found = record.sounds.find((sound) => sound.id === record.selectedSoundId);
  return found ?? DEFAULT_WIN_SOUND;
}