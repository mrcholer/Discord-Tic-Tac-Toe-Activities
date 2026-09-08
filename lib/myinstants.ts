import type { ShopSound } from "./shop";

const API_BASE = "https://myinstants-api.vercel.app";

interface RawSound {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  mp3?: unknown;
}

function toSound(item: RawSound): ShopSound | null {
  if (!item) return null;
  const { id, title, url, mp3 } = item;
  if (typeof id !== "string" || id === "") return null;
  if (typeof title !== "string" || title === "") return null;
  if (typeof url !== "string" || typeof mp3 !== "string") return null;
  return { id, title, url, mp3 };
}

function listData(data: unknown): ShopSound[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => toSound(item as RawSound)).filter((sound): sound is ShopSound => sound !== null);
}

async function getData(endpoint: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}${endpoint}`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`myinstants API returned ${response.status}`);
  const body = await response.json();
  return typeof body === "object" && body !== null ? (body as { data?: unknown }).data : undefined;
}

export async function searchSounds(query: string): Promise<ShopSound[]> {
  const data = await getData(`/search?q=${encodeURIComponent(query)}`);
  return listData(data);
}

export async function trendingSounds(query: string): Promise<ShopSound[]> {
  const data = await getData(`/trending?q=${encodeURIComponent(query)}`);
  return listData(data);
}

export async function recentSounds(): Promise<ShopSound[]> {
  const data = await getData("/recent");
  return listData(data);
}

export async function detailSound(id: string): Promise<ShopSound | null> {
  const data = await getData(`/detail?id=${encodeURIComponent(id)}`);
  if (Array.isArray(data)) return listData(data)[0] ?? null;
  return toSound(data as RawSound);
}