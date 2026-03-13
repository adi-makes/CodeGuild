# CodeGuild 🏰⚔️

A retro pixel-art coding guild platform where developers take on coding quests, submit solutions, and get AI-powered evaluations.

## Monorepo Structure

```
/codeguild
├── /frontend       → Next.js app (port 3000)
├── /backend-core   → Express server for auth, quests, scoring (port 3001)
├── /backend-ai     → Express server for Gemini AI evaluation (port 3002)
└── README.md
```

## Prerequisites

- Node.js 18+
- A Firebase project with:
  - Authentication (Google Sign-In enabled)
  - Firestore database
  - A Service Account (for backend-core)
- A Google Gemini API key (for backend-ai)

## Quick Start

Open **three terminals** and run each service:

### Terminal 1 — Backend AI

```bash
cd backend-ai
cp .env.example .env      # Fill in GEMINI_API_KEY
npm install
npm start
# Runs on http://localhost:3002
```

### Terminal 2 — Backend Core

```bash
cd backend-core
cp .env.example .env      # Fill in Firebase service account credentials
npm install
npm start
# Runs on http://localhost:3001
```

### Terminal 3 — Frontend

```bash
cd frontend
cp .env.example .env.local   # Fill in Firebase web config + backend URLs
npm install
npm run dev
# Runs on http://localhost:3000
```

## Environment Variables

See the `.env.example` file in each package for the required environment variables.

## How It Works

1. **Login** — Sign in with Google via Firebase Auth
2. **Town Square** — Click the Guild Hall building to enter
3. **Guild Interior** — Click the quest board to browse quests
4. **Quest Board** — Take a quest appropriate for your rank
5. **Submission** — Paste your code solution and submit for AI evaluation
6. **Rank Up** — Earn exp to unlock higher-rank quests and advance from Novice → Master

## Rank System

| Rank | Name | Exp Required |
|------|------|-------------|
| 1 | Novice | 0 |
| 2 | Apprentice | 200 |
| 3 | Journeyman | 500 |
| 4 | Adept | 1000 |
| 5 | Master | 2000 |