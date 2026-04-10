# Blade Command Center — Autoresearch Program

*Adapted from [karpathy/autoresearch](https://github.com/karpathy/autoresearch) — autonomous experimentation applied to platform engineering.*

## The Metric: Platform Health Score (0-100)

The single metric we optimize. Composite of:

| Dimension | Weight | How Measured |
|-----------|--------|-------------|
| **Real Data** | 30pts | Pages using real API data vs hardcoded/mock (each page = points) |
| **Build Health** | 20pts | `npm run build` passes clean, no `ignoreBuildErrors` crutch |
| **Code Quality** | 20pts | No dead code, no unused imports, no mock files in production |
| **API Completeness** | 15pts | All API routes hit real services, no fallback-to-mock chains |
| **Architecture** | 15pts | Consistent patterns, no duplicated logic, proper error handling |

**Current baseline: ~55/100** (estimated from audit)

## The Setup

The repo is a Next.js 14 App Router project. Key files:

- `src/app/` — 51 pages (the "model" we're improving)
- `src/app/api/` — API routes (the "data layer")
- `src/lib/` — shared utilities, types, mock data
- `src/components/` — UI components
- `CLAUDE.md` — project context and conventions

## What You CAN Do

- Delete dead mock data files
- Replace hardcoded data with real API calls
- Wire localStorage-only pages to proper API routes + database
- Fix TypeScript types (move toward strict mode)
- Remove `.slice()` truncations and other data-limiting hacks
- Improve error handling and loading states
- Consolidate duplicated patterns

## What You CANNOT Do

- Change the visual design / theme system (CSS vars in globals.css)
- Remove features or pages
- Change environment variable names or external API contracts
- Break the build (`npm run build` must pass after every experiment)
- Modify working real-data integrations (Meta, Airtable, GitHub, Slack, Mux, GHL)

## Current Platform State (Baseline Audit)

### Pages with REAL data (9 pages — working correctly):
1. `/` (dashboard) — BladeCommandCenter → `/api/blade/dashboard` → Blade DB
2. `/leads-os` — `/api/leads-os` → GHL API
3. `/pipeline` — `/api/leads` + `/api/revenue` → MySQL + GHL
4. `/outreach` — `/api/outreach` → Airtable (with mock fallback chain)
5. `/revenue` — `/api/revenue` → Database
6. `/team` — TeamPage component → real data
7. `/agents` — `/api/agents` → Paperclip service
8. `/landing-pages` — `/api/client/audit` → Firecrawl
9. `/meetings` — `/api/calendar/events` → real calendar + localStorage

### Pages with HARDCODED / localStorage data (6 pages — need upgrade):
1. `/sprint` — inline MILESTONES array (hardcoded sprint status)
2. `/focus` — localStorage + hardcoded TIME_BLOCKS
3. `/delegation` — localStorage + hardcoded ZONES config
4. `/scorecard` — localStorage with hardcoded initial metrics
5. `/playbooks` — localStorage + inline hardcoded playbooks array
6. `/compass` — localStorage + hardcoded FILTERS

### Hybrid pages (2 pages — partially real):
1. `/clients` — hardcoded META_ACCOUNTS + FALLBACK_CLIENTS array + real Meta API
2. `/ads` — real Meta API but hardcoded account config

### Dead code to remove:
1. `src/lib/mock-dashboard-data.ts` — never imported anywhere
2. Mock functions in `src/lib/data/outreach.ts` — only used as last-resort fallback

### Known bugs to fix:
1. Content GET route truncates copy to 300 chars, script to 500 chars
2. `ignoreBuildErrors: true` in next.config — masking real type errors
3. `link: "https://example.com"` placeholder in ads/create route
4. Hardcoded `leads * 400` revenue assumption in clients page

## The Experiment Loop

LOOP FOREVER:

1. **Assess** — Pick the highest-impact improvement from the audit above
2. **Implement** — Make the change (edit files directly)
3. **Verify** — Run `npm run build` to confirm no breakage
4. **Score** — Count: did we increase real-data pages? Remove dead code? Fix a bug?
5. **Log** — Record the experiment in `results.tsv`
6. **Keep or Discard** — If build passes and score improved: `git commit`. If build breaks: `git checkout -- .` and try something else
7. **Repeat** — Go back to step 1

### Priority Order (highest impact first):
1. Delete dead mock files (instant score boost, zero risk)
2. Remove content truncation (fixes active bug)
3. Remove `ignoreBuildErrors` and fix actual type errors
4. Replace hardcoded client data with dynamic config
5. Wire localStorage pages to API routes (sprint, scorecard, focus, etc.)
6. Clean up outreach mock fallback chain
7. Add proper error boundaries and loading states across all pages

### Results Logging

Log to `results.tsv` (tab-separated):

```
commit	score_delta	status	files_changed	description
```

- commit: short git hash (7 chars)
- score_delta: estimated point change (+2, -1, etc.)
- status: `keep`, `discard`, or `crash`
- files_changed: number of files touched
- description: what was tried

## NEVER STOP

Once the experiment loop begins, do NOT pause to ask if you should continue. The human might be asleep. Keep iterating until manually stopped. If you run out of obvious improvements, look harder — check every page, every API route, every component. There is always something to make more elite.
