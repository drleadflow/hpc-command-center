# HPC Command Center — Complete Project Handoff

## What This Is

A private internal ops dashboard for **Dr. Lead Flow** (Blade's AI lead-gen agency) serving health clinics (medspa, dental, chiropractic, psychiatry, wellness). Built with Next.js 14 App Router, deployed on Vercel. Two audiences: **admins** (CEO, Ops Manager) see the full command center; **employees** (setters, closers, coaches, editors, etc.) see a focused daily-work portal.

**Live URL:** https://flowhub-deploy-mu.vercel.app
**GitHub:** https://github.com/drleadflow/hpc-command-center
**Deployed:** Auto-deploys from `main` via Vercel

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router, `src/` layout) |
| **Language** | TypeScript (strict mode ON) |
| **Styling** | Tailwind CSS + CSS custom properties (theme in `globals.css`) |
| **Database** | Supabase (PostgreSQL) primary, SQLite (better-sqlite3) local fallback, MySQL optional |
| **AI/LLM** | Anthropic Claude (ai SDK) + OpenAI (fallback) |
| **Auth** | NextAuth (Google OAuth + password fallback) |
| **External APIs** | Airtable, Meta Graph API v19.0, GitHub, Slack, Mux, Cartesia TTS, Firecrawl, Apify, GHL, UptimeRobot |
| **Drag & Drop** | @hello-pangea/dnd |
| **Voice** | Cartesia TTS + Web Speech API (browser) |
| **Video** | Mux (upload + playback + comments) |
| **Monorepo** | npm workspaces (`packages/core`, `packages/db`, `packages/shared`, `packages/docker-runner`) |

---

## Role-Based Access (CRITICAL)

The entire app switches UI based on the active role. This is the most important architectural concept.

### Roles (defined in `src/lib/types.ts`)

| Role | Type | Department | Sidebar | Dashboard |
|------|------|------------|---------|-----------|
| `ceo` | Admin | ceo | AdminSidebar | BridgeDashboard |
| `ops_manager` | Admin | ceo | AdminSidebar | BridgeDashboard |
| `marketing_lead` | Employee | marketing | EmployeeSidebar | MyDayDashboard |
| `content_editor` | Employee | marketing | EmployeeSidebar | MyDayDashboard |
| `appointment_setter` | Employee | sales | EmployeeSidebar | MyDayDashboard |
| `sales_closer` | Employee | sales | EmployeeSidebar | MyDayDashboard |
| `ai_tech_specialist` | Employee | fulfillment | EmployeeSidebar | MyDayDashboard |
| `csm_lead_coach` | Employee | fulfillment | EmployeeSidebar | MyDayDashboard |
| `bookkeeper` | Employee | finance | EmployeeSidebar | MyDayDashboard |

### How It Works

- **`src/lib/role-context.tsx`** — React context provides `role`, `isAdmin`, `memberName`, `setRole()`
- **`src/components/RoleSwitcher.tsx`** — Fixed bottom-right button to switch roles (for dev/demo)
- **`src/components/AuthGuardedLayout.tsx`** — Renders AdminSidebar or EmployeeSidebar based on `isAdmin`
- **`src/app/page.tsx`** — Renders BridgeDashboard (admin) or MyDayDashboard (employee)
- Role persists in `localStorage` key `hpc_role`

### Growth Engine Stages Per Role

Each role owns specific stages of the 8-stage growth funnel. Defined in `ROLE_STAGES` (`src/lib/types.ts`):

```
ceo / ops_manager    → all stages
marketing_lead       → awareness, capture, webinar, nurture
content_editor       → awareness
appointment_setter   → setter
sales_closer         → close
ai_tech_specialist   → handoff, crm
csm_lead_coach       → handoff
bookkeeper           → (none)
```

The EmployeeSidebar dynamically shows Playbook links for only the stages that role owns.

---

## Navigation Structure

### Admin View (AdminSidebar)

