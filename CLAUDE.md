# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS, deployed as a static web app (Vercel).

**Audio:** Agora Web SDK (`agora-rtc-sdk-ng`). Requires `VITE_AGORA_APP_ID` in `.env`. The Agora project must be in **Testing mode** (no App Certificate) so tokens aren't required. Users join/leave Agora channels identified by the room code.

**Routing:** React Router v6 with two routes:
- `/` → Home screen (create or join a room)
- `/room/:code` → Room screen (speak button, participant count)

**Key files:**
- `src/hooks/useAgora.ts` — all Agora logic: join, leave, toggle mic, participant tracking
- `src/pages/Home.tsx` — generates 4-char alphanumeric room codes, navigation
- `src/pages/Room.tsx` — room UI, calls `useAgora`, copies shareable room URL

**Room codes** are 4 uppercase alphanumeric chars (ambiguous chars excluded). The room code is the Agora channel name directly — no backend or database.

**Max participants:** soft-limited to 6 in the UI; enforced only client-side.

## Deployment (Vercel)

```bash
# One-time setup
npm i -g vercel
vercel              # follow prompts, set VITE_AGORA_APP_ID env var in Vercel dashboard
```

`vercel.json` rewrites all routes to `index.html` for client-side routing.

## Environment

Copy `.env.example` → `.env` and fill in your Agora App ID before running locally.
