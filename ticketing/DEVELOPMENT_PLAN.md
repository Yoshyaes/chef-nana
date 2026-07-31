# Nana Native Ticketing — Development Plan

*Companion to `nana-ticketing-prd.md`. This document translates the PRD into a concrete, repo-grounded build sequence. Read the PRD first for the "why"; this is the "how, exactly, in this codebase."*

## Context

Chef Nana currently sells pop-up dinner tickets through Tock (`exploretock.com/georginas`), linked from `components/sections/SupperClub.tsx:117`, `components/layout/Footer.tsx:125`, and `app/layout.tsx:64`. Tock routes guests off her domain and takes ~3% in fees. The PRD (`nana-ticketing-prd.md`) and kickoff prompt (`nana-ticketing-claude-code-prompt.md`) in this folder specify a native, on-domain ticketing flow — but no code has been written yet; this folder previously contained only those two planning documents.

This plan translates that PRD into a concrete build sequence grounded in this specific repo: a Next.js 16 (App Router) + React 19 + Tailwind 4 + Sanity CMS + Supabase + Resend site hosted on Vercel. The goal is to let guests buy tickets via Stripe **Embedded Checkout** (never leaving the domain), enforce per-event seat capacity safely, and give Nana/door staff a phone-friendly check-in view — while reusing this repo's existing Supabase clients, design tokens, admin auth, and Resend integration rather than duplicating them. This is tracked internally as task **F2 "Native on-site ticketing, phase 2"** in `maser-task-list.md`, due 2026-08-14.

Implementation proceeds phase by phase, with a working, demonstrable slice at the end of each phase before moving to the next.

## Repo Conventions To Reuse (confirmed, not to reinvent)

