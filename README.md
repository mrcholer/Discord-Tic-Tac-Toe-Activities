# XO Arena 🎮

A **Discord Activity** — the classic Tic-Tac-Toe game running fully inside Discord as a two-player (X vs O) multiplayer experience. Built with **[Ludicord](https://ludicord.com)** (full-stack React for Discord Activities) + Tailwind CSS, with a chalkboard theme, a points system, and a **Sound Shop** where winners buy MyInstants sound effects that play when they take a round.

---

## Features

- **Two-player Tic-Tac-Toe** in real time — players join as **X** or **O**, take turns, and battle over rounds. Everyone else in the channel can **spectate** live.
- **WebSocket sync** — the game board, current player, and watchers update instantly for everyone via a real-time WebSocket connection.
- **Points / currency system** — **1 win = 5 points** (`POINTS_PER_WIN`). Persisted per user in `data/users.json`.
- **Sound Shop** 🎵 — spend **35 points** to buy MyInstants sound effects, preview them, and pick your personal **win sound** that plays whenever you win a round.
- **Profile page** — your Discord avatar, rounds won / played, points, and the table leaderboard.
- **Chalkboard UI** — a themed visual design with a top nav: **Home**, **XO Arena**, **Sound Shop**, **Me**.

---

## Tech Stack

| Area | Tech |
|---|---|
| Framework | [Ludicord](https://ludicord.com) v3 — full-stack React for Discord Activities |
| UI | React 19 + React DOM |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Build tool | Vite 7 / esbuild |
| Language | TypeScript (ES2022, ESM) |
| Realtime | WebSocket (`/ws/xo`) via `ludicord/ws/client` |
| Persistence | JSON file store (`lib/user-store.ts`) |
| Sounds API | [MyInstants unofficial API](https://myinstants-api.vercel.app) |

---

## How It Works

### The 4 embedded pages

The Activity is a single React app with **4 client-side routes**, navigated via the navbar (Ludicord's `useEmbedRouter`). Each lives in `app/embeds/`:

| Route | File | Purpose |
|---|---|---|
| `home` | `app/embeds/home/` | Landing page — rules, welcome, table info, player count. "Play now" jumps to `#/xo`. |
| `xo` | `app/embeds/xo/` | The game — join as X/O, play rounds, standings, watcher view. |
| `shop` | `app/embeds/shop/` | Search/trending/recent MyInstants sounds, preview, buy with points, choose your win sound. |
| `me` | `app/embeds/me/` | Your Discord profile, rounds won/played, points, points table / leaderboard. |

There is **no command prefix or slash-command system** — this is a *Discord Activity*, not a traditional chat bot. Players interact directly with the embedded UI.

### The game loop (`/ws/xo`)

The `xo` page talks to a WebSocket game server. Events:

- `join` — sit down as mark `X` or `O` (max 2 players).
- `move` — place your mark at a board index (0–8), turn-based.
- `readyNext` — signal you're ready for the next round (both players must confirm).
- `reset` — wipe the board back to standing/playing state.

The server pushes back:
- `state` — the full game state, watcher count, and your mark.
- `win` — the winner's ID **and their selected win sound**, which triggers playback for everyone.

### The points & shop flow

1. A win grants **+5 points** (`POINTS_PER_WIN` in `lib/shop.ts`) via `lib/user-store.ts` (`addPoints`).
2. The **Sound Shop** (`app/api/shop/*`) lets you spend **35 points** (`SOUND_COST` in `lib/shop.ts`) to buy a sound:
   - `GET /api/shop/me` → your balance, owned sounds, selected sound.
   - `POST /api/shop/buy` → purchase a sound (checks ownership + validates the MyInstants URL).
   - `POST /api/shop/select` → set your active win sound (must be owned).
   - `GET /api/shop/search`, `/trending`, `/recent`, `/detail` → browse MyInstants via `lib/myinstants.ts`.
3. On a win, `win` is broadcast with your selected sound's `mp3`.

### How sound playback works inside Discord (the `/sound-api` proxy)

Discord's embedded activity iframe **blocks direct audio from external domains**, so playback in `lib/sound-player.ts` does two things:

1. **`mediaSrc()`** — when running inside Discord, it rewrites any `www.myinstants.com` MP3 URL into a local path:
   ```
   https://www.myinstants.com/media/sounds/x.mp3
   → /sound-api/media/sounds/x.mp3
   ```
2. That `/sound-api/...` request is then **proxied by Discord's URL Mapping** out to `www.myinstants.com` (see setup below).

Everything else in `sound-player.ts` handles playability: a **10-second** playback cap (`MAX_SOUND_PLAYBACK_MS`), autoplay unlocking on the first user gesture (a silent WAV), and callbacks for `playing`/`blocked`/`error`/`stopped` statuses.

### Auth

Users are signed in automatically via Ludicord's OAuth flow (scopes `identify`, `guilds`) — no manual login. In dev, `.env.local` sets `LUDICORD_DEV_FAKE_AUTH=false`.

### Persistence

`lib/user-store.ts` persists points and owned sounds in `data/users.json` using an in-memory write-lock queue (safe for concurrent requests). The `data/` dir is gitignored.

---

## Requirements

- **Node.js >= 20.19.0**
- npm or pnpm
- A **Discord Developer Application**
- `cloudflared` (only needed for local testing, since Discord requires HTTPS)

---

## Install

```bash
git clone https://github.com/mrcholer/Discord-XO-Activities.git
cd Discord-XO-Activities

npm install
# or
pnpm install
```

---

## Environment Variables

Create a `.env.local` file in the root (see `.env.example`):

```env
LUDICORD_DISCORD_CLIENT_ID=
LUDICORD_DISCORD_CLIENT_SECRET=
LUDICORD_SESSION_SECRET=
LUDICORD_DISCORD_PUBLIC_KEY=
# LUDICORD_DISCORD_BOT_TOKEN=   # optional
```

| Variable | Where to get it |
|---|---|
| `LUDICORD_DISCORD_CLIENT_ID` | Developer Portal → Your Application → **OAuth2** → Client ID |
| `LUDICORD_DISCORD_CLIENT_SECRET` | Developer Portal → **OAuth2** → Client Secret (copy/reset) |
| `LUDICORD_DISCORD_PUBLIC_KEY` | Developer Portal → **General Information** → Public Key |
| `LUDICORD_SESSION_SECRET` | Generate your own: `openssl rand -hex 32` |

Final example:

```env
LUDICORD_DISCORD_CLIENT_ID=123456789012345678
LUDICORD_DISCORD_CLIENT_SECRET=your_client_secret
LUDICORD_SESSION_SECRET=your_random_session_secret
LUDICORD_DISCORD_PUBLIC_KEY=your_discord_public_key
```

> ⚠️ Never commit `.env.local`.

---

## Discord Developer Portal Setup

Open your application in the Discord Developer Portal.

### 1. OAuth2 Redirect

- Go to **OAuth2 → Redirects**.
- Add `https://127.0.0.1` (used by local dev).

### 2. Enable Activities

- Go to **Activities → Settings**.
- Enable **Activities** for the application (and the platforms you test on).

### 3. URL Mappings (IMPORTANT — two prefixes)

This project needs **two** URL Mappings:

| Prefix | Target | Purpose |
|---|---|---|
| `/` | `your-tunnel.trycloudflare.com` | The Activity app itself |
| `/sound-api` | `www.myinstants.com` | Proxies sound files so they can play inside Discord |

Do **not** include `https://` in the Target.

- Prefix `/` loads the app from your tunnel.
- Prefix `/sound-api` lets the app's rewritten `/sound-api/media/sounds/...` requests reach MyInstants (this is what makes win sounds actually play inside the embedded Discord iframe — see [How sound playback works](#how-sound-playback-works-inside-discord-the-sound-api-proxy)).

> Every time your temporary tunnel URL changes, update the `/` mapping (and if you host MyInstants yourself, point `/sound-api` at your own host).

### 4. Local tunnel (for development)

Discord desktop/web requires an HTTPS URL. Use Cloudflare Tunnel:

**Windows**
```bash
winget install --id Cloudflare.cloudflared
```

**macOS**
```bash
brew install cloudflared
```

Then create the tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

You'll get a URL like `https://example-name.trycloudflare.com` — use that as the Target above.

---

## Development

Start the dev server:

```bash
npm run dev
# or
pnpm dev
```

It runs on `http://127.0.0.1:3000`.

Keep two terminals running while testing inside Discord:

```text
Terminal 1
npm run dev

Terminal 2
cloudflared tunnel --url http://127.0.0.1:3000
```

Then launch the Activity from a Discord channel.

---

## Build & Production

```bash
npm run build   # production bundle
npm run start   # production server
```

Other scripts:

| Script | Purpose |
|---|---|
| `npm run lint` | Lint (`ludicord lint`) |
| `npm run analyze` | Bundle analysis |
| `npm run routes` | Show route manifest |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

---

## Project Structure

```
├── .env.example                 # env-template
├── ludicord.config.mjs          # framework config (auth, WS, server)
├── app/
│   ├── api/shop/                # shop endpoints (buy, detail, me, recent,
│   │                            #   search, select, trending)
│   ├── auth/                    # auth screen states (denied, error, loading)
│   ├── embeds/                  # the 4 UI pages: home, me, shop, xo
│   ├── ws/xo/                   # WebSocket game server
│   ├── layout.tsx / pages.tsx   # app shell + entry point
│   ├── minimize.tsx             # Discord "minimized activity" card
│   └── globals.css              # Tailwind + global styles
├── components/                  # navbar, chalkboard, game-board, auth-shell, sound-toast
├── data/users.json              # user points & sounds (gitignored)
└── lib/
    ├── format-user.ts           # user name formatting
    ├── myinstants.ts            # MyInstants API client
    ├── shop.ts                  # shop constants (cost, win sound default)
    ├── sound-player.ts          # HTML5 audio + /sound-api proxy + autoplay unlock
    └── user-store.ts            # JSON persistence (points/sounds)
```

---

## API Reference

### Shop — `app/api/shop/*`

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/shop/me` | yes | Your points, owned sounds, selected sound, cost |
| `POST /api/shop/buy` | yes | Buy a sound for 35 pts — body `{ sound: ShopSound }` |
| `POST /api/shop/select` | yes | Set active win sound — body `{ soundId }` |
| `GET /api/shop/search` | no | `?q=` MyInstants search → `{ sounds }` |
| `GET /api/shop/trending` | no | `?q=` region code (default `us`) |
| `GET /api/shop/recent` | no | Latest MyInstants sounds |
| `GET /api/shop/detail` | no | `?id=` single sound detail |

### WebSocket — `/ws/xo`

| Client event | Payload meaning |
|---|---|
| `join` | Sit down as X or O (max 2 players) |
| `move` | Place mark at board index 0–8 |
| `readyNext` | Confirm readiness for the next round |
| `reset` | Reset the board |

| Server event | Delivered |
|---|---|
| `state` | Full game state + watcher count + your mark |
| `win` | Winner's ID + their selected win sound (plays for everyone) |