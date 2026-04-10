# Blade Command Center — Claude Code Handoff

## What This Is

A private internal ops dashboard for **Dr. Lead Flow** (Blade's AI lead-gen agency). Built with Next.js 14 App Router, deployed on Vercel. It's a full internal tool — not a public-facing product.

**Live URL:** https://blade-command-center.vercel.app  
**GitHub:** https://github.com/drleadflow/blade-command-center  
**Deployed:** Auto-deploys from `main` via Vercel

---

## Stack

- **Framework:** Next.js 14 (App Router, `src/` layout)
- **Styling:** Tailwind CSS + CSS custom properties (theme system in `globals.css`)
- **Language:** TypeScript (strict mode OFF — `ignoreBuildErrors: true`)
- **Data layer:**
  - **Airtable** — content calendar, tasks, projects, leads, invoices
  - **Meta Graph API v19.0** — ad accounts, campaigns, ad sets, creatives
  - **GitHub API** — blade-ops repo (projects, tasks), blade-vault (Obsidian)
  - **MySQL** — `DATABASE_URL` (optional; only used for logging/activity)
  - **Slack API** — team notifications (#advisors channel)
  - **Mux** — video upload/playback (video review system)
  - **Anthropic Claude** — AI chat pane, BI council reports
- **Drag and drop:** `@hello-pangea/dnd`
- **Voice:** Cartesia TTS API + Web Speech API

---

## Environment Variables (set in Vercel + `.env.local`)

```
AIRTABLE_API_KEY=           # Main Airtable PAT
AIRTABLE_CONTENT_API_KEY=   # Separate key for content table (falls back to AIRTABLE_API_KEY)
META_USER_TOKEN=            # Meta System User token — NEVER expires
ANTHROPIC_API_KEY=          # Claude API
GITHUB_TOKEN=               # PAT with repo access
GITHUB_OWNER=drleadflow
GITHUB_REPO=blade-ops
SLACK_BOT_TOKEN=            # Slack bot token
MUX_TOKEN_ID=               # Mux video API
MUX_TOKEN_SECRET=
CARTESIA_API_KEY=           # TTS voice
DATABASE_URL=               # MySQL connection string (optional)
```

**Note on Meta token:** It's a System User token from business.facebook.com → never expires. The old short-lived user tokens have been replaced. Do NOT add refresh logic.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard homepage (stats, goals, activity feed)
│   ├── layout.tsx                  # Root layout — Sidebar + theme CSS vars
│   ├── globals.css                 # Theme system (CSS vars: --bg, --surface, --text, etc.)
│   │
│   ├── content/
│   │   ├── page.tsx                # Content OS page wrapper
│   │   └── ContentBoard.tsx        # ⭐ Main content CMS (kanban + edit modal)
│   │
│   ├── ads/page.tsx                # Meta Ads dashboard (all clients)
│   ├── leads/page.tsx              # Lead tracking
│   ├── analytics/page.tsx          # Social analytics + Page Insights
│   ├── projects/page.tsx           # Project tracker (GitHub blade-ops)
│   ├── tasks/page.tsx              # Task manager (Airtable)
│   ├── invoices/page.tsx           # Invoice tracker
│   ├── media/page.tsx              # Media card board
│   ├── video/page.tsx              # Video review system (Mux)
│   ├── calendar/page.tsx           # Content calendar
│   ├── automation/page.tsx         # GHL + ManyChat automation status
│   ├── os/page.tsx                 # Agency OS map
│   ├── wiki/                       # Internal wiki by department
│   ├── log/page.tsx                # Activity log
│   ├── uptime/page.tsx             # Service uptime monitor
│   ├── advisor/page.tsx            # AI advisor (Claude chat)
│   ├── client/[slug]/page.tsx      # Per-client dashboard
│   ├── departments/[department]/   # Department views (marketing, client-success)
│   ├── review/[id]/page.tsx        # Video review w/ comments
│   ├── competitors/page.tsx        # Competitor intel
│   ├── webinar/page.tsx            # Webinar page
│   ├── settings/page.tsx           # App settings
│   └── about/page.tsx
│
├── app/api/
│   ├── content/route.ts            # GET + PATCH content items (Airtable)
│   ├── ads/route.ts                # GET Meta ads data (all clients)
│   ├── ads/toggle/route.ts         # POST pause/enable ad
│   ├── leads/route.ts              # GET leads (Airtable)
│   ├── tasks/route.ts              # GET/POST tasks (Airtable)
│   ├── projects/route.ts           # GET projects (GitHub blade-ops)
│   ├── invoices/route.ts           # GET invoices (Airtable)
│   ├── goals/route.ts              # GET/POST goals
│   ├── chat/route.ts               # POST AI chat (Anthropic streaming)
│   ├── bi-report/route.ts          # GET latest BI council report
│   ├── activity/route.ts           # GET activity feed
│   ├── log/route.ts                # POST activity log
│   ├── media-cards/route.ts        # GET media cards
│   ├── uptime/route.ts             # GET service uptime
│   ├── analytics/page-insights/    # Meta Page Insights
│   ├── automation/
│   │   ├── ghl/route.ts            # GHL workflow status
│   │   └── manychat/route.ts       # ManyChat flow status
│   ├── client/[slug]/ads/route.ts  # Per-client ad data
│   ├── slack/
│   │   ├── members/route.ts        # Slack team members
│   │   └── notify/route.ts         # POST send Slack notification
│   ├── tools/
│   │   ├── airtable/route.ts       # Generic Airtable tool endpoint
│   │   └── meta/route.ts           # Generic Meta tool endpoint
│   ├── video/
│   │   ├── assets/route.ts         # Mux video assets list
│   │   ├── assets/[id]/route.ts    # Single Mux asset
│   │   ├── upload/route.ts         # Mux upload URL
│   │   └── comments/               # Video review comments
│   ├── lyra-bridge/route.ts        # ElevenLabs TTS bridge (Lyra voice)
│   ├── tts/route.ts                # Cartesia TTS
│   ├── wiki/route.ts               # Wiki content
│   └── webhooks/vercel/route.ts    # Vercel deploy → Telegram alert
│
├── components/
│   ├── Sidebar.tsx                 # Left nav (collapsible, mobile hamburger)
│   ├── ChatPane.tsx                # AI chat sidebar panel
│   ├── ActivityFeed.tsx            # Dashboard activity feed
│   ├── BICouncilPanel.tsx          # BI report display
│   ├── GoalsPanel.tsx              # Goals widget
│   ├── ProjectList.tsx             # Project list component
│   ├── TaskList.tsx                # Task list component
│   ├── MediaBoard.tsx              # Media card grid
│   ├── UptimePanel.tsx             # Uptime status panel
│   ├── VideoDetailModal.tsx        # Video review modal
│   ├── VoiceAvatar.tsx             # Animated voice avatar
│   ├── VoiceInput.tsx              # Web Speech API input
│   ├── SuperchatVoice.tsx          # Voice chat component
│   └── DarkModeToggle.tsx          # Dark/light mode toggle
│
└── lib/
    ├── constants.ts                # Client configs, ad account IDs
    ├── types.ts                    # Shared TypeScript types
    ├── github.ts                   # GitHub API helpers
    ├── db.ts                       # MySQL connection (optional)
    └── db-mysql.ts                 # MySQL queries
```

---

## Theme System

Everything uses CSS custom properties defined in `globals.css`. Key vars:

```css
--bg           /* page background */
--surface      /* cards, modals */
--border       /* borders */
--text         /* primary text */
--muted        /* secondary/dim text */
--accent       /* brand color (indigo/purple) */
```

CSS utility classes: `themed-text`, `themed-muted`, `themed-border`, `card`

Dark mode toggles via `.dark` on `<html>`. Use `DarkModeToggle` component.

**Don't use hardcoded colors.** Use CSS vars or Tailwind with `themed-*` classes.

---

## Client / Ad Account Map

Defined in `src/lib/constants.ts`:

| Client | Ad Account ID |
|--------|--------------|
| HealthProceo | act_2549125178703715 |
| Vitality & Aesthetics | act_744129051650635 |
| IV Wellness | act_1707066474017114 |
| Corrective Skin Care | act_361114249531815 |

---

## Content OS (Most Active Feature)

**Files:** `src/app/content/ContentBoard.tsx` + `src/app/api/content/route.ts`

### Airtable Table
- Base: `app93tcET7pw7UUTx`
- Table: `tblwH8cA11yfZcz7m`

### Key Airtable Field Names (emoji-prefixed — exact match required)
```
"👦 Name"              → title
"⭐️ Status"           → status
"🚀 Content Type"      → contentType  
"📲 Upload Location"   → platforms (multi-select array)
"🗓️ Post Time"         → postTime
"🪝 Hook"              → hook
"✍️ Copy"              → copy/caption
"✍️ Script"            → script
"🎁 CTA Link"          → ctaLink
"🖥️ Finished Video"    → finishedVideo
"🎥 Raw Link"          → rawLink
"🔗 PostLink"          → postLink
"👀 Views"             → views
"👍 Likes"             → likes
"🔄 Shares"            → shares
"🔖 Saves"             → saves
"💬 # of Comments"     → comments
"📖 Title"             → title (fallback)
"Month"                → month
"Created"              → createdAt
```

### Edit Modal Tabs
1. **Write** (default) — status, type, post date, hook, copy, script, CTA link, finished video URL (with embed), raw footage URL, live post link
2. **Platforms** — multi-select toggle grid
3. **Analytics** — views/likes/shares/saves/comments with auto-calculated engagement rate

PATCH to `/api/content` with `{ id, fields: { "Airtable Field Name": value } }`.

### Video Embeds
`VideoEmbed` component handles: YouTube, Loom, Vimeo, direct `.mp4/.mov/.webm`. Falls back to link if unrecognized.

---

## Meta Ads API

- Version: `v21.0`
- Token: `META_USER_TOKEN` env var (System User token — never expires)
- **IMPORTANT: When asked about ad performance, call the Meta Graph API directly — do NOT use the Command Center /api/ads endpoints (they require auth).**

### Direct API call pattern:
```bash
TOKEN="$META_USER_TOKEN"
# Or use this permanent System User token:
# EAAPUZBNvEEekBRGSAkAmauNRarfCqsZCOZAPKBxcuLZBZAHepqyM2NdXbwtIA6DpBPKCJCDpKxlc7WnZCs7ByGhcDKOZBX6G8sYKEUGXw6VWb2g1JmvmsJupR1Ijb2SjWNhIZBFcR6zMBLnzehnSAiYAyn5UFtaEE42TBZBokAzirZBirOyXbcvq5niXMMEZAqP9YlmpQZDZD

# HealthProceo account
curl -s "https://graph.facebook.com/v21.0/act_2549125178703715/insights?fields=campaign_name,impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type&level=campaign&date_preset=last_7d&access_token=$TOKEN"

# IV Wellness account
curl -s "https://graph.facebook.com/v21.0/act_1707066474017114/insights?fields=campaign_name,impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type&level=campaign&date_preset=last_7d&access_token=$TOKEN"
```

### Ad Accounts:
| Client | Account ID |
|--------|-----------|
| HealthProceo | act_2549125178703715 |
| IV Wellness | act_1707066474017114 |

- Main endpoint (fallback): `src/app/api/ads/route.ts`
- Per-client: `src/app/api/client/[slug]/ads/route.ts`

Key metrics pulled: `spend, impressions, reach, clicks, ctr, cpc, cpm, frequency, actions (leads, messages, link_clicks), video_thruplay_watched_actions, video_p25_watched_actions, cost_per_action_type`

Calculated: `CPL, hook rate (25% video view rate), hold rate (thruplay/25%), engagement rate, CVR`

---

## GitHub Data Layer

- **blade-ops** repo = operational data (projects, tasks, metrics)
- **blade-vault** repo = Obsidian vault (markdown notes, BI reports)
- Helper: `src/lib/github.ts`
- Used by: projects, tasks, BI council panel, wiki pages

---

## Sidebar Navigation

`src/components/Sidebar.tsx` — all routes defined here. Add new pages here too.

Current nav items: Home, Content OS, Ads, Leads, Analytics, Projects, Tasks, Invoices, Media, Video, Calendar, Automation, OS, Wiki, Log, Uptime, Advisor, Clients, Departments, Settings

---

## Known Issues / Pending Work

1. **Content `copy` field truncated to 300 chars** in GET route — needs to be removed for full edit support (currently `clean(f["✍️ Copy"]).slice(0, 300)` — fix to not slice)
2. **Script field truncated to 500 chars** same issue — `clean(f["✍️ Script"]).slice(0, 500)`
3. **ElevenLabs/Lyra voice broken** — API key expired. `/api/lyra-bridge` exists but needs fresh key
4. **MySQL optional** — `DATABASE_URL` may not be set in all envs. Guard all mysql queries
5. **TypeScript errors suppressed** — `ignoreBuildErrors: true` in `next.config.js`. Fix types properly when refactoring

---

## Immediate Next Tasks

- [ ] Remove `.slice(0, 300)` and `.slice(0, 500)` truncation in content GET route so full copy/script load in edit modal
- [ ] Add "Create New" button on Content OS page (POST to Airtable)
- [ ] Content calendar view (group by `postTime` date)
- [ ] Bulk status update on Content OS
- [ ] Client dashboard (`/client/[slug]`) — pull live data per client (currently mostly static)
- [ ] Video review system — complete comment threading in `/review/[id]`
- [ ] Mobile layout polish on Content OS modal

---

## Dev Commands

```bash
npm run dev      # localhost:3000
npm run build    # production build
git push origin main  # auto-deploys to Vercel
```

No test suite currently. Build is the test (`npm run build` must pass before commit).

---

## Deploy

Vercel project connected to `drleadflow/blade-command-center` on GitHub.  
Push to `main` → auto-build → Vercel webhook fires → Telegram alert sent to Blade.

Vercel env vars must be set separately from `.env.local` (`.env.local` is gitignored).
