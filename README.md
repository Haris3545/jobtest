# Job Tracker & CV Dashboard

Paste a job listing link (LinkedIn, Indeed, Bright Network, or a company site),
and the app scans it for title/company/dates, tracks it through your pipeline,
tailors your CV and cover letter for it, scores it against an ATS, and
researches the company/interview process — plus a role-discovery search and a
watchlist for roles that aren't open yet.

## Stack

- Next.js (App Router, TypeScript, Tailwind) — single deployable app, UI + API routes
- Prisma ORM — SQLite for local dev, swap to Postgres for production (see below)
- Anthropic (Claude) — CV tailoring, cover letters, ATS scoring, prep briefs, role discovery
- Tavily — free-tier web search (no card required) for company research & discovery
- pdf-parse / pdf-lib — extracting your master CV's text and rendering tailored PDFs

## Setup

```bash
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY and TAVILY_API_KEY
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000, go to **Settings** and upload your CV as a PDF.

### Getting free API keys

- **Anthropic**: https://console.anthropic.com — required for tailoring/cover
  letters/prep/ATS/discovery. (Paid, but usage for a personal tool like this is
  cheap — a few cents per generation.)
- **Tavily**: https://tavily.com — sign up with just an email, free tier
  (~1000 searches/month), no card required. Used for company research and
  role discovery.

## Deploying

The app is a single Next.js project — deploy to Vercel (or Render/Railway).

1. Switch the DB to Postgres for production: in `prisma/schema.prisma` change
   `provider = "sqlite"` to `provider = "postgresql"`, then run
   `npx prisma migrate dev` once against a free Postgres instance (e.g.
   [Neon](https://neon.tech), no card required for the free tier) to
   regenerate migrations, and set `DATABASE_URL` to that instance's
   connection string in your host's environment variables.
2. Set `ANTHROPIC_API_KEY` and `TAVILY_API_KEY` as environment variables on
   your host.
3. Deploy. Run `npx prisma migrate deploy` as part of your build/release step
   so the production database schema stays in sync.

There is no authentication — the app is meant for single-user personal use.
Keep the deployment URL private, or add a password gate (e.g. Vercel
Deployment Protection) if it's ever exposed publicly.

## Features

- **Add jobs**: paste a URL and the app scans schema.org `JobPosting` JSON-LD
  (used by most job boards/ATSs) and Open Graph meta tags for title, company,
  location, salary, open/closing dates, description. If scraping is blocked
  (common on LinkedIn), fill in the fields manually — same form either way.
- **Dashboard**: sortable-by-deadline table, status pipeline (Discovered →
  Saved → Applied → Interview → Offer/Rejected/Withdrawn), filters.
- **Tailored CV**: upload your master CV once (PDF). Per job, generates a
  version with bullets reordered/reworded to match the job description —
  never inventing experience. Fully editable before download, always
  downloads as `haris_khan_cv.pdf`. Every generation is saved as a new
  version (version history).
- **Cover letters**: generated per job from your real CV content, editable,
  versioned, downloadable.
- **ATS score**: keyword-match score (0–100%) between your CV and the job
  description, with matched/missing keywords and advice.
- **Prep & research**: a next-steps checklist tailored to the job's current
  status, plus a company/interview research brief built from live web
  search (recent news, culture, likely interview topics).
- **Discover roles**: type a role (e.g. "software engineering") and a target
  start year/region; searches the web for open and upcoming graduate/entry
  roles for that role and close adjacents, shown as a tick-to-add list.
- **Watchlist**: for roles/schemes not open yet, save a watch target and hit
  "Check now" (or wire up a cron, see below) to re-search the web and surface
  new findings (e.g. "applications now open").
- **Analytics**: funnel counts, interview/offer rate, average ATS score.
- **Deadline reminders**: an in-app banner for jobs closing within 14 days,
  plus browser push notifications (if you grant permission) for anything
  due within 3 days. Email reminders are a stubbed extension point — see
  `.env.example` (`RESEND_API_KEY`, `REMINDER_EMAIL_TO`); wire up
  https://resend.com's free tier and a small cron route if you want email too.
- **Browser extension** (`browser-extension/`): a one-click popup that scans
  the current tab and adds it to your tracker. Load it unpacked in Chrome
  (`chrome://extensions` → Developer mode → Load unpacked), set your
  deployed dashboard URL once in the popup.

## Automating the watchlist / reminders in production

This app doesn't run its own background scheduler. On Vercel, add a
[Vercel Cron](https://vercel.com/docs/cron-jobs) that hits an endpoint (add
one, e.g. `/api/cron/check-watchlist`, looping over active `WatchTarget`s
and calling the same logic as `/api/watch/[id]/check`) on whatever cadence
you like — free tier allows daily cron jobs.

## Known limitations

- **Scraping**: LinkedIn and some ATSs actively block automated fetches; the
  app degrades gracefully to a manual-entry form when scraping fails —
  there's no headless-browser bypass or paid scraping API involved.
- **CV layout fidelity**: tailoring does not preserve your original PDF's
  exact visual design pixel-for-pixel. Rewording/reordering bullets can
  change line lengths, which real PDF text can't reliably reflow. Instead,
  tailored CVs render into one clean, consistent template — edit the result
  in-app before downloading if anything needs a nudge.
- **Discovery/watchlist accuracy**: quality depends on what's indexed and
  findable via web search; always verify a discovered listing on the
  company's real career site before relying on any date shown.
