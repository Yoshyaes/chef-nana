# Claude Code Kickoff — Nana Ticketing

Paste this into Claude Code from the root of Nana's Next.js repo. Keep `nana-ticketing-prd.md` in the repo (or paste it in) so Claude Code can reference the full spec.

---

## Prompt

You're building a native ticketing flow into this existing Next.js app so guests buy pop-up tickets without leaving the domain. The full spec is in `nana-ticketing-prd.md` — read it first, then follow the build order below.

**Before writing any code:**
1. Read `nana-ticketing-prd.md` end to end.
2. Explore this repo: confirm it's Next.js App Router, find the Tailwind config, the existing styling/theme tokens, and where public pages live. Report what you find and how the new `/events` and `/checkin` routes should slot in to match the current site.
3. List anything the PRD assumes that doesn't match what you see, and ask me before deviating. Do not scaffold a fresh Next.js project — extend this one.

**Ground rules:**
- Match the existing site's styling and component patterns — checkout must look on-brand, not like default Stripe.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client.
- Every DB write from the webhook must be idempotent (Stripe retries). Guard on `stripe_session`.
- Verify the webhook signature with `STRIPE_WEBHOOK_SECRET` — reject anything unsigned.
- Ask me for real values rather than inventing them; use `.env.local` and give me a `.env.example`.
- Commit at the end of each phase with a clear message. Don't push.

**Build in this order — stop after each phase and show me what works:**

**Phase 1 — Payments + capacity (the core):**
- Supabase schema for `events` and `attendees` per the PRD data model, plus a `seats_sold(event_id)` SQL function. Give me the migration SQL to run.
- `lib/stripe.ts`, `lib/supabase.ts` (server + browser clients).
- `POST /api/checkout` — recheck capacity, create an **Embedded** Checkout Session (`ui_mode: 'embedded'`), return the client secret. Reject if sold out (409).
- `app/events/[slug]/page.tsx` — reads the event + live seats-left from the DB, renders a `<Checkout/>` component mounting Stripe Embedded Checkout on-brand.
- `POST /api/stripe/webhook` — verify signature, handle `checkout.session.completed`: inside a Postgres transaction, lock the event row, recount seats sold, and if this order would exceed capacity, auto-refund the session instead of confirming; otherwise insert the attendee with a random `qr_token` and decrement availability. Flip the event to `sold_out` at capacity.
- Seed one test event. Walk me through testing with Stripe test cards and the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`). Prove the last-seat race is handled.

**Phase 2 — Ticket email + door check-in:**
- `lib/resend.ts` — send a confirmation email with the event details and a QR code (`qrcode` package) encoding the attendee's `qr_token`. Also upsert the buyer into a Resend audience.
- `POST /api/checkin` — validate a `qr_token`, flip `checked_in`, block double-scans, return the attendee. Gate with a `CHECKIN_PASSCODE` header.
- `app/checkin/page.tsx` — passcode entry, then a phone-friendly view that scans a QR (device camera) or searches by name and marks guests arrived.

**Phase 3 — Ops hardening:**
- `charge.refunded` webhook frees the seat and voids the ticket.
- A reconcile script that re-reads recent Stripe sessions and backfills any attendee the webhook missed.
- Sold-out state on the event page.

**Definition of done for the MVP:** a guest can buy a ticket on a branded page without leaving the domain, capacity can't oversell, the buyer gets a QR ticket email, and I can check them in from my phone. Confirm each of those explicitly before calling it finished.

**Deferred — do NOT build yet (ask me first):** ticket tiers, multi-quantity orders, waitlist, promo codes, wallet passes, and swapping the passcode gate for Supabase Auth. These are Phase 3+ in the PRD.

---

*Open questions to resolve with me during the build: whether Stripe is on personal or business banking (Nana used personal on Tock), single price vs. tiers for the first drop, and the refund-policy wording for the ticket email.*