- **Supabase clients**: `lib/supabase/server.ts` already exports async `createClient()` (user-scoped, cookie-based) and async `createServiceClient()` (service-role, empty cookies — deliberately doesn't pass user cookies so RLS is actually bypassed). Every new ticketing API route should `await createServiceClient()` rather than adding a new `lib/supabase.ts` as the PRD's generic file list suggests. Confirmed this is exactly the pattern every existing `/api/admin/*` route uses (e.g. `app/api/admin/leads/route.ts`).
- **RLS convention**: existing migrations (`20260722090100_retrofit_tasks_rls.sql`, `20260722090000_create_push_subscriptions.sql`) follow `enable row level security` + `create policy "team members full access" on public.<table> for all to authenticated using (public.is_team_member()) with check (public.is_team_member())`. New ticketing tables should follow this exact shape for authenticated/admin access, plus a narrower `anon`-role read policy scoped to non-draft events (see Phase 1).
- **Design tokens**: `app/globals.css` defines `--gold`, `--cream`, `--brown`, `--font-serif`, `--font-sans` etc., mapped into Tailwind via `--color-gold: var(--gold)` and so on. New public pages should use these, not hardcoded colors.
- **Button component**: `components/ui/Button.tsx` supports both `href` (renders a link) and plain `onClick` (renders a `<button>`) modes — reuse this for the "Get tickets" trigger instead of a new button component.
- **Route structure**: `app/(public)/layout.tsx` wraps all public pages with `<Nav/>`/`<Footer/>`. New public event pages belong inside `app/(public)/` to inherit site chrome. `/checkin` is a host tool, not a marketing page — it should live outside `(public)` with its own minimal layout (no Nav/Footer).
- **Admin auth**: `middleware.ts` already gates `/admin/:path*` and `/api/admin/:path*` with Supabase Auth (Google OAuth) + a `profiles` membership check, failing closed if misconfigured. Anything placed under those paths is automatically protected — no new auth code needed for the admin ticketing CRUD.
- **Resend**: `resend` is already a dependency, used in `app/api/newsletter/route.ts` and `app/api/contact/route.ts` via a shared `RESEND_AUDIENCE_ID` env var. Ticket-buyer contact sync should reuse this same audience rather than creating a new one.

## Naming Collision To Resolve

`app/admin/(dashboard)/content/events/page.tsx` **already exists** and manages something unrelated: free-text Sanity CMS "event" blurbs (title/date/location/price as strings, no capacity, no payments) shown via a generic passthrough at `app/api/admin/content/[type]/route.ts`, used for homepage copy. This is **not** the same as the new ticketing `events` Postgres table (real capacity, `price_cents`, Stripe integration).

**Recommendation**: place the new admin ticketing CRUD at `app/admin/(dashboard)/ticketing/` — a top-level sibling to `content/`, `menus/`, `settings/` — so it's visually and structurally distinct in the sidebar, not nested under `content/`. Confirm with the user before Phase 2 as a quick sanity check, not a blocking decision.

## Phase 1 — MVP: Database, Checkout, Webhook, Event Page

**Migration** — `supabase/migrations/20260730100000_create_ticketing.sql`:
- `events` table per PRD schema (`slug` unique, `status` as `text` with a check constraint `draft|published|sold_out|closed` — matches this repo's plain-text style over Postgres enums).
- `attendees` table per PRD schema (`event_id` FK, unique constraints on `stripe_session` and `qr_token`), indexed on `event_id`.
- `seats_sold(p_event uuid) returns int` — `security definer` SQL function summing non-refunded `quantity`.
- `fulfill_checkout(p_event uuid, p_session text, p_name text, p_email text, p_qty int, p_qr text) returns table(...)` — `security definer`, does `select capacity from events where id = p_event for update`, recounts seats sold inside that same transaction, and either inserts the attendee (flipping `events.status` to `sold_out` if now at capacity) or signals overflow. **This is the concrete answer to the PRD's "lock the event row" requirement** — the Supabase JS client has no multi-statement transaction API, so the lock + recount + insert must happen as one RPC call (`supabaseAdmin.rpc('fulfill_checkout', {...})`), not as separate round-trips from the webhook handler (which would reopen the race window).
- RLS: enable on both tables; an `anon`-role read policy on `events` scoped to `status in ('published','sold_out','closed')` (never `draft`, never the `attendees` table) so the public event page can read directly if needed, plus the standard `authenticated` + `is_team_member()` full-access policy on both. API routes bypass RLS via the service client regardless — this is defense-in-depth, not the primary gate.
- Note: this repo applies migrations manually (Supabase SQL editor / `supabase db push`), not automatically — do this at the end of Phase 1.

**New files**:
- `lib/stripe.ts` — server-only singleton Stripe client (`STRIPE_SECRET_KEY`), never imported from a `'use client'` file.
- `lib/qr.ts` — generates a random/HMAC-signed `qr_token` (not sequential/guessable) and verifies one.
- `app/api/checkout/route.ts` — `POST { eventId }`, uses `createServiceClient()`, checks `status === 'published'`, soft-checks capacity via `seats_sold` RPC, creates a Stripe Checkout Session (`ui_mode: 'embedded'`, `mode: 'payment'`, `metadata: { event_id }`), returns `clientSecret`. Returns 409 if already sold out. This route sits outside `middleware.ts`'s matcher by design — any visitor can call it; capacity/status checks are the gate.
- `app/api/stripe/webhook/route.ts` — verifies `stripe-signature` against `STRIPE_WEBHOOK_SECRET` (reject unsigned/invalid before touching the DB). On `checkout.session.completed`: idempotency check against `attendees.stripe_session`, generate `qr_token`, call `fulfill_checkout` RPC; on overflow, `stripe.refunds.create` (apology email stubbed here, wired up in Phase 2). Must return 200 in well under 5s per PRD.
- `app/(public)/events/[slug]/page.tsx` — Server Component inside the `(public)` group (inherits Nav/Footer). Reads event + `seats_sold` via `createServiceClient()`, renders using existing design tokens, mounts `<Checkout/>` when published with seats remaining, else a sold-out state.
- `components/Checkout.tsx` — client component; on a `Button` click (`variant="green"`, `onClick` mode) `POST /api/checkout`, then mounts `@stripe/react-stripe-js`'s `EmbeddedCheckoutProvider`/`EmbeddedCheckout` with the returned `clientSecret` via `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`. Handles the 409 response by swapping to sold-out state inline.
- `components/SeatsLeft.tsx` — small `capacity - seats_sold` badge using existing tokens.

**Packages to add**: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js` (repo already has `@supabase/supabase-js`, `@supabase/ssr`, `resend`).

**Env vars needed this phase**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Also note: `.env.local` currently has **only** the Sanity + GA vars — none of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` exist locally even though other features (admin, menus, tasks) depend on them in production. These need to be copied into `.env.local` from Vercel before local testing can work at all.

**Verification**: apply the migration, seed one test event via a raw SQL insert, run `npm run dev` and visit `/events/<slug>`, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` alongside it, complete a test-card purchase (`4242 4242 4242 4242`), confirm the attendee row appears and `seats_sold` increments, replay the same webhook event to confirm idempotency (no duplicate row), then seed capacity to 1 and race two near-simultaneous test payments to confirm the overflow path auto-refunds the second.

## Phase 2 — Door Check-In, Ticket Email, Admin CRUD, Refunds

**New files**:
- `lib/resend.ts` — `sendTicketEmail` (renders the `qr_token` via the `qrcode` package into a QR image, emails event details) and `upsertAudienceContact` (reuses the existing `RESEND_AUDIENCE_ID` env var already used by the newsletter feature). Called from the webhook after a successful `fulfill_checkout`, and on the overflow/refund apology path.
- `app/api/checkin/route.ts` — `POST { qr_token }`, gated by a `CHECKIN_PASSCODE` header match (this header check *is* the entire auth mechanism here — deliberately not Supabase Auth for MVP per PRD). Blocks double-scans with a distinct "already checked in" response rather than a generic error.
- `app/checkin/page.tsx` — outside both `(public)` and `admin/` groups, own minimal layout. Passcode entry (held in-memory/`sessionStorage` for the session, sent as a header — never a persisted cookie), then a phone-friendly view: QR scan via device camera (needs a scanning library not yet in `package.json` — confirm `html5-qrcode` or similar with the user) or name search, large tap targets.
- Admin ticketing CRUD at `app/admin/(dashboard)/ticketing/` (see naming collision note above): `page.tsx` (event list with seats sold/capacity, status toggle), `[id]/page.tsx` (edit event, attendee list, manual check-in override). Backing routes `app/api/admin/ticketing/events/route.ts` (`GET`/`POST`) and `.../[id]/route.ts` (`PUT`/`DELETE`), using `createServiceClient()` — confirmed this matches every existing `/api/admin/*` route's pattern (e.g. `app/api/admin/leads/route.ts`), and inherits `middleware.ts`'s auth gate automatically since it's under `/api/admin/`.
- Extend `app/api/stripe/webhook/route.ts` to also handle `charge.refunded`: match the charge back to `stripe_session`, set `attendees.refunded = true` (which `seats_sold()` already excludes), and explicitly flip `events.status` from `sold_out` back to `published` if it now has room — `fulfill_checkout` only ever flips forward, so this reverse transition needs its own handling.

**Package to add**: `qrcode` (+ `@types/qrcode` dev dependency); a QR-scanning library for the check-in camera view (to confirm with user).

**Verification**: full purchase → confirm ticket email arrives with a scannable QR → open `/checkin` on an actual phone (same network or a deployed preview URL) → scan the QR → confirm check-in flips and a second scan is blocked → confirm the admin CRUD screen creates/edits an event without being confused with the existing Sanity events screen → trigger a Stripe test refund and confirm `attendees.refunded` flips and the live event page's seat count updates.

## Phase 3 — Hardening

- `scripts/reconcile-stripe-sessions.mjs` (matches the existing `scripts/seed-sanity.mjs` ad-hoc script pattern): lists recent Stripe sessions, cross-checks against `attendees.stripe_session`, calls `fulfill_checkout` for any completed session the webhook missed. Not wired into `vercel.json`'s cron block unless requested — that file currently has one unrelated cron job.
- Polish the sold-out state end-to-end (event page, `Checkout` component's 409 handling) — no waitlist capture yet, PRD defers that.
- Security pass: grep for any accidental client-side import of `lib/stripe.ts` or the service-role client, confirm the webhook rejects unsigned payloads, confirm `CHECKIN_PASSCODE` is never logged.
- First real event dry-run per the PRD's Day 3 milestone.
- Revisit the Tock cutover decision (below) only after a native event has sold cleanly — don't touch the existing Tock links preemptively.

## Explicitly Deferred (do not build without asking)

Ticket tiers, multi-quantity orders, waitlist capture, promo codes, Apple/Google Wallet passes, swapping the check-in passcode for Supabase Auth. All Phase 3+ in the PRD.

## Open Questions To Resolve With The User

1. **Stripe account + banking** — new or existing Stripe account, personal or business bank attached, payout-verified? `maser-task-list.md` shows banking (task N2) already blocking other work — worth resolving early since it blocks live-mode testing.
2. **Single price vs. tiers for the first drop** — plan assumes single GA price, qty 1, per PRD.
3. **Refund policy wording** — needed for the ticket confirmation and overflow-apology email copy.
4. **Keep Tock live in parallel** — recommendation is yes through Phase 1–2, revisit cutover after the first native event sells cleanly.
5. **Check-in device** — whose phone, and does the venue have signal/wifi (affects whether offline tolerance matters later, out of scope for MVP).
6. **Admin ticketing CRUD location** — confirm `app/admin/(dashboard)/ticketing/` as proposed above.
7. **QR scanning library** for `/checkin`'s camera view — not specified in the PRD's package list, needs picking in Phase 2.

## Verification Summary

Each phase ends with a working, demonstrable slice before moving on: Phase 1 = a guest can complete a test purchase on a branded on-domain page and the DB correctly enforces capacity under a race; Phase 2 = that guest gets a QR ticket email and can be checked in from a phone, and Nana can manage events from `/admin`; Phase 3 = the system survives a missed webhook and a real dry-run event.
