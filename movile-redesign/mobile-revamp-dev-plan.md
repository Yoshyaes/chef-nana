# Lead Studio — Mobile Web Revamp: Development Plan

## Context

The Lead Studio admin (`chefnanawilmot.com/admin`) is a desktop-first Next.js app. On a phone the highest-frequency workflow — triaging AI-drafted email replies in **Drafts** — is slow and cramped: a split-pane layout squeezed into one column, no swipe actions, bare `Loading…` text, and only one screen (Pipeline) with any real mobile-specific layout at all. A PRD and a set of 14 phone-frame mockups (`lead-studio-mobile-prd.md`, `lead-studio-mobile-mockups.html`, in this same folder) were written specifying a full native-feeling mobile rebuild — bottom tabs, swipe-to-approve/reject, bottom sheets, haptics, push, skeletons — but the PRD's proposed *implementation* is a separate native Expo/React Native app in a new monorepo.

That native path doesn't fit this codebase as it stands today: single Next.js app (no monorepo tooling, no mobile packages), and — critically — every `/api/admin/*` route authenticates purely via cookie-based Supabase sessions (`middleware.ts`, `lib/supabase/server.ts`), with Google OAuth as the only sign-in method. A native client can't ride those cookies without first reworking auth end-to-end. **Decision (confirmed with the user): build the revamp as a responsive/PWA redesign inside the existing Next.js app**, adopting the PRD's mobile-native *interaction patterns and visual language* (bottom tabs, swipe rows, bottom sheets, sticky action bars, skeletons, installable PWA, web push) using web technology — no new app, no app-store distribution, no auth rework, ships against the current deploy pipeline.

Research below reconciles the PRD's assumed data model against the real Supabase schema/API routes (they differ in several places) and audits what mobile handling exists today (almost none) so the plan below is grounded in what's actually there, not the PRD's inferred shape.

---

## What already exists (don't rebuild from scratch)

- **Routes** — every screen the PRD wants already has a page: `app/admin/(dashboard)/{today,pipeline,drafts,drafts/[id],leads,leads/[id],tasks,tasks/[id],sequences,menus,menus/[id],menus/new,content,integrations,settings,docs}/page.tsx`, plus `components/admin/DraftsView.tsx` (drafts list+detail logic) and `components/admin/MobileBottomNav.tsx` (existing 5-tab bar with a Drafts badge count and a "More" slide-up sheet).
- **APIs** — draft approve/reject/redraft, lead CRUD/stage-change, team task CRUD, menu CRUD, Gmail import, Apollo search, brief/triage generation, Sanity content CRUD, integrations stats all already exist under `app/api/admin/**`. Mobile work is **UI/UX only** for nearly every flow — no new backend endpoints needed except where noted below.
- **Mobile detection** — `hooks/useIsMobile.ts` (matchMedia 768px), used today only by `pipeline/page.tsx` and `DraftsView.tsx`'s ad hoc `mobileView` toggle.
- **Auth** — Google OAuth via Supabase (`app/admin/login/page.tsx`, `app/auth/callback/route.ts`), gated by `middleware.ts` (session + `profiles` row check). Unchanged by this plan — same-origin web means no bearer-token rework is needed.

## Data model corrections (real schema vs. PRD's assumptions)

The PRD's model was inferred without DB access and is wrong in specific, load-bearing ways. Build against the real shape:

