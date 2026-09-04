# Discord XO Activity

A Discord Activity built with Ludicord.

## Requirements

* Node.js
* npm or pnpm
* A Discord Developer Application

## Install

Clone the repository:

```bash
git clone https://github.com/mrcholer/Discord-XO-Activities.git
cd Discord-XO-Activities
```

Install dependencies with npm:

```bash
npm install
```

or pnpm:

```bash
pnpm install
```

## Environment Variables

Create a `.env.local` file in the root of the project.

```env
LUDICORD_DISCORD_CLIENT_ID=
LUDICORD_DISCORD_CLIENT_SECRET=
LUDICORD_SESSION_SECRET=
LUDICORD_DISCORD_PUBLIC_KEY=
```

Get the Discord values from the Discord Developer Portal.

### Client ID

Go to:

```text
Discord Developer Portal
→ Your Application
→ OAuth2
```

Copy the **Client ID**:

```env
LUDICORD_DISCORD_CLIENT_ID=YOUR_CLIENT_ID
```

### Client Secret

In the same **OAuth2** page, copy/reset your Client Secret:

```env
LUDICORD_DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### Public Key

Go to:

```text
Discord Developer Portal
→ Your Application
→ General Information
```

Copy the **Public Key**:

```env
LUDICORD_DISCORD_PUBLIC_KEY=YOUR_PUBLIC_KEY
```

### Session Secret

Generate your own random secret.

For example:

```bash
openssl rand -hex 32
```

Then add it:

```env
LUDICORD_SESSION_SECRET=YOUR_RANDOM_SECRET
```

Your final `.env.local` should look like:

```env
LUDICORD_DISCORD_CLIENT_ID=123456789012345678
LUDICORD_DISCORD_CLIENT_SECRET=your_client_secret
LUDICORD_SESSION_SECRET=your_random_session_secret
LUDICORD_DISCORD_PUBLIC_KEY=your_discord_public_key
```

Do not commit `.env.local`.

## Discord Developer Portal Setup

Open your application in the Discord Developer Portal.

### 1. OAuth2 Redirect

Go to:

```text
OAuth2
→ Redirects
```

Add:

```text
https://127.0.0.1
```

Then save the changes.

### 2. Enable Activities

Go to:

```text
Activities
→ Settings
```

Enable **Activities** for the application.

Also make sure the platforms you want to test on are enabled.

### 3. Local Activity URL

This project runs on:

```text
http://localhost:3000
```

For Discord desktop/web, the Activity URL needs HTTPS.

The easiest development setup is to run a tunnel to port `3000`.

Using Cloudflare Tunnel:

If you don't have `cloudflared` installed:

**Windows**

```bash
winget install --id Cloudflare.cloudflared
```

**macOS**

```bash
brew install cloudflared
```

Then start the tunnel:

```bash
cloudflared tunnel --url http://localhost:3000
```

It will give you a URL similar to:

```text
https://example-name.trycloudflare.com
```

Go to:

```text
Discord Developer Portal
→ Activities
→ URL Mappings
```

Add:

```text
Prefix: /
Target: example-name.trycloudflare.com
```

Do not include `https://` in the Target.

Every time your temporary tunnel URL changes, update the URL Mapping.

## Development

Start the project with npm:

```bash
npm run dev
```

or pnpm:

```bash
pnpm dev
```

The server runs on:

```text
http://127.0.0.1:3000
```

Keep the development server running while testing the Activity inside Discord.

If you are using Cloudflare Tunnel, keep both running:

```text
Terminal 1
npm run dev

Terminal 2
cloudflared tunnel --url http://127.0.0.1:3000
```

Then open Discord and launch your Activity.

## Build

With npm:

```bash
npm run build
```

or pnpm:

```bash
pnpm build
```

## Start Production Build

After building:

```bash
npm run start
```

or:

```bash
pnpm start
```

## Quick Setup

```bash
git clone https://github.com/mrcholer/Discord-XO-Activities.git
cd Discord-XO-Activities

npm install

# create .env.local

npm run dev
```

Then:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

Add the generated domain to:

```text
Discord Developer Portal
→ Activities
→ URL Mappings

Prefix: /
Target: your-tunnel.trycloudflare.com
```

Launch the Activity from Discord and you're ready to use it.
