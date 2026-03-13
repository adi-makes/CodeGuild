# CodeGuild — Backend Core

Express server handling auth, quest logic, scoring, and Firestore writes.

**Port:** 3001

## Setup

```bash
npm install
cp .env.example .env
# Fill in the .env values (see below)
npm start        # production
npm run dev      # development with nodemon
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (with literal `\n` for newlines) |
| `PORT` | Server port (default: 3001) |
| `BACKEND_AI_URL` | URL of the backend-ai service (default: http://localhost:3002) |

### Getting Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the `project_id`, `client_email`, and `private_key` values into `.env`
4. For `FIREBASE_PRIVATE_KEY`, wrap the value in double quotes and keep `\n` as literal characters

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/users/init` | Initialize user doc on first login |
| GET | `/api/users/:userId` | Get user data from Firestore |
| GET | `/api/quests` | Get all quests (optional `?rank=N` filter) |
| POST | `/api/submit` | Submit code for a quest |
| GET | `/health` | Health check |

## Project Structure

```
backend-core/
├── config/
│   ├── ranks.js       # Rank definitions and helper functions
│   └── scoring.js     # Score → exp calculation
├── data/
│   └── quests.json    # Hardcoded quest definitions
├── routes/
│   ├── users.js       # User init and fetch routes
│   ├── quests.js      # Quest listing route
│   └── submit.js      # Submission handling route
├── index.js           # Express entry point
└── .env.example       # Environment variable template
```