| Entity | PRD assumed | Actual |
|---|---|---|
| Lead | `fit`, `value_per_year`, `tags[]` | `fit_score`, `est_annual_value`, **no tags column** — use `market`/`type` as the chip instead |
| Draft | `why_this_draft`, `to`, `thread_id` | `reasoning`; no `to` (resolve recipient from `leads.email`); no `thread_id` — thread is fetched via `GET /api/admin/messages?leadId=` (already used by `DraftsView`'s `ThreadPanel`) |
| Task | single `Task(owner, due_at)` | Two distinct tables: internal AI action-queue `tasks` (backend-only, feeds Today's stats, no UI needed) vs. human-facing **`team_tasks`** (`owner_id`, `due_date`, `menu_id`, plus `task_comments`/`task_activity`) — the PRD's "Tasks" screen maps to `team_tasks` |
| Menu | `occasion`, `guests`, `dishes[]` | `occasion[]`/`cuisine[]` (multi-select arrays), `guest_min`/`guest_max` (range, not a single number), `dishes` nested inside `courses[].dishes[]` |
| Brief/Today | standalone `Brief` table, `priority_items[]` | No table — it's the jsonb column `settings.latest_triage`, shape `{tldr, actions, stats:{hotReplies,draftsToApprove,followUpsDue,activeLeads}, generated_at}`; `actions` not `priority_items`. Generation is **async** (`POST /api/admin/triage` fires an Inngest job; there's no realtime/webhook to catch completion) |
| Settings | Discord config in DB | Discord is env-var only (`DISCORD_BOT_TOKEN` etc.); `discordConfigured` is just a boolean derived from env presence — nothing to persist |
| Push | `device_tokens` (Expo) | Doesn't exist yet in any form — build fresh for Web Push (see below) |

Also present but absent from the PRD entirely, worth wiring into mobile screens: `messages` (thread log), `enrichment` (Apollo/Claude research), `activity_log` (audit trail) — all already read by `app/api/admin/leads/[id]/route.ts`.

## Web-native equivalents for the PRD's native-only patterns

| PRD pattern | Web implementation |
|---|---|
| Swipe-to-approve/reject | `framer-motion` (already a dependency) `drag="x"` + `onDragEnd` velocity/offset threshold, revealing a colored action behind the row |
| Bottom sheets | Add **`vaul`** (small, unstyled, built for exactly this — used for Add lead/Change stage/Filters/Task add/Menu filters/"More" menu) |
| Haptics | `navigator.vibrate()` wrapped in a `useHaptic()` no-op-safe hook. **Caveat: iOS Safari/PWA has no Vibration API support** — Android gets real haptics, iOS gets a compensating spring/color-flash animation instead. State this to the user; it's a real platform gap, not a bug. |
| Push notifications | Web Push (VAPID) instead of Expo push: new `push_subscriptions` table (RLS'd), a minimal `public/sw.js` service worker, `web-push` npm package server-side, hooked into the same trigger point Discord already uses (`inngest/functions/handleInboundEmail.ts`'s `sendDraftNotification` call). **Caveat: iOS only supports Web Push once the PWA has been "Added to Home Screen"** (iOS 16.4+) — a normal Safari tab cannot receive push. The Settings/push-opt-in UI must say this explicitly. |
| Installable app | `public/manifest.json` + icons + `viewport: { viewportFit: 'cover' }` in the admin layout + `sw.js` registration — gives a real home-screen icon/standalone launch without app-store review |
| Optimistic mutations + rollback, read cache | Add **`@tanstack/react-query`** — there's currently zero data-fetching abstraction (every screen hand-rolls `fetch`+`useState`); this is the one new dependency that directly solves the repeated "optimistic update + rollback + cached instant-open" requirement across every screen, and keeps the door open for a native client later without redoing this work |
| Toasts (rollback/error feedback) | Add **`sonner`** (tiny, Next-friendly) rather than hand-rolling a toast stack |
| Offline | Simplify vs. PRD's action-queue: React Query's cache gives instant reopen; add a lightweight "You're offline" banner that disables actions, per the PRD's own stated fallback — a full offline mutation queue is unwarranted scope for a web redesign |

## Brand tokens — consolidate, don't reinvent

The admin dashboard currently has **no shared component library** — every page hand-rolls inline `style={{...}}`, and its brand tokens are duplicated (slightly divergently) inside `app/admin/(dashboard)/layout.tsx` and `app/admin/login/page.tsx` as local CSS vars (`--gold #C9973A`, `--green #2D5F3D`, `--terracotta #B85A35`, `--cream #F7F1E8`, `--brown #2C1A0E`), with the "serif" faked via plain `Georgia`. The mockups use a *different* approximated palette (`--brass #B0872F`, etc.) and `Newsreader`.

**Recommendation:** keep the admin's real existing token values (they already are cream/brass/green/terracotta, just not identical hex to the mockup's guesses) and consolidate them into one place instead of introducing a third palette. For the serif, switch from the fake `Georgia` to **Cormorant Garamond**, which the public marketing site already loads via `next/font/google` (`app/layout.tsx`) — this delivers the PRD's actual goal (same brand, not generic-CRM) for free, without a new font dependency. Do this consolidation as the first foundational step; it removes duplication that today makes every other admin page harder to restyle consistently.

---

## Phased Plan

### Phase 0 — Design system & PWA foundation
- Consolidate tokens into a single `app/admin/(dashboard)/admin-theme.css` (or a Tailwind v4 `@theme` block), replacing the duplicated inline `<style>` blocks in `layout.tsx` and `login/page.tsx`. Wire Cormorant Garamond into admin display headers.
- Add dependencies: `@tanstack/react-query`, `vaul`, `sonner`, `web-push` (server-only).
- Build shared primitives under `components/admin/ui/`: `Button` (brass/green/ghost/danger variants), `Card`, `Chip`/`StagePill`, `SkeletonCard`/`SkeletonRow`, `EmptyState`, `SearchBar`, `SectionHeader`, `StatTile`, `BottomSheet` (thin `vaul` wrapper).
- Build shared hooks: `hooks/useSwipeAction.ts` (framer-motion drag-to-reveal), `hooks/usePullToRefresh.ts`, `hooks/useHaptic.ts`.
- PWA shell: `public/manifest.json`, icon set, `public/sw.js`, safe-area viewport config (`viewportFit: 'cover'`), fixed elements (tab bar, sticky action bars) padded with `env(safe-area-inset-*)`.
- Wrap the admin tree in a `QueryClientProvider` (likely in `app/admin/(dashboard)/layout.tsx` or a new provider file).

