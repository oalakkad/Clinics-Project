# WhatsApp Bot — Setup (Phase 1.5)

Goal: a **real WhatsApp number Dr. Adel can text** that books him an appointment. This is your closer for the pitch call.

You'll need ~45 minutes. Everything here has a free tier except the Anthropic API (pennies per conversation).

---

## What this is

```
Patient's WhatsApp
      ↓
Meta WhatsApp Cloud API  ──webhook──▶  /api/whatsapp (Next.js, on Vercel)
                                              ↓
                                        Claude (the brain)
                                              ↓
                                  tools: get_availability, book_appointment,
                                         find_my_appointments, reschedule, cancel
                                              ↓
                                       booking engine (in-memory for now)
```

> ⚠️ **Phase 1.5 limitation:** bookings and conversation history live in server memory. They survive while the serverless instance is warm — fine for a live demo, **not** for production. Phase 2 swaps in Supabase (`src/lib/booking.ts` and `src/lib/conversations.ts` are the only files that change).

---

## 1. Anthropic API key

1. Go to https://console.anthropic.com → **API Keys** → Create key.
2. **Enable billing** (Settings → Billing). Without it every call 401s.
3. Save the key — it's shown once.

## 2. Meta app + WhatsApp product

1. https://developers.facebook.com → **My Apps** → **Create App** → type **Business**.
2. In the app dashboard, find **WhatsApp** → **Set up**.
3. Meta creates a **test phone number** for you, free, instantly. You'll land on the **API Setup** page.

From that page copy two things into `.env.local`:
- **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID` (the long numeric ID, *not* the phone number)
- **Temporary access token** → `WHATSAPP_ACCESS_TOKEN` (⚠️ expires in 24h — see §6 for a permanent one)

## 3. Add Dr. Adel as a test recipient

**This is the step people miss.** The free test number can only message numbers you've explicitly registered — up to 5.

On the same **API Setup** page → **To** → **Manage phone number list** → add:
- Your own number (to test)
- Dr. Adel's number (before the call)

Each number gets a confirmation code on WhatsApp. Until a number is on this list, the bot's replies silently go nowhere.

## 4. Configure and deploy

```bash
cd whatsapp-bot
cp .env.example .env.local     # fill in the values
npm install
npm run typecheck              # should be clean
npm run smoke                  # exercises the booking engine, no API keys needed
```

The webhook needs a **public HTTPS URL**, so deploy before wiring Meta up:

```bash
npm i -g vercel
vercel                         # first deploy
vercel env add ANTHROPIC_API_KEY
vercel env add WHATSAPP_ACCESS_TOKEN
vercel env add WHATSAPP_PHONE_NUMBER_ID
vercel env add WHATSAPP_VERIFY_TOKEN
vercel --prod                  # redeploy with the env vars
```

Note your URL, e.g. `https://dental8-bot.vercel.app`.

> Prefer to test locally first? `npx ngrok http 3000` alongside `npm run dev` gives you a temporary public URL you can use in step 5.

## 5. Point Meta at your webhook

In the Meta app: **WhatsApp** → **Configuration** → **Edit** next to Webhook.

| Field | Value |
|---|---|
| Callback URL | `https://YOUR-URL.vercel.app/api/whatsapp` |
| Verify token | the **exact** value you set for `WHATSAPP_VERIFY_TOKEN` |

Click **Verify and save**. Meta immediately sends a `GET` to that URL; our route echoes the challenge back. If it fails:
- Token mismatch between Meta and your env var (most common)
- You deployed before adding env vars — run `vercel --prod` again
- URL typo / missing `/api/whatsapp`

Then — **don't skip this** — under **Webhook fields**, click **Manage** and **subscribe to `messages`**. Without that subscription Meta never sends you anything and the bot looks dead.

## 6. Test it

Text your test number from a registered phone:

> "hi, do you do teeth whitening?"
> "can I book a cleaning this week?"
> "أبغى موعد بكرة" (Arabic — it should reply in Arabic)
> "move my appointment to Thursday"
> "cancel it"

Watch logs with `vercel logs --follow` if something misbehaves.

### Permanent access token (do this before the pitch)

The temp token dies in 24 hours — a dead bot mid-call is not the impression you want.

1. https://business.facebook.com → **Business Settings** → **Users** → **System Users** → **Add**
2. Create a system user with the **Admin** role.
3. **Add Assets** → your app → toggle **Full control**.
4. **Generate New Token** → pick your app → scopes `whatsapp_business_messaging` + `whatsapp_business_management` → set expiry **Never**.
5. Replace `WHATSAPP_ACCESS_TOKEN` in Vercel and redeploy.

---

## Cost (what you'll actually pay)

**Claude** — the bot defaults to `claude-opus-4-8` at **$5 / $25 per million tokens** (input/output). A typical booking conversation is a few thousand tokens, so it lands around a **fraction of a US cent per conversation**. At 150 conversations/month that's still small change against a KWD 30–100 monthly fee.

If you want to cut it further, change `MODEL` in `src/lib/claude.ts`:

| Model | ID | Input / Output per MTok |
|---|---|---|
| Opus 4.8 (default) | `claude-opus-4-8` | $5 / $25 |
| Sonnet 5 | `claude-sonnet-5` | $3 / $15 ($2 / $10 promo through 2026-08-31) |
| Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 |

Booking is a narrow, scripted job, so **Sonnet 5 or Haiku 4.5 will likely handle it fine** — test bilingual Arabic quality before you switch, since that's where cheaper models tend to slip first. Keep Opus for the demo (best first impression), optimize once they've signed.

**WhatsApp** — Meta gives free service conversations; beyond that it's fractions of a fil per conversation. Negligible at one clinic's volume.

**Hosting** — Vercel's free tier covers this.

### Two knobs worth knowing
- `output_config: { effort: "low" }` in `src/lib/claude.ts` keeps replies fast and cheap. Raise to `"medium"` if answers feel shallow.
- **Prompt caching won't engage here.** Opus 4.8 needs a ≥4096-token prefix to cache, and our system prompt is smaller than that — so don't expect cache savings until the prompt grows (or you move to Sonnet 5, whose minimum is 2048).

---

## Files

| File | What it does |
|---|---|
| `src/app/api/whatsapp/route.ts` | Webhook: GET verify, POST receive. De-dupes Meta's retries. |
| `src/lib/claude.ts` | System prompt + the 5 tools + the tool-use loop. **Start here.** |
| `src/lib/booking.ts` | Availability, booking, reschedule, cancel. Kuwait timezone (UTC+3, Fri closed). |
| `src/lib/whatsapp.ts` | Meta Cloud API send/verify + payload parsing. |
| `src/lib/conversations.ts` | Per-patient history (6h TTL) + inbound de-dupe. |
| `src/lib/clinic.ts` | All Dental 8 data. **Swap this to resell to another clinic.** |
| `smoke.mts` | `npm run smoke` — booking engine tests, no keys needed. |

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Webhook won't verify | `WHATSAPP_VERIFY_TOKEN` mismatch, or env vars not deployed |
| Bot never replies | Not subscribed to the `messages` webhook field (§5) |
| Replies vanish | Recipient not on the test-number allow-list (§3) |
| Worked yesterday, dead today | Temp token expired — get a permanent one (§6) |
| 401 from Anthropic | Billing not enabled on the console |
| Same reply 2–3× | De-dupe is off, or the instance restarts between retries |
| Forgets mid-conversation | Cold serverless instance — expected in Phase 1.5, fixed by Supabase in Phase 2 |
