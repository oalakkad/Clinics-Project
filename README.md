# Dental 8 Clinic — WhatsApp Booking System (Pitch Demo)

A branded, bilingual (Arabic/English) concept demo built to **win Dental 8 Clinic as your first client**.
Everything runs in one file: `index.html` — a landing page, an interactive booking flow, an animated
WhatsApp assistant demo, an 18-dentist team grid, and a clinic-side admin dashboard preview.

> This is a **concept preview**, clearly labelled as such — it is not the clinic's official website.

---

## 1. See it / share it

- **Open locally:** double-click `index.html`.
- **Deploy a live link in ~2 min** (best for sending to the clinic on your own link):
  - **Netlify Drop:** drag the folder onto https://app.netlify.com/drop → you get a URL instantly.
  - **Vercel:** `npm i -g vercel` → run `vercel` in this folder.
  - **GitHub Pages:** push to a repo → Settings → Pages → deploy from branch.
- Put it on a demo subdomain you own (e.g. `dental8.yourname.com`) — never on the clinic's real domain.

---

## 2. How to pitch Dental 8 (the "idk how" part)

You have **no relationship yet**, so the demo *is* your foot in the door. Play it like this:

**Step 1 — Warm the DM.** Message [@dental8clinic](https://www.instagram.com/dental8clinic/) on Instagram
(or ask for Dr. Adel Ashkanani, the founder). One or two lines, no wall of text:
> "I built a WhatsApp booking assistant for Dental 8 — patients book, reschedule and get reminders
> automatically, in Arabic and English. Made a quick preview with your clinic in it. Can I send it?"

**Step 2 — Send the link.** They open it on their phone. It already has *their* name, dentists, hours,
and location — that's the "this is real" moment 90% of pitches never reach.

**Step 3 — Lead with the pain, not the tech.** Clinics feel two things: **no-shows** (lost money) and a
**front desk drowning in calls**. Your one line:
> "This cuts no-shows with automatic reminders and answers patients 24/7, so your desk stops living on the phone."

**Step 4 — Ask for 15 minutes**, not a sale. On the call, offer a **2-week live pilot** on a test number
so they risk nothing.

**Step 5 — Close on the pilot.** If the pilot books even a handful of patients, the monthly fee is easy.

---

## 3. The business model (setup + monthly)

Recurring revenue is the real business — one clinic funds your costs, every clinic after is margin.

| | One-time setup | Monthly |
|---|---|---|
| **Starter** | ~KWD 150–250 | ~KWD 30–45 |
| **Pro** (reminders + dashboard + AI FAQ) | ~KWD 300–400 | ~KWD 60–100 |

- **Frame on value, not hours:** "One recovered no-show a week more than pays for this."
- Your real costs are small: hosting (~free tier), WhatsApp conversation fees (fractions of a fil each),
  and the AI. Keep margin healthy.
- **The compounding play:** after Dental 8 says yes, the exact same system resells to the next clinic by
  swapping the branding/data. Aim for a portfolio of clinics on monthly plans.

---

## 4. Build roadmap (what's real vs. demo)

- [x] **Phase 1 — Pitch demo** (this file): branded site, interactive booking, simulated WhatsApp, dashboard preview.
- [ ] **Phase 1.5 — Live test bot:** a real WhatsApp bot on Meta's **free test number** that Dr. Adel can
      actually message. Needs a Meta Business account + webhook (Next.js API route) + Claude as the brain.
- [ ] **Phase 2 — Backend:** Supabase/Postgres for real appointments & availability, multi-tenant from day one.
- [ ] **Phase 3 — Production:** connect the **clinic's own WhatsApp number**, approved reminder templates,
      staff dashboard login.

### Recommended production stack
- **Next.js + Tailwind** (site + dashboard + API in one repo, deploys to Vercel)
- **Supabase** (Postgres + auth, multi-tenant)
- **Meta WhatsApp Cloud API** (test number free; production uses the clinic's number)
- **Claude API** (the conversational brain — understands AR/EN, calls your booking functions)

---

## 5. Editing the demo
All content lives in `index.html`. To reuse it for the **next** clinic, change:
- The `T.services`, `T.doctors`, `T.hours` arrays and the contact details near the bottom of the `<script>`.
- The clinic name/brand in the nav, hero, and footer.
- The chat scripts in `chatScripts()`.

---
*Built as a first-client pitch asset. Keep the "concept preview" labelling until the clinic is on board.*
