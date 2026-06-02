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

2. Copy the example env file and add your keys:

```bash
cp .env.example .env.local
```

Set `ANTHROPIC_API_KEY` for chat. For accounts and credits, create a [Supabase](https://supabase.com) project and add:

- `NEXT_PUBLIC_SUPABASE_URL` — project URL from Supabase → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from the same page

Then run the SQL migration in `supabase/migrations/001_profiles.sql` in the Supabase SQL editor (creates the `profiles` table and signup trigger).

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a new Railway project from the repo.
3. Set the environment variable on the **service** (not just the project):
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from [console.anthropic.com](https://console.anthropic.com/) — paste with **no quotes** and no extra spaces
4. Redeploy after saving the variable (Railway → Deployments → Redeploy).
5. Railway auto-detects Next.js and runs `npm run build` + `npm start`.

Also set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if you use Supabase auth and credits.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Anthropic Claude API via `@anthropic-ai/sdk` (server-side route handler)
- Supabase Auth + Postgres for user profiles and credits