```
BRIDGE (Command Center)
  / .................... Dashboard (BridgeDashboard)
  /scorecard ........... Team scorecard
  /advisor ............. AI advisor chat

GROWTH ENGINE
  /content ............. Content OS (kanban)
  /outreach ............ Outreach campaigns
  /ads ................. Meta Ads dashboard
  /leads ............... Lead tracking
  /analytics ........... Social analytics
  /pipeline ............ Sales pipeline
  /growth .............. 8-stage funnel overview
  /growth/[stage] ...... Per-stage view (awareness, capture, etc.)

FULFILL
  /deliver ............. Delivery overview
  /deliver/builds ...... Active client builds
  /deliver/coaching .... Coaching members
  /deliver/launch ...... Launch board (kanban)
  /clients ............. All clients

TEAM
  /team ................ Team management hub
  /team/tracking ....... Daily tracking compliance
  /team/scorecard ...... Weekly performance
  /team/reviews ........ Performance reviews
  /team/policies ....... HR policies

MONEY
  /money ............... MRR dashboard + earnings + pay bands
  /money/commission .... Commission log
  /money/invoices ...... Contractor invoices
  /numbers ............. Key metrics

TOOLS
  /settings ............ API connections
  /wiki ................ Internal wiki
  /automation .......... GHL + ManyChat status
  /uptime .............. Service monitoring
  /video ............... Video review (Mux)
  /calendar ............ Content calendar
  /log ................. Activity log
```

### Employee View (EmployeeSidebar)

```
CORE
  / .................... My Day (MyDayDashboard)
  /work ................ My Work (task board)
  /numbers ............. My Numbers

COMMUNITY (new)
  /company ............. Mission, Values, KPIs, Client Wins
  /growth-plan ......... Career ladder, Skills, Onboarding, 1:1 prep
  /recognition ......... Badges, Streaks, Milestones
  /feed ................ Team feed, Kudos, Coffee roulette, Suggestions

PLAYBOOK (role-filtered)
  /growth/[stage] ...... Only stages this role owns

MONEY
  /money ............... Earnings, Pay bands, Bonus tiers
  /money/commission .... Commission tracking
```

---

## Employee Portal Pages (New — from FlowHub Mockup)

### `/company` — Company & Culture
- **Mission**: "We help health clinics scale their business with AI, without burning out."
- **Vision**: "By 2030, every health clinic runs on AI-powered systems..."
- **5 Core Values**: Outcomes Over Activity, Radical Transparency, Bias to Action, Default to Trust, Always Learning
- **Q2 KPIs**: Editable inline (New Clients, MRR, Retention, NPS) with progress bars
- **Client Win of the Week**: Editable testimonial card
- Store keys: `hpc_company_kpis`, `hpc_client_wins`

### `/growth-plan` — Growth & Development (role-filtered)
- **Onboarding Hub**: 7-step checklist with progress bar, click to toggle completion
- **Quick Links**: 3x3 grid (Dialer, GHL, Loom, SOPs, Slack, Calendar, AI Advisor, Reports, Help Desk)
- **Career Ladder**: Role-specific track (sales/marketing/tech/etc.), highlights current position
- **Skills Matrix**: 8 role-specific skills with self-rated (click to change) and verified (read-only) dot ratings
- **1:1 Prep**: Date/time + editable agenda + last 1:1 action items
- Store keys: `hpc_onboarding_progress`, `hpc_career_progress`, `hpc_skills_matrix_{role}`, `hpc_one_on_one`

### `/recognition` — Recognition Dashboard
- **Milestones**: 4 cards (birthdays, anniversaries, achievements) with "Celebrate" button
- **Active Streaks**: 4 trackers (EOD report, weekly goal, response time, kudos) with +1 increment
- **Badges**: 5 earned (solid accent border) + 7 locked (dashed muted border)
- Store keys: `hpc_milestones`, `hpc_streaks`, `hpc_badges`

### `/feed` — Team Social Feed
- **Post Composer**: Textarea + type selector (Update/Win/Announcement/Kudos) + Post button
- **Filter Bar**: All | Wins | Announcements | Kudos | Life Events
- **Post Feed**: Avatar, name, role badge, type badge, like toggle, comment count
- **Kudos Panel**: Give kudos form (recipient, category, message), received list, weekly leaderboard
- **Coffee Roulette**: Opt-in toggle, weekly random match, confirm/skip
- **Anonymous Suggestion Box**: Submit + privacy notice + acted-on history
- Store keys: `hpc_feed_posts`, `hpc_kudos_received`, `hpc_kudos_given`, `hpc_coffee_roulette`, `hpc_suggestions`

---

## Client Portal (`/portal/[token]`)

External-facing page for clients to view their ad performance and workbook progress. **No sidebar, no auth** — accessed via token link.

