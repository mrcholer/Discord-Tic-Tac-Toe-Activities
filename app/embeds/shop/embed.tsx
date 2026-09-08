import { useCallback, useEffect, useRef, useState } from "react";
import { useDiscordUser } from "ludicord/discord";
import { SOUND_COST } from "../../../lib/shop";
import type { ShopSound } from "../../../lib/shop";
import { stopSound } from "../../../lib/sound-player";
import { SoundToast, useSoundToast } from "../../../components/sound-toast";

const chalkFont = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";

type Tab = "search" | "trending" | "recent";

interface ShopRecord {
  readonly points: number;
  readonly sounds: readonly ShopSound[];
  readonly selectedSoundId: string | null;
}

export default function embed() {
  const user = useDiscordUser();
  const { toast, play, show } = useSoundToast();
  const [record, setRecord] = useState<ShopRecord | null>(null);
  const [tab, setTab] = useState<Tab>("trending");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly ShopSound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playingRef = useRef<string | null>(null);

  const describeError = useCallback((code: string | undefined): string => {
    switch (code) {
      case "LUDICORD_AUTH_REQUIRED":
      case "unauthenticated":
        return "Not signed in — open this inside Discord to buy sounds.";
      case "points":
        return `Not enough points — win more rounds to earn ${SOUND_COST} points.`;
      case "owned":
        return "You already own this sound.";
      case "invalid":
        return "That sound isn't a valid myinstants sound.";
      case "missing sound":
        return "No sound was sent with the request.";
      case "bad body":
        return "The request body couldn't be read.";
      default:
        return `error: ${code && code !== "" ? code : "Something went wrong."}`;
    }
  }, []);

  const readApiError = useCallback(async (response: Response): Promise<string> => {
    try {
      const data = (await response.json()) as { error?: string };
      return describeError(data.error);
    } catch {
      return `error: request failed with status ${response.status}.`;
    }
  }, [describeError]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/shop/me", { credentials: "same-origin" });
      if (response.ok) {
        setRecord((await response.json()) as ShopRecord);
      } else {
        show(await readApiError(response));
      }
    } catch {
      setRecord(null);
      show("Couldn't reach the shop server.");
    }
  }, [readApiError, show]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => () => stopSound(), []);

  async function loadSounds(kind: Tab, term?: string) {
    setError(null);
    setLoading(true);
    try {
      const url = kind === "search"
        ? `/api/shop/search?q=${encodeURIComponent(term ?? "")}`
        : kind === "trending" ? "/api/shop/trending" : "/api/shop/recent";
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        const message = await readApiError(response);
        setError(message);
        show(message);
        setResults([]);
        return;
      }
      const data = (await response.json()) as { sounds?: readonly ShopSound[]; error?: string };
      if (typeof data.error === "string") {
        const message = describeError(data.error);
        setError(message);
        show(message);
        setResults([]);
        return;
      }
      setResults(data.sounds ?? []);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load sounds.";
      setError(message);
      show(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(next: Tab) {
    setTab(next);
    if (next === "search" && query.trim() !== "") return;
    void loadSounds(next);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim() === "") return;
    setTab("search");
    void loadSounds("search", query);
  }

  function preview(sound: ShopSound) {
    if (playingRef.current === sound.id) {
      stopSound();
      playingRef.current = null;
      setPlayingId(null);
      return;
    }
    playingRef.current = sound.id;
    setPlayingId(sound.id);
    const handle = play(sound.mp3, sound.title);
    void handle.status.then((status) => {
      if (status !== "playing" && playingRef.current === sound.id) {
        playingRef.current = null;
        setPlayingId(null);
      }
    });
  }

  function ownedSet() {
    return new Set(record?.sounds.map((sound) => sound.id) ?? []);
  }

  const owned = ownedSet();

  async function buy(sound: ShopSound) {
    setError(null);
    try {
      const response = await fetch("/api/shop/buy", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sound }),
      });
      const data = (await response.json()) as { record?: ShopRecord; error?: string };
      if (!response.ok || !data.record) {
        const message = describeError(data.error);
        setError(message);
        show(message);
        return;
      }
      setRecord(data.record);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Purchase failed.";
      setError(message);
      show(message);
    }
  }

  async function select(soundId: string) {
    setError(null);
    try {
      const response = await fetch("/api/shop/select", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soundId }),
      });
      const data = (await response.json()) as { record?: ShopRecord; error?: string };
      if (!response.ok || !data.record) {
        const message = describeError(data.error);
        setError(message);
        show(message);
        return;
      }
      setRecord(data.record);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not select sound.";
      setError(message);
      show(message);
    }
  }

  const points = record?.points ?? 0;
  const selectedSoundId = record?.selectedSoundId ?? null;

  return (
    <main className="relative h-full w-full overflow-hidden text-[#F1ECDD]">
      <div
        className="no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden"
        style={{ paddingTop: "var(--ludicord-safe-top)", paddingBottom: "var(--ludicord-safe-bottom)" }}
      >
        <div className="relative mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl leading-tight sm:text-5xl" style={{ fontFamily: chalkFont, transform: "rotate(-1deg)" }}>
            Sound Shop
          </h1>
          <div
            className="flex items-center gap-3 bg-[#F1ECDD] px-4 py-2 text-[#1a2e26] shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
            style={{ transform: "rotate(1deg)" }}
          >
            <span className="text-3xl leading-none text-[#D98A1E]">✦</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a4a3a]">Your points</p>
              <p className="text-xl leading-none font-bold" style={{ fontFamily: chalkFont }}>
                {points}
              </p>
            </div>
          </div>
        </div>

        <p className="mb-6 text-sm text-[#F1ECDD]/60">
          Win rounds in XO Arena to earn points · every victory is worth <strong className="text-[#F4C860]">1 point</strong> · a
          sound costs <strong className="text-[#F4C860]">{SOUND_COST} points</strong>
        </p>

        <form className="mb-6 flex gap-2" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="sound-search">Search myinstants sounds</label>
          <input
            className="min-w-0 flex-1 rounded-sm border border-[#F1ECDD]/20 bg-[#F1ECDD]/[0.06] px-3 py-2 text-sm text-[#F1ECDD] placeholder:text-[#F1ECDD]/40 focus:outline focus:outline-2 focus:outline-[#F4C860]/70"
            id="sound-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search sounds, e.g. approved"
            type="search"
            value={query}
          />
          <button
            className="rounded-sm bg-[#F1ECDD] px-4 py-2 text-sm font-bold text-[#1a2e26] transition hover:bg-[#F4C860] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD]"
            style={{ fontFamily: chalkFont }}
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="mb-6 flex gap-2">
          {([["trending", "Trending"], ["recent", "Newest"], ["search", "Results"]] as const).map(([key, label]) => (
            <button
              className="rounded-sm border border-[#F1ECDD]/25 px-3 py-1.5 text-sm transition hover:bg-[#F1ECDD]/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD]"
              disabled={key === "search" && query.trim() === ""}
              key={key}
              onClick={() => switchTab(key)}
              style={{
                fontFamily: chalkFont,
                backgroundColor: tab === key ? "rgba(241,236,221,0.14)" : "transparent",
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-sm border border-[#EF7F6C]/40 bg-[#EF7F6C]/10 px-3 py-2 text-sm text-[#EF7F6C]">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-[#F1ECDD]/50">Scratching around the shelf...</p>
        ) : (
          <section className="flex flex-col gap-3">
            {results.map((sound) => {
              const isOwned = owned.has(sound.id);
              const isSelected = selectedSoundId === sound.id;
              const canAfford = points >= SOUND_COST;
              const isPlaying = playingId === sound.id;
              return (
                <div
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                  key={sound.id}
                  style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 6px 14px rgba(0,0,0,0.30)", background: isSelected ? "rgba(244,200,96,0.10)" : "rgba(241,236,221,0.04)" }}
                >
                  <button
                    aria-label={isPlaying ? `Stop preview of ${sound.title}` : `Play preview of ${sound.title}`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C860]"
                    onClick={() => preview(sound)}
                    style={{ border: `2px solid ${isPlaying ? "#F4C860" : "#F1ECDD/50"}` }}
                    type="button"
                  >
                    {isPlaying ? "■" : "♪"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm" style={{ fontFamily: chalkFont }}>
                      {sound.title}
                      {isSelected && <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-[#F4C860]">Active win sound</span>}
                    </p>
                    {!user && <p className="text-[11px] text-[#F1ECDD]/40">Sign in to buy</p>}
                  </div>
                  {isOwned ? (
                    <button
                      className="rounded-sm border border-[#F4C860]/50 px-3 py-1.5 text-sm transition hover:bg-[#F4C860] hover:text-[#1a2e26] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C860]"
                      disabled={isSelected}
                      onClick={() => void select(sound.id)}
                      style={{ fontFamily: chalkFont }}
                      type="button"
                    >
                      {isSelected ? "Active" : "Make active"}
                    </button>
                  ) : (
                    <button
                      className="rounded-sm bg-[#F1ECDD] px-3 py-1.5 text-sm font-bold text-[#1a2e26] transition hover:bg-[#F4C860] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F1ECDD]"
                      disabled={!canAfford || !user}
                      onClick={() => void buy(sound)}
                      style={{ fontFamily: chalkFont }}
                      type="button"
                    >
                      Buy · {SOUND_COST}
                    </button>
                  )}
                </div>
              );
            })}
            {!loading && results.length === 0 && (
              <p className="text-sm text-[#F1ECDD]/50">Nothing on this shelf yet. Try a search or hop to Trending.</p>
            )}
          </section>
        )}

        {record && record.sounds.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-2xl" style={{ fontFamily: chalkFont }}>
              My collection
            </h2>
            <section className="flex flex-col gap-3">
              {record.sounds.map((sound) => {
                const isSelected = selectedSoundId === sound.id;
                const isPlaying = playingId === sound.id;
                return (
                  <div
                    className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm"
                    key={sound.id}
                    style={{ boxShadow: "inset 0 0 0 2px #6b4226, 0 4px 10px rgba(0,0,0,0.25)", background: isSelected ? "rgba(244,200,96,0.10)" : "rgba(241,236,221,0.03)" }}
                  >
                    <button
                      aria-label={isPlaying ? `Stop ${sound.title}` : `Play ${sound.title}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F4C860]"
                      onClick={() => preview(sound)}
                      style={{ border: `2px solid ${isPlaying ? "#F4C860" : "#F1ECDD/45"}` }}
                      type="button"
                    >
                      {isPlaying ? "■" : "♪"}
                    </button>
                    <span className="min-w-0 flex-1 truncate" style={{ fontFamily: chalkFont }}>
                      {sound.title}
                    </span>
                    {isSelected ? (
                      <span className="text-xs uppercase tracking-[0.18em] text-[#F4C860]">Active</span>
                    ) : (
                      <button
                        className="rounded-sm border border-[#F1ECDD]/30 px-2.5 py-1 text-xs transition hover:bg-[#F1ECDD]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F1ECDD]"
                        onClick={() => void select(sound.id)}
                        style={{ fontFamily: chalkFont }}
                        type="button"
                      >
                        Make active
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
      </div>
      <SoundToast message={toast} />
    </main>
  );
}