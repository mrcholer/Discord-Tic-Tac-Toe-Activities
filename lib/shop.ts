export interface ShopSound {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly mp3: string;
}

export const SOUND_COST = 35;
export const POINTS_PER_WIN = 5;
export const MAX_SOUND_PLAYBACK_MS = 10000;

export const DEFAULT_WIN_SOUND: ShopSound = {
  id: "excellent-argument-approved-80331",
  title: "excellent argument, approved",
  url: "https://www.myinstants.com/en/instant/excellent-argument-approved-80331/",
  mp3: "https://www.myinstants.com/media/sounds/excellent-argument-approved.mp3",
};