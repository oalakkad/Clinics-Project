# Dental 8 Clinic — Project Handoff & Status

**Single source of truth for this project.** Read this first when resuming on any machine.
Last updated: **2026-07-12**

- Business/pitch playbook → [README.md](README.md)
- The demo itself → [index.html](index.html)

---

## 1. What this project is

Build a **WhatsApp booking + AI-receptionist system** and sell it to dental clinics as a
**monthly subscription** business. First target client: **Dental 8 Clinic** in Hawally, Kuwait.

Patients will be able to, over WhatsApp, in **Arabic or English**:
- Ask questions (services, prices, hours, location)
- **Book** an appointment
- **Reschedule** / **cancel**
- Get automatic **reminders** (which cut no-shows)

Meanwhile the clinic gets an **admin dashboard** of all bookings — this justifies the monthly fee.

### The core strategic constraint
As of now we have **NO relationship with the clinic**. So the first job is **not** production
software — it's a **personalized pitch demo** good enough to win them on the first contact
(the user's words: *"they won't wait; if I don't catch them first they'll say no"*).
Everything is sequenced around that.

---

## 2. Current status — at a glance

| Phase | What | Status |
|---|---|---|
| **1** | Branded pitch demo (site + booking + WhatsApp sim + dashboard) | ✅ **DONE** |
| **1.5** | Real WhatsApp bot on Meta free test number (Dr. Adel can text it) | ✅ **CODE DONE** — needs your API keys, see `whatsapp-bot/SETUP.md` |
| **2** | Real backend: Supabase/Postgres, multi-tenant | ⬜ Not started |
| **3** | Production on clinic's own WhatsApp number + reminders | ⬜ Not started (after they sign) |
| — | **Deploy demo + send the pitch DM** | ⬜ **DO THIS NEXT** |

**Immediate next action:** deploy `index.html` to a live URL and DM the clinic. See §6.
The bot is built and typechecks clean, but it can't run until you create a Meta app + Anthropic key — follow `whatsapp-bot/SETUP.md` (~45 min) before the pitch call.

---

## 3. Client facts (Dental 8 Clinic)

- **Name / tagline:** Dental 8 Clinic — "Smile Great with Dental 8"
- **Founder:** Dr. Adel Ashkanani (DMD, AEGD, M.Sc.) · ~18 dentists total · operating since 2006
- **Location:** Al-Bahar Centre, 1st Floor, Tunis Street, Hawally, Kuwait
- **Phone:** +965 2264 9292 · +965 1827626
- **Email:** info@Dental8Clinic.com
- **Instagram:** [@dental8clinic](https://www.instagram.com/dental8clinic/) · **Facebook:** /Dental8Clinic
- **Hours:** Sat–Thu 9:00–21:00, **closed Friday** (standard Kuwait week)
- **Website (current):** https://dental8clinic.com (dated — a redesign is part of our value)
- **Market note:** WhatsApp is the default channel in Kuwait/the Gulf → a WhatsApp bot is exactly right.
  Arabic + English support is essential.

---

## 4. What's built (Phase 1)

All in this folder: `Desktop\Dental 8 Clinic\`

| File | What it is |
|---|---|
| `index.html` | **The whole demo in one file** (HTML + CSS + JS, no dependencies except Google Fonts). |
| `README.md` | Pitch playbook: how to approach the clinic, pricing, deploy steps. |
| `PROJECT.md` | This handoff doc. |

### What `index.html` contains
- Sticky nav + **EN/AR language toggle** (flips the entire site to Arabic RTL, swaps fonts to Tajawal)
- **Hero** with an auto-playing WhatsApp booking chat on a phone mockup
- Trust strip with count-up stats
- **Services** grid (8 services, SVG icons)
- **Interactive booking widget** — service → date (Fri disabled) → time (some slots "full") → confirmation
- **WhatsApp assistant showcase** — 4 typed-out conversations (Book / Reschedule / Reminder / Ask), AR+EN
- **18-dentist grid** (real names from their site; Dr. Adel featured as founder)
- **Admin dashboard preview** (dark) — KPIs, today's schedule, no-show rate, bookings bar chart
- **Location & hours** (today highlighted) + styled map placeholder
- Final CTA, footer, floating WhatsApp button, mobile hamburger menu
- Labelled **"concept preview — not the official website"** (honest + good pitch framing)

### Design system used (for consistency later)
- **Colors:** medical teal `#0D9488` / deep `#115E59`; WhatsApp green `#25D366` / `#128C7E`; ink `#0F172A`; bg `#F8FAFC`; amber accent `#F59E0B`
- **Fonts:** Figtree (headings), Noto Sans (body), Tajawal (Arabic)
- Mobile-first, WCAG-minded, `prefers-reduced-motion` respected

### Design decision worth remembering
The demo was **not** published as a hosted Claude Artifact on purpose — a page carrying the clinic's
name/branding shouldn't live on a generic host where it could be mistaken for their official site.
It's delivered as files the user **self-deploys** under their own link. Keep it that way.

---

## 5. Resuming on a new PC — setup

### Just to view/edit the demo (Phase 1)
Nothing needed — copy the folder, double-click `index.html`. To edit, any editor / VSCode.

### To do Phase 1.5+ (real bot & backend) you'll need
Install once:
- **Node.js LTS** — https://nodejs.org (check: `node -v`)
- **Git** — https://git-scm.com
- **VSCode** + Claude Code extension

Create these accounts / keys (all have free tiers) and **save the keys in a password manager**:
- [ ] **Anthropic API key** — https://console.anthropic.com (the bot's brain = Claude API)
- [ ] **Meta / Facebook Business account** — https://business.facebook.com
- [ ] **WhatsApp Cloud API** (inside Meta for Developers) — https://developers.facebook.com → gives a **free test number**
- [ ] **Supabase project** — https://supabase.com (Postgres DB + auth)
- [ ] **Vercel** account — https://vercel.com (hosting for the app + webhook)
- [ ] A **domain** you own for demos (optional but nice) — e.g. dental8.yourname.com

> ⚠️ Never commit API keys to git. Use a `.env.local` file and add it to `.gitignore`.

### Recommended production stack (decided)
- **Next.js + Tailwind** — website + admin dashboard + API routes in one repo
- **Supabase (Postgres)** — appointments, availability, patients; **multi-tenant from day one** (so clinic #2, #3 are just new rows → this is how the business scales)
- **Meta WhatsApp Cloud API** — cheaper than Twilio; free test number now, clinic's real number in production
- **Claude API** — conversational brain; understands AR/EN, calls booking functions
- Deploy on **Vercel** (with Vercel Cron for reminders)

---

## 6. NEXT ACTION — deploy + pitch (do this first)

1. **Deploy the demo** (~2 min): drag this folder onto https://app.netlify.com/drop → copy the URL.
   (Or `npm i -g vercel` then `vercel` in this folder.)
2. **DM the clinic** on Instagram [@dental8clinic](https://www.instagram.com/dental8clinic/) / ask for Dr. Adel. Short message (full script in [README.md](README.md) §2):
   > "I built a WhatsApp booking assistant for Dental 8 — patients book, reschedule and get reminders
   > automatically, in Arabic and English. Made a quick preview with your clinic in it. Can I send it?"
3. **Lead with the pain:** no-shows (lost money) + front desk buried in calls. Not the tech.
4. **Ask for 15 minutes + a 2-week free pilot** on a test number (they risk nothing).

---

## 7. Roadmap — remaining work in detail

### ✅ Phase 1.5 — Real WhatsApp bot on a test number — CODE COMPLETE
Goal: Dr. Adel texts a number and it actually books him. This is the deal-closer.
Lives in [`whatsapp-bot/`](whatsapp-bot/) — Next.js + Claude tool use. Typechecks clean; booking engine has passing tests (`npm run smoke`, 17/17).
- [x] Next.js app + `/api/whatsapp` webhook (GET verify, POST receive, de-dupes Meta retries)
- [x] Meta Cloud API send/parse (`src/lib/whatsapp.ts`)
- [x] Claude brain with 5 tools — `get_availability`, `book_appointment`, `find_my_appointments`, `reschedule_appointment`, `cancel_appointment` (`src/lib/claude.ts`)
- [x] Bilingual AR/EN system prompt with clinic facts, no-medical-advice + no-pricing guardrails
- [x] Booking engine: Kuwait UTC+3, Friday closed, overlap prevention (`src/lib/booking.ts`)
- [x] Multi-turn conversation memory, 6h TTL (`src/lib/conversations.ts`)
- [ ] **YOUR TURN:** create Meta app + Anthropic key, deploy, register Dr. Adel's number → **`whatsapp-bot/SETUP.md`** (~45 min)

**Known Phase 1.5 limitation:** bookings + conversation history are in server memory, so they reset when the serverless instance goes cold. Fine for a live demo, not production — Phase 2 fixes it.

**API facts worth remembering** (verified, not from memory): model is `claude-opus-4-8` ($5/$25 per MTok); `budget_tokens` and `temperature`/`top_p`/`top_k` are **removed** on Opus 4.8 and return 400 — use `thinking: {type:"adaptive"}` + `output_config.effort`. The SDK's `betaZodTool` needs Zod **v4** types (`import { z } from "zod/v4"`). Prompt caching needs a ≥4096-token prefix on Opus 4.8, so it won't engage at our prompt size.

### ⬜ Phase 2 — Real backend
- [ ] Supabase project + tables: `clinics`, `services`, `dentists`, `availability`, `appointments`, `patients`
- [ ] Make it **multi-tenant** (every row keyed by `clinic_id`) so the same app serves many clinics
- [ ] Replace demo data in the booking flow + dashboard with live Supabase queries
- [ ] Build a real **staff dashboard** with login (Supabase Auth)

### ⬜ Phase 3 — Production (after they sign)
- [ ] Move from test number to the **clinic's own WhatsApp Business number** (Meta verification)
- [ ] Create + submit **message templates** for reminders (Meta must approve proactive messages)
- [ ] **Reminder cron** (Vercel Cron) — send 24h-before reminders, handle 1/2/3 replies
- [ ] Onboard the clinic; hand over the dashboard; start the monthly plan

---

## 8. Business model (recap)

Recurring monthly revenue is the real business. One clinic covers costs; each additional clinic is margin.

| Tier | One-time setup | Monthly |
|---|---|---|
| Starter | ~KWD 150–250 | ~KWD 30–45 |
| Pro (reminders + dashboard + AI FAQ) | ~KWD 300–400 | ~KWD 60–100 |

- Price on **value**: "one recovered no-show a week pays for this."
- Real costs are small: hosting (free tier), WhatsApp conversation fees (fractions of a fil), Claude API.
- **Scale play:** after Dental 8, resell the same system to more clinics by swapping branding/data (§9).

---

## 9. Reusing the demo for another clinic
In `index.html`, inside `<script>`, edit these arrays/values:
- `T.services`, `T.doctors`, `T.hours`, `T.times`
- Clinic name/brand in the nav, hero, footer; contact details in the Location section
- Chat scripts in `chatScripts()`
Then re-deploy. (In the production app this all comes from the DB per `clinic_id` instead.)

---

## 10. Open decisions / TODO for the user
- [ ] Register a business name / how to invoice the clinic (sole proprietor vs. company in Kuwait?)
- [ ] Decide pilot terms (free 2 weeks? then which tier?)
- [ ] Get real service list + prices from the clinic (demo uses sensible placeholders)
- [ ] Confirm which WhatsApp number production will use (theirs)
- [ ] Optional: full website redesign as an upsell (their current site is dated)

---
*When you resume: read §2 for status, do §6 if not done, then continue §7 from Phase 1.5.*
