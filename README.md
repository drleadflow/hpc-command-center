# Blade Command Center

A local-first operations dashboard with voice I/O, project/task management, and AI assistant chat.

## Quick Start

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file:

```
CARTESIA_API_KEY=your_cartesia_api_key_here
```

The Cartesia API key enables text-to-speech for assistant responses. The app works without it (TTS will be disabled).

## Supabase Shadow Migration

The app is now ready for a gradual move off Airtable for `content` and `outreach`.

Default behavior:

- `content` still reads from Airtable unless `CONTENT_DATA_PROVIDER=supabase`
- `outreach` still reads from Airtable unless `OUTREACH_DATA_PROVIDER=supabase`

This means you can sync data into Supabase first without changing the live app.

### 1. Create the shadow tables

Run the SQL in:

```bash
supabase/schema.sql
```

It creates:

- `public.content_items`
- `public.outreach_campaigns`

### 2. Add Supabase env vars

Add these to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional table overrides
SUPABASE_CONTENT_TABLE=content_items
SUPABASE_OUTREACH_TABLE=outreach_campaigns

# Keep Airtable live until you intentionally flip reads
CONTENT_DATA_PROVIDER=airtable
OUTREACH_DATA_PROVIDER=airtable
```

### 3. Sync current systems into Supabase

```bash
npm run sync:supabase
```

Or sync one domain at a time:

```bash
npm run sync:supabase:content
npm run sync:supabase:outreach
```

Dry run:

```bash
node scripts/sync-supabase.mjs all --dry-run
```

### 4. Outreach sync source

By default, outreach sync pulls from Airtable. To sync from your upstream outreach service instead:

```bash
OUTREACH_SYNC_SOURCE=upstream
OUTREACH_API_URL=...
OUTREACH_API_KEY=...
```

### 5. Safe cutover

Only after you verify the shadow tables are healthy should you switch reads:

```bash
CONTENT_DATA_PROVIDER=supabase
OUTREACH_DATA_PROVIDER=supabase
```

This keeps Airtable available as the fallback and avoids a risky all-at-once migration.

## Features

- **Command Center** — Dashboard with projects, tasks, and chat in one view
- **Projects** — Create, archive, and manage workstreams
- **Tasks** — Track tasks with status cycling (TODO → IN PROGRESS → DONE) and priority levels
- **Voice Input** — Browser-native speech recognition (Web Speech API, works best in Chrome)
- **Voice Output** — Cartesia TTS speaks assistant responses aloud (toggle on/off)
- **Chat** — Text and voice chat with the assistant
- **Settings** — Check voice config status, test TTS, manage data

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **SQLite** (better-sqlite3) for local persistence
- **Cartesia TTS** for voice output
- **Web Speech API** for voice input

## Data

All data is stored locally in `blade.db` (SQLite). The database is created automatically on first run.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Command center dashboard
│   ├── projects/page.tsx     # Projects management
│   ├── tasks/page.tsx        # Tasks management
│   ├── settings/page.tsx     # Voice & data settings
│   └── api/
│       ├── projects/route.ts # CRUD for projects
│       ├── tasks/route.ts    # CRUD for tasks
│       ├── chat/route.ts     # Chat messages + simple replies
│       └── tts/route.ts      # Cartesia TTS proxy
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── ChatPane.tsx          # Chat interface with TTS playback
│   ├── VoiceInput.tsx        # Microphone button (Web Speech API)
│   ├── ProjectList.tsx       # Project list + CRUD
│   └── TaskList.tsx          # Task list + CRUD
└── lib/
    ├── db.ts                 # SQLite database setup
    └── types.ts              # TypeScript interfaces
```

## Extending

- **LLM Integration**: Replace the simple reply logic in `api/chat/route.ts` with a real LLM call
- **STT Provider Swap**: Replace `VoiceInput.tsx` Web Speech API with Whisper, Deepgram, etc.
- **Real-time**: Add WebSocket support for live updates
- **Auth**: Add authentication for multi-user support
