# CodeGuild — Backend AI

Express server that handles code evaluation using the Google Gemini API.

**Port:** 3002

## Setup

```bash
npm install
cp .env.example .env
# Fill in GEMINI_API_KEY
npm start        # production
npm run dev      # development with nodemon
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini |
| `PORT` | Server port (default: 3002) |

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key" → Create API key
3. Paste the key into `.env`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/evaluate` | Evaluate submitted code against a quest |
| GET | `/health` | Health check |

### POST /api/evaluate

**Request body:**
```json
{
  "questId": "q1",
  "code": "function fizzBuzz(n) { ... }"
}
```

**Response:**
```json
{
  "score": 85,
  "feedback": "The solution correctly implements FizzBuzz...",
  "flags": ["Does not handle n=0 edge case"]
}
```

## Project Structure

```
backend-ai/
├── data/
│   └── quests.json       # Quest definitions (duplicate of backend-core)
├── routes/
│   └── evaluate.js       # Gemini evaluation route
├── index.js              # Express entry point
└── .env.example          # Environment variable template
```
