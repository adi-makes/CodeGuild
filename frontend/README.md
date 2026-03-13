# CodeGuild — Frontend

Next.js App Router frontend with pixel-art aesthetic and retro scene-based UI.

**Port:** 3000

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in Firebase web config + backend URLs
npm run dev
# Opens http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_BACKEND_CORE_URL` | Core backend URL (default: http://localhost:3001) |
| `NEXT_PUBLIC_BACKEND_AI_URL` | AI backend URL (default: http://localhost:3002) |

### Getting Firebase Web Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → General → Your Apps → Web App
3. Click "SDK setup and configuration" → Copy the config values

## Scenes

| Scene | Description |
|-------|-------------|
| Login | Google Sign-In with pixel art background |
| Town | Town exterior with clickable guild building |
| Guild Interior | Interior with receptionist and quest board hotspots |
| Quest Board | Grid of quests with rank/difficulty filters |
| Submission | Code editor, submit, and AI evaluation result |

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout with pixel font
│   ├── page.tsx          # Scene manager
│   └── globals.css       # Pixel art styles + animations
├── components/
│   ├── HUD.tsx           # Persistent rank/exp overlay
│   └── LoadingScreen.tsx # Transition loading screen
├── scenes/
│   ├── LoginScene.tsx
│   ├── TownScene.tsx
│   ├── GuildInteriorScene.tsx
│   ├── QuestBoardScene.tsx
│   └── SubmissionScene.tsx
├── lib/
│   ├── firebase.ts       # Firebase client init
│   └── types.ts          # Shared TypeScript types
└── public/
    ├── town.jpeg         # Town exterior background
    ├── guild-hall.png    # Guild building overlay
    ├── guild-interior.jpg # Interior background
    └── char.png          # Character avatar
```
