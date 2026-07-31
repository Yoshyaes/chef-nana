# Ticketing Setup Checklist

*Everything left for a human to do. All three phases from `DEVELOPMENT_PLAN.md` are now built, type-checked, linted, and passing a production build — but none of it has been run against real Stripe/Supabase/Resend credentials yet, because I didn't have them. Work through this top to bottom.*

## What shipped

- **Phase 1**: `events`/`attendees` schema + capacity-safe transaction, `/api/checkout`, `/api/stripe/webhook` (`checkout.session.completed`), the public `/events/[slug]` page with embedded Stripe Checkout.
- **Phase 2**: ticket confirmation email with a QR code, Resend audience sync, the door check-in flow (`/checkin` — camera scan or name search), the admin CRUD at `/admin/ticketing`, and refund handling (`charge.refunded`).
- **Phase 3**: `scripts/reconcile-stripe-sessions.mjs` (backfills any attendee a missed webhook would have created), sold-out state, a security pass (no secrets logged, webhook rejects unsigned payloads, no service-role/Stripe-secret leakage into client bundles — verified by grep).

New files are all under `app/`, `components/`, `lib/`, `supabase/migrations/`, and `scripts/` in the usual places — nothing outside the existing repo structure.

---

## 1. Supabase

1. Open the Supabase SQL editor for the project and run, **in order**:
   - `supabase/migrations/20260730100000_create_ticketing.sql`
   - `supabase/migrations/20260730100100_create_ticketing_refunds.sql`
2. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from Vercel's project settings into `.env.local` (they're already live in production for other features but weren't present locally — I added blank placeholders for them).

## 2. Resend

1. Ticket emails send from `tickets@<sending domain>`, reusing the same `settings.sending_domain` value the rest of the admin already uses (check `/admin/settings` in the dashboard, or the `settings` table — falls back to `mail.chefnanawilmot.com` if unset). Confirm that domain is verified in the Resend dashboard, or emails will silently fail to send.
2. Confirm `RESEND_AUDIENCE_ID` is set (same one the newsletter signup uses) — attendee contact sync reuses it. If it's not set, the sync just no-ops (not a hard failure), but you won't get the attendee list into Resend.
3. `RESEND_API_KEY` should already be in both `.env.local` and Vercel from the newsletter feature — no action needed if so.

## 3. Stripe — test mode, for local development

1. In the Stripe dashboard (**test mode** toggle on), grab the test **Secret key** and **Publishable key**. Put them in `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
2. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) if you don't have it, then log in: `stripe login`.
3. Add a passcode for local door check-in testing to `.env.local`:
   ```
   CHECKIN_PASSCODE=whatever-you-want-for-testing
   ```

## 4. Local smoke test

1. `npm run dev`
2. In a second terminal: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - It prints a `whsec_...` value — put that in `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.
3. Seed one test event in the Supabase SQL editor:
   ```sql
   insert into events (slug, title, description, event_date, location, price_cents, capacity, status)
   values ('test-dinner', 'Test Supper', 'A test event', now() + interval '14 days', 'DC', 18000, 3, 'published');
   ```
   (Capacity 3 makes it easy to test the sold-out and overflow paths without many test purchases.)
4. **Buy a ticket**: visit `localhost:3000/events/test-dinner`, click *Get tickets*, pay with `4242 4242 4242 4242`, any future expiry/CVC, any name/ZIP. On the "Name on the reservation" field, type a real-looking name — this is what shows up on the attendee record.
5. Confirm:
   - An `attendees` row appears in Supabase.
   - The seats-left badge on the event page decrements.
   - A ticket email arrives (check the Resend logs if it doesn't show up) with a QR code.
6. **Test the capacity guard**: buy tickets until the event is at capacity, then try once more — it should show "Sold out" and, if you get a payment through right at the edge, the webhook logs should show `checkout overflow, refunded` and the buyer gets the apology email.
7. **Test check-in**: go to `localhost:3000/checkin` (on your phone if you want to test the camera — use your machine's LAN IP, not `localhost`, since the phone can't reach `localhost` on your laptop), enter the `CHECKIN_PASSCODE` you set, scan the QR from the ticket email or search the attendee's name, confirm it marks them arrived and a second scan is blocked.
8. **Test the admin CRUD**: go to `localhost:3000/admin/ticketing` (requires your normal admin Google sign-in), confirm you can create/edit an event and see the attendee list. Note this is a different screen from `/admin/content/events`, which is unrelated (Sanity CMS homepage blurb text, not real ticketing).
9. **Test a refund**: refund the test charge from the Stripe dashboard, confirm the attendee flips to `refunded` in Supabase and the seat count frees up on the event page.

## 5. Production (Vercel)

1. Add to the Vercel project's environment variables (production, and preview if you want to test there too):
   - `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — start with **test mode** keys until you're ready for a real event, then swap to live keys.
   - `STRIPE_WEBHOOK_SECRET` — **this is a different value than your local one.** Create a new webhook endpoint in the Stripe dashboard pointing at `https://<your-domain>/api/stripe/webhook`, select the `checkout.session.completed` and `charge.refunded` events, and use the signing secret Stripe gives you for *that* endpoint.
   - `CHECKIN_PASSCODE` — pick something door staff can type quickly but isn't trivially guessable (this is the entire security model for `/checkin` — see the note in the dev plan).
   - `NEXT_PUBLIC_SITE_URL` — your real production domain (used to build the Stripe return URL).
2. Deploy.
3. Repeat the smoke test from section 4 against the deployed URL before trusting it with a real event.

## 6. Before the first real event (going live)

- [ ] **Switch Stripe to live mode** in Vercel env vars (`sk_live_...` / `pk_live_...`) and create a *second* live-mode webhook endpoint (test and live mode have separate webhook configs in Stripe) — get a new `STRIPE_WEBHOOK_SECRET` for it.
- [ ] Confirm the Bluevine business checking account is fully payout-verified in Stripe (Settings → Bank accounts and scheduling) — a real charge won't pay out until this is done.
- [ ] Decide the real event's price and capacity (this build assumes a single GA price, qty 1 per order — tiers/multi-quantity are explicitly deferred).
- [ ] Decide refund policy wording if you want something more specific than the generic "sold out, you weren't charged" apology copy already in `lib/resend.ts`'s `sendOverflowApologyEmail` — that copy only covers the auto-refund-on-overflow case, not a general returns policy.
- [ ] Decide whether Tock (`components/sections/SupperClub.tsx:117`, `components/layout/Footer.tsx:125`, `app/layout.tsx:64`) stays live as a fallback for the first drop, or whether to cut over immediately. Recommendation from the dev plan: keep Tock live until the first native event sells cleanly, then swap the links.
- [ ] Decide who runs `/checkin` at the door and on what device — the camera scanner needs camera permission and a decent connection; the name-search fallback works without a camera.

## Known limitations to be aware of (not bugs, just MVP scope)

- Single ticket type, quantity 1 per checkout — no tiers, no multi-seat orders yet.
- No waitlist when sold out.
- No promo codes.
- `/checkin`'s passcode gate is a shared header value, not per-person login — fine for a small door team, not meant to scale past that without revisiting.
- The reconcile script (`scripts/reconcile-stripe-sessions.mjs`) is manual — run it with `node --env-file=.env.local scripts/reconcile-stripe-sessions.mjs` if you ever suspect a webhook was missed. It's not on a schedule.