### Token Generation
```bash
curl -X POST https://flowhub-deploy-mu.vercel.app/api/portal \
  -H "Content-Type: application/json" \
  -d '{"clientSlug": "healthproceo", "expiresInDays": 30}'
# Returns { token, url, expiresAt }
```

### Portal Tabs
1. **Performance** — Meta Ads stats (spend, leads, CPL, CTR, impressions, reach), daily spend chart, campaign tables
2. **Workbook Progress** — Overall progress ring, 8 module cards with status badges, links to workbook.healthproceo.com
3. **Resources** — Quick links to workbook and clinic app, embedded iframe

### Workbook API
- `GET /api/portal/[token]/workbook` — Get module progress
- `PATCH /api/portal/[token]/workbook` — Update module (`{ moduleId, status, progress }`)

### Valid Client Slugs
`healthproceo`, `vitality`, `iv-wellness`, `corrective-skin`

---

## Data Layer

### Supabase (Primary)

Connection: `src/lib/supabase.ts` exports `supabase` (server) and `supabaseClient` (browser)

**Tables:**
- `projects` — id, name, description, status, department
- `tasks` — id, project_id, department, title, status, priority, assigned_to, due_date
- `team_members` — id, name, email, role, department, hpc_role, status
- `messages` — id, role (user|assistant), content
- `notifications` — id, type, title, body, read
- `daily_logs` — id, department, date, wins[], blockers[], notes
- `content_items` — synced from Airtable (see supabase/schema.sql)
- `outreach_campaigns` — synced from Airtable
- `daily_priorities` — title, urgency, completed, date (see supabase/priorities.sql)
- `workbook_progress` — portal_token, client_slug, module_id, status, progress
- `portal_links` — token, client_slug, client_name, expires_at

**Functions exported from `src/lib/db.ts`** (re-exports db-supabase.ts):
getProjects, createProject, updateProject, getTasks, createTask, updateTask, deleteTask, getTeamMembers, createTeamMember, getNotifications, createNotification, markNotificationRead, getPortalLink, createPortalLink, getWorkbookProgress, updateWorkbookModule, and ~40 more.

### localStorage (Employee Features)

All employee portal data persists client-side via `src/lib/store.ts`:

```typescript
import { store } from "@/lib/store";
store.read("hpc_feed_posts", []);     // read with fallback
store.write("hpc_feed_posts", posts); // write
store.update("hpc_streaks", [], fn);  // read-modify-write
```

**45 store keys** — see `StoreKey` type in `src/lib/store.ts` for the full list.

### Airtable (Legacy, being migrated)

Content and outreach still read from Airtable by default. Supabase shadow tables exist but won't activate until `CONTENT_DATA_PROVIDER=supabase` env var is set.

- Content Base: `app93tcET7pw7UUTx` / Table: `tblwH8cA11yfZcz7m`
- Field names are emoji-prefixed (e.g., `"👦 Name"`, `"⭐️ Status"`) — must match exactly
- Sync script: `npm run sync:supabase` (Airtable → Supabase, one-way)

---

## Theme System

All UI uses CSS custom properties in `src/app/globals.css`. **Never hardcode colors.**

```css
/* Light mode (default) */
--bg: #f0ede6          /* page background */
--surface: #ffffff     /* cards, panels */
--border: #e5e1d8      /* dividers */
--text: #1a1916        /* primary text */
--text-secondary: #6b6560
--muted: #807a73       /* labels, hints */
--accent: #2d5a4e      /* brand green — buttons, links, active states */
--accent-bg: #e8f0ed   /* accent background tint */
--success: #059669
--danger: #b91c1c
--warning: #d97706
```

**Dark mode:** Activated by `.dark` class on `<html>`. All vars have dark overrides.

**CSS utility classes:**
- `themed-text`, `themed-muted`, `themed-secondary`, `themed-border`
- `card` — standard card (surface bg, border, border-radius: 20px)
- `card-subtle` — lighter card variant

**Tailwind config** (`tailwind.config.ts`): Custom `blade`, `cream`, `sage`, `warm` color palettes + `serif`/`sans` font families.

---

## Authentication

### NextAuth (`src/app/api/auth/[...nextauth]/route.ts`)

