# DPL Hub — Real-Time Tournament Management

A lightweight, real-time tournament CMS for the DOBA Premier League, built with
Next.js 15, TypeScript, Tailwind CSS and Supabase. Every admin change (players,
announcements, fixtures, results, and live scores) appears instantly on every
connected device via Supabase Realtime — no redeploy, refresh, or rebuild required.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the entire contents of `supabase/schema.sql`.
   This creates all tables, enables Row Level Security with public
   read/write policies (no auth — single shared admin panel), enables
   Realtime on every table, and seeds 4 starter teams + a welcome announcement.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Deploy

Deploy to Vercel (or any Next.js host) and add the same two environment
variables in your project settings. Once deployed, any change made in
`/admin` is pushed live to every visitor immediately — the app never needs
to be rebuilt for content changes.

## Architecture

```
Admin Panel (/admin)  →  Supabase tables  →  Supabase Realtime  →  All connected clients
```

- **No Redux / Context / state libraries** — every page is a small client
  component that fetches its table once, then subscribes to
  `postgres_changes` via `lib/useRealtimeTable.ts`.
- **No authentication** — the admin panel is open at `/admin`. For a real
  deployment, put it behind a simple shared passcode, Vercel password
  protection, or Supabase Auth.
- **Design system unchanged** — all original CSS (colors, cards, nav,
  spacing) lives in `app/globals.css` exactly as before; pages are just
  React components using the same class names.

## Pages

| Route        | Description                                      |
|--------------|---------------------------------------------------|
| `/`          | Tournament overview, pinned announcement, live/upcoming match |
| `/players`   | Searchable, filterable player roster              |
| `/fixtures`  | All fixtures with status filters                  |
| `/results`   | Completed match results + archived scorecards     |
| `/live`      | List of live matches                              |
| `/live/[id]` | Live scorecard — runs, wickets, overs, batsmen, bowler, last over |
| `/admin`     | Manage players, announcements, fixtures, results, and live scoring |

## Live scoring

In **Admin → Live Scoring**:

1. Start live scoring from any fixture (creates a `live_matches` row and
   marks the fixture `live`).
2. Set the batting/bowling teams, striker, non-striker and current bowler.
3. Add players to the batting and bowling scorecards.
4. Use the **Quick Scoring** buttons (0–6, W, Wd, Nb) to record each ball —
   this updates the score, overs, striker's figures, bowler's figures, the
   "last over" ball tracker, and rotates the strike automatically.
5. When the match ends, fill in the winner/summary/scores and press
   **Mark Completed & Post Result** — this updates the fixture, archives the
   scorecard, and posts to the Results page, all instantly visible to every
   visitor.