### Phase 1 — Drafts triage (the release-gate flow)
- Rebuild `DraftsView.tsx`'s mobile path on the new primitives: `DraftRow` cards with swipe-right→approve / swipe-left→reject (via `useSwipeAction`, calling the existing `/api/admin/drafts/[id]/approve|reject` routes through a React Query optimistic mutation — remove from list immediately, roll back + toast on failure).
- Draft detail: sticky bottom action bar (Approve & send / Edit / Redraft / Reject) pinned above the keyboard and home indicator; collapsible "Why this draft" (reasoning); resolve "To" display from `leads.email` since drafts have no `to` column.
- Migrate the Drafts tab badge (currently its own polling `fetch` in `MobileBottomNav.tsx`) onto the same React Query cache as the list, so it updates live from any action, anywhere.
- Skeleton loaders replace the `Loading drafts…` text state.
- Search bar (debounced, sender/subject). Defer the mockup's "Noise" filter chip — it requires a classification rule that doesn't exist in the schema today (no signal to distinguish marketing/system email from real leads); flag as an open product decision rather than guessing a heuristic.

### Phase 2 — Today, Leads, Pipeline
- **Today**: 2×2 `StatTile` grid, TL;DR card, "Needs you first" cards with inline Approve (optimistic) / Review→ deep link, reading `GET /api/admin/triage`. Refresh must account for **async** generation: `POST /api/admin/triage` kicks off an Inngest job with no completion signal, so show a skeleton/shimmer and poll `GET /api/admin/triage` every few seconds until `generated_at` changes (a realtime subscription is unnecessary — nothing in this codebase uses Supabase Realtime today, and simple polling matches how "Redraft" already tells the user to "refresh in a moment").
- **Leads**: replace any table-like layout with `LeadCard`s (name+org line, then market/stage/source chips line — no `tags[]` exists, so drop the mockup's tag-chip assumption and use `market`/`type`/`source`); swipe for quick stage change; keep the existing Gmail-import trigger, add a progress indicator.
- **Pipeline**: restyle the existing `useIsMobile` tab list in `pipeline/page.tsx` into the mockup's segmented-pager look (sticky segmented control with live per-stage counts, swipe or tap between stages), replacing the plain `<select>` stage-change with a `BottomSheet` stage picker.

### Phase 3 — Web push
- New Supabase migration: `push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)` with RLS.
- Client: subscribe via `PushManager` on opt-in, POST subscription to a new `app/api/admin/push/subscribe` route.
- Server: add a `web-push` send call alongside the existing `sendDraftNotification` Discord call in `inngest/functions/handleInboundEmail.ts`, gated by per-type Settings toggles (new drafts / hot replies / brief ready).
- Settings screen: push opt-in toggle set, with the iOS "must Add to Home Screen first" caveat surfaced in the copy.

### Phase 4 — Remaining screens (apply the same system)
- **Tasks** (`team_tasks`): quick-add, My/All/Overdue tabs, swipe-to-complete, owner/status filters.
- **Menus**: filter sheet (occasion[]/cuisine[]/status/guest range), cards showing the guest range and course/dish counts (not a flat `dishes[]`), empty state.
- **Integrations**: stat cards restacked vertically (GA4, Vercel, Resend, Sanity), pull-to-refresh.
- **Settings**: grouped sectioned form, masked secret fields, push toggles wired to Phase 3.
- **More/Account**: tools list, API-spend meter, sign out.
- **Sequences**: restyle the existing placeholder card only — no logic change (matches PRD's own non-goal).

### Phase 5 — Polish (optional / lower priority)
- Dark mode (warm dark palette, same brass accent).
- Bulk draft select/approve/reject once the Phase 1 Noise-filter product decision lands.
- Install-to-home-screen nudge banner (serves both the PWA pitch and the iOS push prerequisite).

---

## Open items needing a product decision (don't guess these)
- What defines "noise" for the Drafts Noise filter — no existing schema signal distinguishes it.
- Icon/asset set for the PWA manifest (need real PNGs, not placeholders).
- Whether dark mode and bulk actions are launch-blocking or Phase 5 as scoped above.

## Verification
- `npm run dev`, then test each phase's screens with Chrome DevTools device emulation (iPhone SE → Pro Max widths) and on a real phone (both iOS Safari and Android Chrome, since haptics/push behave differently per platform).
- Confirm: swipe actions on Drafts/Leads/Tasks commit the right mutation and roll back cleanly on a forced API failure; the Drafts badge stays in sync after actions from any screen; Today's refresh shows a skeleton through the async triage regeneration and updates when it lands; the manifest installs to the home screen and the app opens standalone with safe areas respected; a push notification (Android first, then iOS after "Add to Home Screen") arrives and deep-links to the right draft.
