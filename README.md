# Trondbot

Simple language-learning AI chat. Practice conversation in your target language with instant corrections and hover translations.

## Features

- Chat with an AI tutor in your target language
- See a corrected version of each message you send (hover for explanation in your native language)
- Hover any word in the agent's reply to see its translation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and add your Anthropic API key:

```bash
cp .env.example .env.local
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a new Railway project from the repo.
3. Set the environment variable:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
4. Railway auto-detects Next.js and runs `npm run build` + `npm start`.

No database or additional services required.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Anthropic Claude API via `@anthropic-ai/sdk` (server-side route handler)
