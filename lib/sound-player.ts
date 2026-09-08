import { MAX_SOUND_PLAYBACK_MS } from "./shop";

export type SoundPlayStatus = "playing" | "blocked" | "error" | "stopped";

export interface SoundHandle {
  readonly status: Promise<SoundPlayStatus>;
  stop(): void;
}

let insideDiscord = false;

export function setInsideDiscord(value: boolean): void {
  insideDiscord = value;
}

export function mediaSrc(mp3: string): string {
  if (!insideDiscord) return mp3;
  try {
    const url = new URL(mp3);
    if (url.hostname === "www.myinstants.com") {
      return "/sound-api" + url.pathname;
    }
  } catch {
    // ignore malformed URLs
  }
  return mp3;
}

let active: HTMLAudioElement | null = null;
let activeTimer: number | null = null;
let activeResolve: ((status: SoundPlayStatus) => void) | null = null;

export function stopSound(): void {
  if (activeTimer !== null) {
    window.clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (active !== null) {
    active.pause();
    active.currentTime = 0;
    active.onended = null;
    active.onerror = null;
    active = null;
  }
  if (activeResolve !== null) {
    activeResolve("stopped");
    activeResolve = null;
  }
}

export function playSound(mp3: string, maxMs: number = MAX_SOUND_PLAYBACK_MS): SoundHandle {
  stopSound();
  const audio = new Audio(mediaSrc(mp3));
  let resolveStatus!: (status: SoundPlayStatus) => void;
  const status = new Promise<SoundPlayStatus>((resolve) => {
    resolveStatus = resolve;
  });
  active = audio;
  activeResolve = resolveStatus;
  const cap = () => {
    audio.pause();
    audio.currentTime = 0;
    if (activeResolve !== null) {
      activeResolve("stopped");
      activeResolve = null;
    }
    active = null;
  };
  activeTimer = window.setTimeout(cap, maxMs);
  audio.addEventListener("error", () => resolveStatus("error"));
  audio.onended = () => resolveStatus("stopped");
  const playResult = audio.play();
  if (playResult !== undefined) {
    playResult
      .then(() => resolveStatus("playing"))
      .catch(() => resolveStatus("blocked"));
  } else {
    resolveStatus("playing");
  }
  return { status, stop: () => stopSound() };
}

export function isPlaying(): boolean {
  return active !== null && !active.paused;
}

const SILENT_WAV = "data:audio/wav;base64,UklGRgwEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YegDAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

let audioUnlocked = false;

function attemptAudioUnlock(): void {
  if (audioUnlocked) return;
  const silent = new Audio(SILENT_WAV);
  const playResult = silent.play();
  if (playResult !== undefined) {
    playResult
      .then(() => {
        audioUnlocked = true;
        silent.pause();
      })
      .catch(() => {
        // keep waiting for a real user gesture
      });
  } else {
    audioUnlocked = true;
  }
}

export function unlockAudioOnFirstGesture(): void {
  const handler = () => {
    attemptAudioUnlock();
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("keydown", handler, true);
    window.removeEventListener("touchend", handler, true);
  };
  window.addEventListener("pointerdown", handler, true);
  window.addEventListener("keydown", handler, true);
  window.addEventListener("touchend", handler, true);
}