**Providers:**
1. **Google OAuth** — `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (includes Calendar read scope)
2. **Credentials** — password-based, checks `DASHBOARD_PASSWORD` env var (fallback: `"Skool!@90"`)

**Sign-in page:** `/auth/signin`

**Important:** API routes are NOT auth-protected. If deploying publicly beyond the team, add NextAuth session checks to route handlers.

---

## Environment Variables

### Required (set in Vercel + `.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI
ANTHROPIC_API_KEY=

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=

# Meta Ads (System User token — NEVER expires, no refresh logic)
META_USER_TOKEN=

# Airtable
AIRTABLE_API_KEY=
AIRTABLE_CONTENT_API_KEY=    # falls back to AIRTABLE_API_KEY
AIRTABLE_BASE_ID=

# GitHub
GITHUB_TOKEN=
GITHUB_OWNER=drleadflow
GITHUB_REPO=blade-ops

# Slack
SLACK_BOT_TOKEN=

# Video
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# Voice
CARTESIA_API_KEY=
```

### Optional

```bash
DATABASE_URL=              # MySQL (logging only)
OPENAI_API_KEY=            # Fallback LLM
YOUTUBE_API_KEY=           # YouTube analytics
APIFY_TOKEN=               # Social media scraping
GHL_API_KEY=               # GoHighLevel CRM
GHL_LOCATION_ID=
MANYCHAT_TOKEN=
ELEVENLABS_API_KEY=        # TTS (key may be expired)
TELEGRAM_BOT_TOKEN=        # Deploy alerts
TELEGRAM_CHAT_ID=
UPTIMEROBOT_API_KEY=
STRIPE_SECRET_KEY=
FIRECRAWL_API_KEY=         # Web scraping
DASHBOARD_PASSWORD=        # Override default login password
NEXT_PUBLIC_APP_URL=       # Defaults to http://localhost:3000
```

---

## Meta Ads API

- **Version:** v19.0 (used in portal) / v21.0 (used in ads dashboard)
- **Token:** `META_USER_TOKEN` — System User token from business.facebook.com. Never expires. Do NOT add refresh logic.

### Ad Account Map

| Client | Account ID | Slug |
|--------|-----------|------|
| HealthProceo | act_2549125178703715 | healthproceo |
| Vitality & Aesthetics | act_744129051650635 | vitality |
| IV Wellness | act_1707066474017114 | iv-wellness |
| Corrective Skin Care | act_361114249531815 | corrective-skin |

### Metrics Pulled
`spend, impressions, reach, clicks, ctr, cpc, cpm, frequency, actions (leads, messages, link_clicks), video_thruplay_watched_actions, video_p25_watched_actions, cost_per_action_type`

### Calculated Metrics
`CPL (spend/leads), hook rate (25% video views / impressions), hold rate (thruplay / 25% views), engagement rate, CVR`

---

## Content OS

**Files:** `src/app/content/ContentBoard.tsx` + `src/app/api/content/route.ts`

### Airtable Field Names (emoji-prefixed — MUST match exactly)
```
"👦 Name"           → title          "🪝 Hook"            → hook
"⭐️ Status"         → status         "✍️ Copy"            → copy
"🚀 Content Type"   → contentType    "✍️ Script"          → script
"📲 Upload Location" → platforms      "🎁 CTA Link"       → ctaLink
"🗓️ Post Time"      → postTime       "🖥️ Finished Video"  → finishedVideo
"👀 Views"          → views          "🎥 Raw Link"        → rawLink
"👍 Likes"          → likes          "🔗 PostLink"        → postLink
"🔄 Shares"         → shares         "📖 Title"           → title (fallback)
"🔖 Saves"         → saves          "Month"             → month
"💬 # of Comments"  → comments       "Created"           → createdAt
```

PATCH to `/api/content` with `{ id, fields: { "Airtable Field Name": value } }`.

---

## Team Data (`src/lib/team-data.ts`)

Source of truth for HR/org data:

- **ROLES**: 9 role definitions with title, rateType, reportsTo, manages, functions[], kpis[]
- **COMMISSION_TABLE**: Path A ($997), Path B ($3K), Path C ($5K) with role splits
- **SCALE_ROADMAP**: 3 phases (Foundation → Growth → Scale) with triggers and actions
- **ONBOARDING_STEPS**: 10 steps (Day 0 through Day 30+)
- **TOUCHPOINTS**: Daily standup, weekly sync, monthly review, quarterly planning
- **REVIEW_CYCLES**: 30-day, 90-day, monthly, quarterly, PIP
- **CORE_POLICIES**: 9 policies (agreements, NDA, IP, termination, etc.)

---

## AI Skills (`skills/` directory)

15 YAML-defined skill templates. Not executable code — define system prompts, tools, and versions for an external skill engine.

| Skill | Purpose |
|-------|---------|
| morning-briefing | Daily priority setting with brain dump → scoring → top 3 |
| clarity-compass | 4-filter strategic decision framework |
| delegation-brief | 10-80-10 task handoff structure |
| value-equation | Hormozi's Value Equation for offer optimization |
| offer-builder | Premium offer architecture with 3-tier Goldilocks pricing |
| lead-scorer | BANT framework lead qualification (1-5 scoring) |
| fast-cash-play | 7-day flash offer campaign for existing customers |
| nurture-cadence | 7-day front-loaded lead nurture with show-up reminders |
| reactivation-sequence | 3-message casual SMS re-engagement for cold leads |
| sop-generator | Transform processes into structured SOPs |
| competitor-monitor | Weekly competitor pricing/feature/content tracking |
| web-researcher | Multi-query web research with cross-referencing |
| code-reviewer | Code review for bugs, security, performance, style |
| code-writer | Code generation following project conventions |
| weekly-reflection | Friday ritual: wins, lessons, growth, gratitude, next week |

---

## Monorepo Packages (`packages/`)

| Package | Purpose | Key Deps |
|---------|---------|----------|
| `@blade/shared` | Zod types, shared utilities | zod |
| `@blade/db` | SQLite + Drizzle ORM | better-sqlite3, drizzle-orm |
| `@blade/core` | AI pipeline, cron, security, voice, RAG | @anthropic-ai/sdk, openai, node-cron, livekit |
| `@blade/docker-runner` | Docker container + Git ops | dockerode, @octokit/rest |

Build all: `npm run build:packages` (chains shared → db → core → docker-runner)

---

## Known Issues & Tech Debt

| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Content copy truncated to 300 chars | HIGH | `/api/content/route.ts` | Remove `.slice(0, 300)` |
| Script truncated to 500 chars | HIGH | `/api/content/route.ts` | Remove `.slice(0, 500)` |
| ElevenLabs API key expired | MEDIUM | `/api/lyra-bridge` | Get fresh key from ElevenLabs |
| Hardcoded fallback password | MEDIUM | `/api/auth/[...nextauth]` | Remove `"Skool!@90"`, use env var only |
| API routes not auth-protected | MEDIUM | All `/api/*` routes | Add NextAuth session checks |
| Airtable still primary for content | LOW | `/api/content/route.ts` | Set `CONTENT_DATA_PROVIDER=supabase` |
| MySQL guard needed | LOW | Any `db-mysql.ts` usage | Check `DATABASE_URL` before querying |
| Employee features use localStorage only | LOW | All new portal pages | Migrate to Supabase for persistence across devices |

---

## Pending Work / Roadmap

### High Priority
- [ ] Remove `.slice()` truncation in content GET route (copy + script fields)
- [ ] Add "Create New" button on Content OS (POST to Airtable)
- [ ] Auth-protect API routes (add NextAuth middleware)
- [ ] Migrate employee portal data from localStorage to Supabase tables

### Medium Priority
- [ ] Content calendar view (group by `postTime` date)
- [ ] Bulk status update on Content OS
- [ ] Complete client dashboard (`/client/[slug]`) with live per-client data
- [ ] Video review system — comment threading in `/review/[id]`
- [ ] Coffee Roulette backend — actual random matching via cron
- [ ] Kudos/feed persistence to Supabase (currently localStorage only)
- [ ] Skills matrix — "Request a skill review" workflow
- [ ] Suggestion box — admin review/action pipeline

### Low Priority
- [ ] Mobile layout polish on Content OS modal
- [ ] Flip content/outreach reads to Supabase (`CONTENT_DATA_PROVIDER=supabase`)
- [ ] Refresh ElevenLabs API key
- [ ] Add test suite (currently none — build is the test)
- [ ] Career ladder progression logic (auto-advance based on KPI thresholds)
- [ ] Badge unlock automation (trigger badges from real events)

---

## Dev Commands

```bash
npm install                    # Install all dependencies
npm run dev                    # localhost:3000 with hot reload
npm run build                  # Production build (MUST pass before push)
npm run build:packages         # Build monorepo packages
npm run sync:supabase          # Sync Airtable → Supabase (all tables)
npm run sync:supabase:content  # Sync content only
npm run sync:supabase:outreach # Sync outreach only
git push origin main           # Auto-deploys to Vercel
```

---

## Deploy

- **Platform:** Vercel
- **Repo:** `drleadflow/hpc-command-center` on GitHub
- **Branch:** `main` (auto-deploy on push)
- **Webhook:** Vercel deploy → Telegram alert to Blade
- **Env vars:** Must be set in Vercel dashboard separately from `.env.local`
- **Build command:** `npm run build` (defined in `vercel.json`)

---

## File Map (Quick Reference)

```
src/
├── app/
│   ├── layout.tsx .............. Root layout (SessionProvider + AuthGuardedLayout)
│   ├── page.tsx ................ Home (BridgeDashboard | MyDayDashboard)
│   ├── globals.css ............. Theme system (CSS vars)
│   ├── company/page.tsx ........ Company culture (Mission, Values, KPIs)
│   ├── growth-plan/page.tsx .... Career development (role-filtered)
│   ├── recognition/page.tsx .... Badges, streaks, milestones
│   ├── feed/page.tsx ........... Team social feed + kudos
│   ├── work/page.tsx ........... Employee task board
│   ├── content/page.tsx ........ Content OS wrapper
│   ├── ads/page.tsx ............ Meta Ads dashboard
│   ├── money/page.tsx .......... MRR + earnings + pay bands
│   ├── team/page.tsx ........... Team management hub
│   ├── portal/[token]/page.tsx . Client-facing portal (3 tabs)
│   ├── settings/page.tsx ....... API connection management
│   └── api/ .................... 44+ API endpoints
│
├── components/
│   ├── AdminSidebar.tsx ........ Admin navigation (6 sections)
│   ├── EmployeeSidebar.tsx ..... Employee navigation (core + community + playbook)
│   ├── AuthGuardedLayout.tsx ... Role-based layout wrapper
│   ├── RoleSwitcher.tsx ........ Dev/demo role toggle (bottom-right)
│   ├── BridgeDashboard.tsx ..... Admin home dashboard
│   ├── MyDayDashboard.tsx ...... Employee daily dashboard
│   ├── NotificationBell.tsx .... Notification dropdown
│   ├── MorningBriefing.tsx ..... AI daily briefing
│   ├── ChatPane.tsx ............ AI chat panel
│   └── [25+ more components]
│
├── lib/
│   ├── types.ts ................ HpcRole, Department, Task, Project, etc.
│   ├── role-context.tsx ........ Role provider + useRole() hook
│   ├── store.ts ................ localStorage persistence (45 keys)
│   ├── db.ts ................... Database re-exports (from db-supabase)
│   ├── db-supabase.ts .......... Full Supabase integration (880 lines)
│   ├── supabase.ts ............. Supabase client init
│   ├── team-data.ts ............ HR data (roles, policies, commission, onboarding)
│   ├── hooks.ts ................ useFetch, timeAgo, formatDate
│   ├── growth-engine-data.ts ... 8-stage funnel definitions
│   └── constants.ts ............ Client configs
│
├── middleware.ts ................ Pass-through (placeholder)
│
supabase/
├── schema.sql .................. content_items + outreach_campaigns tables
└── priorities.sql .............. daily_priorities table

scripts/
├── sync-supabase.mjs ........... Airtable → Supabase sync tool
└── generate-icons.js

skills/ .......................... 15 AI skill YAML definitions

packages/
├── shared/ ...................... Zod types
├── db/ .......................... SQLite + Drizzle
├── core/ ........................ AI pipeline, cron, security
└── docker-runner/ ............... Docker + Git ops
```

---

## Coding Conventions

1. **CSS vars only** — Never hardcode colors. Use `var(--accent)`, `var(--surface)`, etc.
2. **`card` class** — Use for all card containers (defined in globals.css)
3. **`"use client"`** — All pages with interactivity must be client components
4. **Store pattern** — Employee data uses `store.read(key, fallback)` / `store.write(key, value)`
5. **Inline editing** — Use click-to-edit pattern (existing throughout codebase)
6. **Role-aware** — Always check `useRole()` when content should differ per role
7. **No test suite** — `npm run build` must pass before pushing. That's the test.
8. **Immutable updates** — Create new objects/arrays, don't mutate
9. **Responsive** — Mobile-first with `md:` and `lg:` breakpoints
