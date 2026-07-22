# Lead Studio Mobile App — Product Requirements Document

**Product:** Georgina's Assistant / Lead Studio (native mobile app)
**Owner:** Fred Twum-Acheampong
**Audience for this doc:** Claude Code (implementation)
**Date:** July 22, 2026
**Status:** Draft v1 — ready for build

---

## Executive Summary

The Lead Studio is an AI lead-and-email manager for Chef Nana Araba Wilmot's business, live at `chefnanawilmot.com/admin`. It is a desktop-first Next.js web app: a left sidebar, multi-pane email views, a wide kanban, and 7-column tables. On a phone it collapses into a cramped, non-native experience that is slow to use for the one thing it exists to do — approve or reject AI-drafted email replies on the go.

This PRD specifies a **native mobile app** (Expo / React Native) that reuses the existing backend and data (Supabase, Sanity, Gmail, Resend, Anthropic, Apollo) and rebuilds the front end around mobile-native patterns: a bottom tab bar, stacked list→detail navigation, swipe actions, bottom sheets, pull-to-refresh, haptics, and push notifications. The target feel is a fast, tactile inbox app — think Superhuman meets a CRM — that carries the existing warm, editorial brand.

The app ships as an installable iOS/Android app (App Store + Play, plus TestFlight/internal track for the two daily users), sharing TypeScript types and API contracts with the web app through a monorepo.

---

## Problem Statement

The primary daily job is triage: a steady stream of AI-drafted email replies land in **Drafts** (currently 101 pending), and Nana or Jillian must approve, edit, redraft, or reject each one. That job happens between events, in transit, on a phone — not at a desk. The current web app fails at phone size in specific, measurable ways:

- **Drafts** is a two-pane master/detail layout (list left, draft right). On a phone the two panes fight for one narrow column, so reading a draft and acting on it takes multiple awkward taps and scrolls. No swipe-to-approve, no swipe-to-reject.
- **Pipeline** is a horizontal 5-column kanban (Sourced / Contacted / Responded / Negotiating / Trial & Won). Horizontal columns do not fit a phone; you side-scroll blindly and lose the board overview.
- **Leads** is a 7-column table (Name / Organization / Market / Stage / Fit / Value/yr / Source). Wide tables truncate or overflow on mobile; rows are hard to tap and columns get cut off.
- **Loading states** are bare `Loading...` text, not skeletons — the app feels broken on slow mobile connections.
- **No install, no push.** New drafts notify through Discord today. There is no home-screen app and no native push, so the phone is not actually a first-class surface — you find out about a hot lead late.
- **Touch targets, safe areas, and gestures** are desktop-sized. Nothing respects the notch or home indicator, there is no pull-to-refresh, no back-swipe, no haptics.

Net effect: the highest-frequency, most time-sensitive workflow (fast draft triage) is done on the worst-fitting surface. Response time suffers, and response time is the product's core value.

---

## Goals & Non-Goals

### Goals

- Rebuild the Lead Studio as a **native app that feels native** on iOS and Android — bottom nav, gestures, sheets, haptics, push.
- Make **draft triage the fastest flow in the app**: open → read → approve/reject in one thumb, with swipe shortcuts and push-to-action.
- Preserve the existing **brand identity** (warm cream, brass/gold accent, editorial serif headers) so it reads as the same product, not a generic CRM.
- **Reuse the existing backend and data** — no re-platforming of Supabase, Sanity, Gmail sync, AI drafting, or sending. The mobile app is a new client on the same services.
- Share **types and API contracts** with the web app so the two clients never drift.

### Non-Goals

- Not rebuilding the backend, database, or AI drafting logic.
- Not redesigning the public marketing site (`chefnanawilmot.com` landing pages).
- Not building the **Sequences** feature logic (it is a "Coming in Phase 2" placeholder in the web app; mobile mirrors that status until the backend ships it).
- Not shipping a full offline-first sync engine in Phase 1 (read-cache + action queue only).
- Not replacing Discord notifications for the web app — mobile adds native push alongside.

---

## Target Users

**Primary — Nana (Chef / owner).** Runs the business between events and travel across NYC, Philadelphia, and Accra. Lives out of her phone. Needs to glance at the morning brief, clear drafts, and see who is hot — fast, one-handed, often on cellular.

**Primary — Jillian (Management).** Sends and manages email on Nana's behalf (drafts are signed "Jillian Almeida, Management"). Heavier triage user; wants keyboard-free approve/reject and quick edits.

**Secondary — Fred (Operator / builder).** Configures settings, watches integrations and API spend, tests flows. Comfortable with the deeper Tools screens.

Two-to-three active users total. This is an internal team tool, not a consumer app — optimize for depth of daily use over onboarding breadth.

---

## Solution Overview

Build a new **Expo (React Native) app** in a monorepo alongside the existing Next.js web app. The mobile app authenticates against the same **Supabase** project and reads/writes the same data. Mutations that involve AI or email sending (draft generation, approve & send, redraft, Gmail import) call the **existing Next.js API routes** so business logic lives in one place. Simple CRUD (leads, tasks, stage changes, menus) can go directly through the Supabase client with row-level security, or through the same API routes — pick one convention per entity and hold it (see Architecture).

The UI is rebuilt from mobile primitives:

- A persistent **bottom tab bar**: Today · Pipeline · Drafts · Leads · More.
- **Native stack navigation** inside each tab for list→detail (Drafts list → draft, Leads list → lead, etc.).
- The desktop kanban, split-pane, and wide table each get a **purpose-built mobile pattern** (segmented pager, full-screen reader, card list).
- **Bottom sheets** for add/edit/filter/stage-change actions.
- **Swipe actions, pull-to-refresh, haptics, skeletons, optimistic updates, and push notifications** throughout.

Brand tokens (color, type, spacing, radius) are extracted from the web app's Tailwind/theme config and reused so the app is visually continuous with the web experience.

---

## Architecture & Tech Stack

### Approach

Monorepo (recommended) so web and mobile share types, validation schemas, and API-client code:

```
/apps
  /web        → existing Next.js app (unchanged except shared-package extraction)
  /mobile     → new Expo app
/packages
  /types      → shared TS types (Lead, Draft, Task, Menu, Brief, etc.)
  /api-client → typed fetch wrappers for the Next.js API routes
  /schemas    → zod schemas shared by client + server validation
```

If a monorepo is too invasive for a first pass, ship `/mobile` as a standalone Expo repo that imports types via a published internal package or a copied `types.ts`, and talks to the deployed API at `https://www.chefnanawilmot.com/api/*`. Prefer the monorepo — the two clients will drift otherwise.

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| App framework | **Expo (SDK 52+) + React Native**, TypeScript | Fastest path to a real native iOS/Android app from a TS/React codebase; OTA updates, EAS Build, and push are built in. Matches the team's existing React/TS skillset. |
| Navigation | **Expo Router** (file-based) | Tabs + nested stacks with typed routes; mirrors the Next.js App Router mental model the team already uses. |
| Data fetching / cache | **TanStack Query (React Query)** | Caching, background refetch, optimistic mutations, and the offline read-cache the triage flow needs. |
| Backend data | **Supabase** (existing project) via `@supabase/supabase-js` | Already the system of record and auth provider; reuse as-is. |
| Auth | **Supabase Auth** + `expo-secure-store` for session | Same accounts as web; secure token storage on device. |
| AI / email actions | **Existing Next.js API routes** (Anthropic, Resend, Gmail) | Keep drafting/sending/import logic server-side and single-sourced. |
| CMS content | **Sanity** (existing) via its API/client | Content screens read/write the same Sanity dataset. |
| Push | **Expo Notifications** + a `device_tokens` table + server send | Native push for new drafts / hot replies, alongside existing Discord. |
| Styling | **NativeWind** (Tailwind for RN) or restyle/Tamagui | NativeWind lets Claude Code reuse the web app's Tailwind tokens almost verbatim. |
| Lists | **FlashList** (Shopify) | 101 drafts + 72 leads scroll at 60fps; FlashList beats FlatList on long lists. |
| Gestures / motion | **react-native-gesture-handler** + **react-native-reanimated** | Swipe actions, sheet drags, spring animations. |
| Bottom sheets | **@gorhom/bottom-sheet** | The sheet primitive for add/edit/filter/stage flows. |
| Haptics | **expo-haptics** | Tactile confirm on approve/reject/stage change. |
| Build / release | **EAS Build + EAS Update**, TestFlight + Play internal testing | CI builds, OTA JS updates, easy distribution to 2–3 users. |
| Error/analytics | **Sentry (expo)** + reuse **GA4** events where useful | Crash reporting for a tiny team that can't chase silent failures. |

### Data & mutation convention

- **Reads:** Supabase client through React Query hooks (`useLeads`, `useDrafts`, `useBrief`, etc.).
- **Side-effectful writes** (approve & send, redraft, reject, Gmail import, generate draft): call the existing Next.js API route so server logic and third-party keys stay server-side. Never embed Anthropic/Resend/Gmail secrets in the app.
- **Simple writes** (lead stage change, task add/complete, menu edit, settings): Supabase direct with RLS, wrapped in optimistic React Query mutations.
- Enforce **row-level security** in Supabase for the mobile anon key; the app only ever holds a user session token, never service-role keys.

---

## Data Model

Entities observed in the current app. Confirm exact column names against the Supabase schema during build; treat this as the shape, not the DDL.

**Lead**
- `id`, `name`, `organization`, `market` (e.g. "Corporate events"), `stage` (`sourced` | `contacted` | `responded` | `negotiating` | `trial_won`), `fit`, `value_per_year`, `source` (`manual` | `gmail_import` | `website_contact_form`), `tags[]` (e.g. `one-off`, `Corporate events`), timestamps.
- Relations: has many Drafts, has many Tasks, has many email threads.

**Draft**
- `id`, `lead_id`, `channel` (`email`), `status` (`pending` | `sent` | `rejected`), `to`, `subject`, `body`, `why_this_draft` (AI rationale string), `thread_id`, timestamps.
- Actions: approve & send, edit, redraft (regenerate), reject.

**Brief (Today)**
- `generated_at`, `stats` (`hot_replies`, `drafts_to_approve`, `follow_ups_due`, `active_leads`), `tldr` (string), `priority_items[]` (each: `title`, `summary`, `lead_id?`, `draft_id?`, action type `approve` / `review`).

**Task**
- `id`, `title`, `owner` (`Fred` | `Jillian` | …), `status` (`open` | `in_progress` | `done`), `due_at?`, `lead_id?`.

**Menu**
- `id`, `title`, `occasion` (`Private Dinner` | `Catering` | `Corporate` | `Supper Club` | `Holiday`), `cuisine` (`Ghanaian` | `West African` | `Mediterranean` | `American` | `Pan-African` | `International`), `status` (`active` | `draft` | `archived`), `guests`, `dishes[]`.

**Content (Sanity)** — document types: `Events`, `Services`, `Credentials`, `Press`, `SiteSettings`.

**Settings / Config**
- API keys (Anthropic connected, Apollo), `monthly_budget_cap`, `api_spend_this_month`, `your_voice` notes, `approve_before_sending` (bool), `writing_examples[]`, `sending_domain`, Gmail connection (`georginasfoods@gmail.com`, poll interval 10 min), Discord config, Apollo search.

**Device token (new for mobile)**
- `id`, `user_id`, `expo_push_token`, `platform`, `created_at`.

---

## Design System — Native Look & Feel

Goal: the app should read as the same brand as the web Studio — warm, editorial, calm — rendered in native components. Pull exact values from the web app's Tailwind config / `globals.css`; the values below are observed approximations to seed the token set.

### Color tokens (confirm against web theme)

| Token | Approx value | Use |
|-------|--------------|-----|
| `bg/canvas` | `#F4EEE4` (warm cream) | App background |
| `bg/surface` | `#FFFDF9` / `#FFFFFF` | Cards, sheets, rows |
| `bg/surface-alt` | `#EFE7DA` | Inset panels, selected nav |
| `accent/brass` | `#B0872F` → `#C79A3E` | Primary buttons (Add lead, Add menu), active states |
| `success/green` | `#3E6B4E` | "Approve & send" primary action |
| `danger` | `#9B4A3A` (muted terracotta) | Reject / destructive |
| `text/primary` | `#2A2320` (near-black brown) | Headings, body |
| `text/muted` | `#A98D6B` (tan) | Labels, meta, section headers |
| `border/hairline` | `#E4DACB` | Dividers, card borders |
| `chip/bg` | `#EDE4D6` | Tags (one-off, Corporate events) |

Ship full **light and dark** token sets. The current app is light-only; dark mode is a strong native expectation — define a warm dark palette (deep espresso canvas, cream text, same brass accent) rather than pure black.

### Typography

- **Display / headings:** the app's editorial serif (headers like "Good morning, Nana", "Pipeline"). Use the same family the web app loads (looks like a transitional serif — e.g. Newsreader / Fraunces class). Bundle via `expo-font`.
- **Body / UI:** clean sans (system font or Inter) for lists, labels, controls.
- Scale: Display 28–32, Title 20–22, Body 15–16, Caption 12–13. Respect Dynamic Type / font scaling.

### Core components (build once, reuse)

- `StatTile` — number + label (Today stats, Integrations stats).
- `LeadCard` — name, org, tags, stage pill; used in Pipeline and Leads.
- `DraftRow` — sender, subject, `email · pending` meta; swipeable.
- `StagePill` / `StageBadge` — colored per stage.
- `PrimaryButton` (brass), `SuccessButton` (green), `GhostButton`, `DangerButton`.
- `BottomSheet` wrapper (add/edit/filter/stage).
- `SegmentedPager` — for Pipeline stages and Today/Drafts filters.
- `SkeletonCard` / `SkeletonRow` — replace all `Loading...` text.
- `EmptyState` — icon + title + subtext + CTA (matches web "No menus yet").
- `SearchBar` — native, debounced.
- `SectionHeader` — muted-caps label (WORKSPACE / TOOLS / NEEDS YOU FIRST).

### Motion & feedback

- Spring-based transitions (Reanimated) for push/pop and sheet open.
- Haptic on: approve (success), reject (warning), stage change (light), pull-to-refresh trigger.
- Optimistic UI on every mutation; roll back + toast on failure.
- Skeletons on first load; subtle shimmer.

---

## Global Navigation & Information Architecture

### Bottom tab bar (5 tabs, persistent)

| Tab | Icon | Route | Badge |
|-----|------|-------|-------|
| **Today** | sun / brief | `/(tabs)/today` | — |
| **Pipeline** | columns / funnel | `/(tabs)/pipeline` | — |
| **Drafts** | pencil / envelope | `/(tabs)/drafts` | pending draft count (e.g. 101) |
| **Leads** | contact / diamond | `/(tabs)/leads` | — |
| **More** | grid / ••• | `/(tabs)/more` | — |

Order mirrors the web sidebar and the current mobile bottom bar, so the two users' muscle memory carries over. Drafts shows a live count badge (the daily workload signal).

### "More" screen (menu list → pushes to stacks)

Groups matching the web `TOOLS` section plus overflow workspace items:

- **Tasks** → `/more/tasks`
- **Sequences** → `/more/sequences` (Phase 2 placeholder)
- **Menus** → `/more/menus`
- **Content** → `/more/content`
- **Integrations** → `/more/integrations`
- **Settings** → `/more/settings`
- **Docs** → `/more/docs` (in-app webview or native doc list)
- Footer: **API this month** meter (`$X / $25 cap`), account row, **Sign out**.

### Navigation stacks

Each tab is a stack. List screens push detail screens; detail screens support **swipe-from-left-edge back** and a header back button. Modals (add lead, filters, compose) present as bottom sheets or full-screen modals over the active tab.

---

## Native Interaction Patterns (apply globally)

- **Pull-to-refresh** on Today, Pipeline, Drafts, Leads, Integrations.
- **Swipe row actions:** Drafts (swipe right → Approve, swipe left → Reject), Leads (swipe → quick stage change / open), Tasks (swipe → complete).
- **Bottom sheets** for: Add lead, Change stage, Filters, Draft "Why this draft" expand, Task add, Menu filters.
- **Haptics** on confirm/destructive/stage actions.
- **Optimistic updates** everywhere, with toast + rollback on error.
- **Skeleton loaders** replace all text-only `Loading...`.
- **Safe areas** respected on every screen (notch top, home-indicator bottom; tab bar sits above the indicator).
- **Empty states** with a clear CTA, never a blank screen.
- **Keyboard handling:** `KeyboardAvoidingView` + toolbar with Done; send/approve reachable above the keyboard when editing.
- **Search** is native, debounced, with cancel.
- **Deep links:** push notifications and universal links open the exact draft/lead (`/drafts/[id]`, `/leads/[id]`).

---

## Screen-by-Screen Specifications

Each screen lists **Purpose → Mobile pattern → Contents → Interactions → Acceptance criteria.** Acceptance criteria are the pass/fail checklist for Claude Code.

### 1. Today (`/(tabs)/today`)

**Purpose:** Morning brief and command center — what needs Nana first.
**Mobile pattern:** Single scroll view; sticky header with greeting + refresh.

**Contents:**
- Header: "Good morning, {name}" (serif display) + "Brief from {time}" + **Refresh brief** button.
- **Stat tiles** — 2×2 grid: Hot replies, Drafts to approve, Follow-ups due, Active leads. Each tile taps through to the relevant filtered list.
- **TLDR** card: AI summary paragraph.
- **NEEDS YOU FIRST** section: list of priority cards, each with title, summary, and inline actions **Approve** and **Review →** (Review opens the linked draft/lead).

**Interactions:**
- Pull-to-refresh and Refresh button both regenerate the brief (call brief API), with a loading shimmer on tiles + TLDR.
- Tapping a stat tile navigates to Drafts/Leads with the matching filter applied.
- **Approve** on a priority card fires the approve-&-send mutation inline (haptic + toast, card animates out).
- **Review →** deep-links to the draft or lead detail.

**Acceptance criteria:**
- [ ] Stat tiles render in a 2×2 grid on a 390pt-wide screen with no clipping.
- [ ] Refresh (pull or button) shows skeletons, not blank/`Loading...`, and updates `generated_at`.
- [ ] Inline **Approve** sends the draft and removes the card optimistically; failure restores it with an error toast.
- [ ] Each stat tile deep-links to the correct filtered screen.
- [ ] Header and content respect the top safe area.

### 2. Pipeline (`/(tabs)/pipeline`)

**Purpose:** See and move leads across the 5 sales stages.
**Mobile pattern:** **Segmented/scrollable stage pager** at top (Sourced 72 · Contacted 0 · Responded 0 · Negotiating 0 · Trial & Won 0). Selecting a stage shows a vertical scroll of `LeadCard`s for that stage only. Replaces the horizontal kanban.

**Contents:**
- Sticky segmented control with per-stage counts (horizontally scrollable, active stage underlined in brass).
- `LeadCard` per lead: name, organization, tag chips, and a **stage control** (tap → stage picker bottom sheet).
- Header **+ Add lead** button → Add-lead bottom sheet.

**Interactions:**
- Swipe left/right on the segmented control or the card area to move between stages (pager).
- Tap a card → Lead detail. Tap the stage control → bottom sheet to move the lead (optimistic move + haptic; card animates to reflect new stage/count).
- Pull-to-refresh reloads counts and cards.
- Optional (P2): long-press a card to drag to another stage segment.

**Acceptance criteria:**
- [ ] No horizontal off-screen columns; only one stage's cards show at a time, chosen by the segmented control/pager.
- [ ] Stage counts match the data and update live after a move.
- [ ] Moving a lead's stage updates the card optimistically and re-buckets it; failure rolls back with a toast.
- [ ] + Add lead opens a sheet that creates a `manual`-source lead and shows it immediately.
- [ ] Long lists (72 in Sourced) scroll at 60fps (FlashList).

### 3. Drafts — List (`/(tabs)/drafts`)

**Purpose:** The core triage queue — approve/reject AI email drafts fast.
**Mobile pattern:** Full-screen swipeable list (no split pane). Tap → full-screen draft detail (push).

**Contents:**
- Header: "Drafts ({count})" + filter/search affordance.
- `DraftRow` per item: sender/lead name (+ org), subject line, `email · pending` meta. Optional grouping or a filter chip row (All / Booking inquiries / Noise) to separate real leads from marketing/system noise (the brief calls out "low-signal noise" — surfacing a Noise filter enables fast bulk-clear).
- Optional **bulk mode**: select multiple → bulk approve/reject (the brief explicitly asks to "bulk-delete non-business noise").

**Interactions:**
- **Swipe right → Approve & send** (green, haptic success). **Swipe left → Reject** (terracotta, haptic warning). Partial swipe reveals the action; full swipe commits.
- Tap → draft detail.
- Pull-to-refresh. Search filters by sender/subject.
- Badge on the Drafts tab reflects pending count and decrements as items clear.

**Acceptance criteria:**
- [ ] List renders 100+ rows at 60fps.
- [ ] Swipe-right approves and swipe-left rejects with correct colors, haptics, and optimistic removal; failures restore the row.
- [ ] Tab badge equals pending draft count and updates after each action.
- [ ] Search/filter narrows the list without a full reload.
- [ ] Bulk mode (if built) can approve/reject a multi-select in one action.

### 4. Drafts — Detail (`/drafts/[id]`)

**Purpose:** Read one draft and act on it.
**Mobile pattern:** Full-screen reader with a **sticky bottom action bar**.

**Contents:**
- Header: back, lead name, "View thread" link (opens the email thread).
- **To** row.
- **WHY THIS DRAFT** — collapsible AI-rationale block (expanded by default, tap to collapse).
- **Subject** + full **body** (scrollable, selectable text).
- Sticky bottom bar: **Approve & send** (green, primary), **Edit**, **Redraft**, **Reject**.

**Interactions:**
- Approve & send → confirm via bottom bar; haptic; on success pop back to list and decrement badge.
- **Edit** → inline editable body (rich-ish text, keyboard toolbar with Done); Save updates the draft.
- **Redraft** → regenerate via AI API, show shimmer on body, replace on return.
- **Reject** → confirm sheet (destructive), removes from queue.
- "View thread" → thread view (list of prior messages) as a pushed screen or sheet.

**Acceptance criteria:**
- [ ] Action bar stays pinned above the keyboard and the home indicator.
- [ ] Approve & send calls the send API, pops to list, and updates the badge; error keeps the user on the draft with a toast.
- [ ] Edit persists changes to the draft body before sending.
- [ ] Redraft shows a loading state on the body and swaps in the new content.
- [ ] "Why this draft" is collapsible and does not push the actions off-screen.

### 5. Leads — List (`/(tabs)/leads`)

**Purpose:** Browse/search all leads.
**Mobile pattern:** **Card list**, not a table. Each card carries the key columns as labeled fields.

**Contents:**
- Header: "All Leads ({count})", **↓ Gmail (60d)** import button, **+ Add lead**.
- Search bar + filter sheet (by stage, market, source).
- `LeadCard`: name (title), organization, market, **stage pill**, fit, value/yr, source tag. Lay the 7 table columns out as a two-line card (name + org on line 1; stage/market/source chips on line 2), so nothing truncates.

**Interactions:**
- Tap → Lead detail. Swipe → quick stage change.
- **↓ Gmail (60d)** → triggers the Gmail import API with a progress indicator; new `gmail_import` leads appear on completion.
- Pull-to-refresh; search debounced.

**Acceptance criteria:**
- [ ] Zero horizontal scrolling; all lead fields visible or gracefully wrapped on a 390pt screen.
- [ ] Search and stage/source filters work together.
- [ ] Gmail import shows progress and appends new leads without a manual reload.
- [ ] 72+ leads scroll at 60fps.

### 6. Leads — Detail (`/leads/[id]`)  *(new — web app has no real detail view)*

**Purpose:** One lead's full profile and history in one place.
**Mobile pattern:** Scrollable profile with sections.

**Contents:**
- Header: name, org, stage pill, tag chips; **stage control** (bottom sheet).
- **Fields:** market, fit, value/yr, source, created date.
- **Drafts/emails** for this lead (list, deep-link to draft detail).
- **Tasks** for this lead (add/complete inline).
- **Activity/thread** timeline.
- Actions: Edit lead, Add task, Compose/Generate draft.

**Acceptance criteria:**
- [ ] Opens from Pipeline, Leads, and Today deep links.
- [ ] Stage change from here updates Pipeline counts everywhere (shared cache).
- [ ] Related drafts and tasks load and deep-link correctly.
- [ ] Edit persists field changes.

### 7. Tasks (`/more/tasks`)

**Purpose:** Lightweight task list for the team.
**Mobile pattern:** Quick-add input + filter chips + list.

**Contents:**
- Quick-add field ("Add a task and press Enter") pinned near top; owner picker (Fred / Jillian).
- Tabs: **My Tasks / All / Overdue**. Filters: owner, status (Open / In progress / Done), Show done toggle.
- Task rows: title, owner, status, due; swipe → complete.
- Empty state: "No open tasks assigned to you."

**Acceptance criteria:**
- [ ] Quick-add creates a task and it appears at top instantly (optimistic).
- [ ] Tab + filter combinations return the correct set.
- [ ] Swipe-to-complete marks done with haptic; Show done reveals completed tasks.

### 8. Sequences (`/more/sequences`)

**Purpose:** Placeholder — matches web "Coming in Phase 2."
**Mobile pattern:** Single centered card: "Coming in Phase 2" + the descriptive copy. No interactions until the backend ships.

**Acceptance criteria:**
- [ ] Renders the placeholder card, styled to match the design system; no dead controls.

### 9. Menus (`/more/menus`)

**Purpose:** Menu library for events.
**Mobile pattern:** Search + filter sheet + card grid/list; empty state with CTA.

**Contents:**
- Header: "Menus ({count})", **+ New menu**.
- Filters: occasion, cuisine, status (Active / Draft / Archived), guests.
- Menu cards: title, occasion, cuisine, status pill, guest count.
- Empty state: "No menus yet — Add your first menu to start building the library." + **Add first menu**.
- Menu detail (`/more/menus/[id]`): dishes, occasion/cuisine/status, guests; edit.

**Acceptance criteria:**
- [ ] Filters (occasion/cuisine/status/guests) narrow the list correctly.
- [ ] Empty state shows when 0 menus and the CTA opens the create flow.
- [ ] Create/edit persists to the menu store.

### 10. Content (`/more/content`)

**Purpose:** Edit public-site content (Sanity) from the phone.
**Mobile pattern:** List of section rows → each pushes a section editor.

**Contents:**
- Rows: **Events**, **Services**, **Credentials**, **Press**, **Site Settings**, each with subtitle. "Open full Studio ↗" link (opens Sanity Studio in a webview/browser).
- Section editors: mobile-friendly forms for the Sanity documents (Phase 2 can start read-only with a link out to Studio for heavy edits).

**Acceptance criteria:**
- [ ] Section list renders with correct subtitles and pushes to each editor.
- [ ] Reads current Sanity content; edits (Phase 2) write back.
- [ ] "Open full Studio" opens the external editor cleanly.

### 11. Integrations (`/more/integrations`)

**Purpose:** Live health/stats of connected services.
**Mobile pattern:** Vertical stack of stat cards (was a 2×2 grid); pull-to-refresh.

**Contents:**
- **Google Analytics** card: 7-day + 30-day page views / sessions / users; "Open GA4 ↗".
- **Vercel** card: live deploy status + recent deploys list; "Dashboard ↗".
- **Outreach (Resend)** card: sent this month / all time / pending drafts; "Resend ↗".
- **Content (Sanity)** card: events/services/credentials/press counts; "Open Studio ↗".
- Header: "Live stats … last refreshed {time}" + **Refresh**.

**Acceptance criteria:**
- [ ] Cards stack vertically with no clipped numbers.
- [ ] Refresh (pull + button) updates stats and the "last refreshed" time.
- [ ] External "Open ↗" links open in-app browser / native browser.

### 12. Settings (`/more/settings`)

**Purpose:** Config for keys, voice, sending, connections.
**Mobile pattern:** Grouped settings form (sectioned list), native inputs/toggles.

**Contents:**
- **API Keys:** Anthropic (Connected), Apollo; **API spend this month** meter ($0 / $25); **Monthly budget cap** input.
- **Your voice:** multiline notes (tone/always/never); note that Discord "Coach" notes land here.
- **Approve before sending** toggle (recommended on).
- **Writing examples:** add 2–5 example emails (multiline entries).
- **Email sending:** sending domain.
- **Gmail inbox:** connection status (`georginasfoods@gmail.com`, every 10 min), **Reconnect**.
- **Discord notifications:** status + **Send test notification**.
- **Find leads via Apollo:** search (enabled when Apollo key present).
- **Push notifications (new):** enable/disable device push, per-type toggles (new drafts, hot replies, daily brief ready).

**Acceptance criteria:**
- [ ] Secret fields are masked and never logged; keys are written server-side, not stored in the app bundle.
- [ ] Budget cap and voice/examples persist and reflect on reload.
- [ ] Approve-before-sending toggle changes send behavior.
- [ ] Push toggle registers/deregisters the Expo push token in `device_tokens`.

### 13. More / Account (`/(tabs)/more`)

**Purpose:** Hub for Tools + account.
**Contents:** grouped list (Tasks, Sequences, Menus, Content, Integrations, Settings, Docs), **API this month** meter, account row, **Sign out**.

**Acceptance criteria:**
- [ ] All rows route correctly; API meter matches Settings.
- [ ] Sign out clears the Supabase session and secure store, returns to auth.

### 14. Auth (`/auth`)

**Purpose:** Sign in with the existing Supabase accounts.
**Mobile pattern:** Branded sign-in (email/password or magic link, matching web auth). Biometric unlock (Face ID / fingerprint) after first login via `expo-local-authentication`.

**Acceptance criteria:**
- [ ] Signs in against the same Supabase project as web.
- [ ] Session persists in secure store; biometric unlock on relaunch.
- [ ] Failed auth shows a clear inline error, no crash.

---

## Push Notifications

Replace the "find out via Discord" gap with native push.

**Triggers:**
- New draft generated for a real lead → "New draft ready: {lead} — {subject}".
- Hot reply detected → "Hot reply from {lead}".
- Morning brief ready → "Your brief is ready — {n} drafts to approve".

**Implementation:**
- Register `expo-notifications` token on login; store in `device_tokens` keyed to `user_id`.
- Server-side: when a draft/brief event fires (same hook that posts to Discord), also send Expo push to that user's tokens.
- Tapping a notification deep-links to the exact draft (`/drafts/[id]`) or the brief.
- Respect the Settings per-type toggles.

**Acceptance criteria:**
- [ ] A newly generated draft produces a push within the existing notification pipeline.
- [ ] Tapping the push opens the specific draft, authenticated.
- [ ] Disabling a type in Settings stops that push.

---

## Offline & Performance (Phase 1 scope)

- **Read cache:** React Query persists last-loaded drafts, leads, brief; app opens to cached data instantly, then background-refetches.
- **Action queue:** approve/reject/stage-change made offline queue and flush on reconnect (optimistic locally, reconciled on sync). If full queueing is too much for P1, at minimum disable actions offline with a clear "You're offline" banner rather than failing silently.
- **Targets:** cold start < 2s to first meaningful paint (cached), list scroll 60fps, action feedback < 100ms (optimistic), draft send round-trip < 2s on 4G.

---

## Phased Delivery

### Phase 1 — MVP: native triage (Weeks 1–4)

| Feature | Description | Priority | Complexity |
|---|---|---|---|
| App shell + auth | Expo Router, bottom tabs, Supabase auth, secure session, design tokens | P0 | Med |
| Today brief | Stats grid, TLDR, priority cards w/ inline approve, refresh | P0 | Med |
| Drafts list + swipe | FlashList, swipe approve/reject, badge, search | P0 | High |
| Draft detail | Reader, why-this-draft, sticky actions, edit/redraft/reject | P0 | High |
| Leads list (cards) | Card layout, search/filter, Gmail import trigger | P0 | Med |
| Pipeline (pager) | Segmented stages, cards, stage-change sheet | P0 | Med |
| Design system | Tokens, components, skeletons, empty states, haptics | P0 | Med |
| Push (new drafts) | Expo push token, server send, deep link | P0 | Med |

### Phase 2 — depth (Weeks 5–8)

| Feature | Description | Priority | Complexity |
|---|---|---|---|
| Lead detail | Full profile, related drafts/tasks/thread | P1 | Med |
| Tasks | Quick-add, filters, swipe-complete | P1 | Low |
| Menus | Library, filters, create/edit, empty state | P1 | Med |
| Integrations | Stat cards, refresh, external links | P1 | Low |
| Settings | Full config, push toggles, budget, voice | P1 | Med |
| Bulk draft actions | Multi-select approve/reject noise | P1 | Med |
| Dark mode | Warm dark palette across app | P1 | Low |
| Offline action queue | Queue + flush on reconnect | P2 | High |

### Phase 3 — scale (Weeks 9–12)

| Feature | Description | Priority | Complexity |
|---|---|---|---|
| Content editors | In-app Sanity section editing | P2 | Med |
| Sequences | Ship when backend logic exists | P2 | Med |
| Pipeline drag | Long-press drag between stages | P2 | Med |
| Apollo search | In-app lead discovery | P2 | Med |
| Docs | Native/in-app docs | P2 | Low |

---

## Non-Functional Requirements

**Performance:** cold start < 2s (cached), 60fps long lists, optimistic action feedback < 100ms.

**Security:** Supabase Auth sessions in `expo-secure-store`; RLS on all mobile-reachable tables; no service-role keys or third-party secrets in the app bundle; all AI/email/import calls proxied through server routes; masked secret fields; certificate-pinned API calls (P2).

**Accessibility:** minimum 44×44pt touch targets; Dynamic Type support; VoiceOver/TalkBack labels on actions and stat tiles; color contrast AA against the cream/dark palettes; no color-only status (pair stage color with text).

**Platforms:** iOS 16+ and Android 11+; iPhone SE → Pro Max widths without clipping; safe-area correct on notch + home-indicator devices.

**Release:** EAS Build; TestFlight + Play internal track for the team; EAS Update for JS-only OTA fixes.

---

## Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Median draft triage time (open → action) | < 8s | In-app timing event (Sentry/GA) |
| Drafts cleared per session on mobile | ↑ vs. web mobile baseline | Action events per session |
| Time-to-first-response on hot leads | ↓ meaningfully after push ships | Draft `created_at` → `sent_at` |
| Pending-draft backlog | Trend toward < 20 | `drafts_to_approve` over time |
| Crash-free sessions | > 99.5% | Sentry |
| Daily active use by Nana + Jillian | Both, most weekdays | Auth/session analytics |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Scope creep from "full rebuild" delays the one flow that matters | High | Med | Ship Phase 1 triage-only; every other screen is P1/P2. Draft triage is the release gate. |
| Backend contracts differ from what's inferred here | Med | Med | First task: read the Supabase schema + API routes and reconcile the data model before UI work. |
| Web and mobile clients drift | Med | Med | Monorepo with shared `types`/`schemas`/`api-client` packages; one source of truth. |
| Secrets leaking into the app bundle | High | Low | All AI/email/import calls go through server routes; only the Supabase anon key + user session live on device; RLS enforced. |
| App Store review friction for a 2-user internal tool | Med | Med | Distribute via TestFlight + Play internal testing; public store listing optional. |
| Kanban/table→mobile patterns feel unfamiliar to current users | Med | Low | Keep tab order and stage names identical to web; segmented pager preserves the same mental model. |
| Push pipeline duplicates or misses vs. Discord | Med | Med | Hook push into the same server event that posts to Discord; test with "Send test notification". |

---

## Timeline & Milestones

| Week | Milestone | Deliverable |
|---|---|---|
| 1 | Foundation | Monorepo/shared types, Expo shell, tabs, Supabase auth, design tokens, skeletons |
| 2 | Triage core | Drafts list w/ swipe + badge; draft detail w/ actions |
| 3 | Brief + leads + pipeline | Today brief; Leads card list + Gmail import; Pipeline pager + stage change |
| 4 | Push + polish + ship P1 | Expo push (new drafts), haptics, empty states, TestFlight/Play internal build |
| 5–8 | Depth | Lead detail, Tasks, Menus, Integrations, Settings, bulk actions, dark mode |
| 9–12 | Scale | Content editors, Sequences (when backend ready), Apollo, offline queue, drag |

---

## Open Questions

- [ ] Confirm the exact Supabase schema (table/column names) and which mutations already have API routes vs. need new ones.
- [ ] Confirm auth method the web app uses (password vs. magic link vs. OAuth) so mobile matches.
- [ ] Which brand fonts does the web app load, and are their licenses OK to bundle in a native app?
- [ ] Public App Store listing, or internal distribution only (TestFlight + Play internal)?
- [ ] Is dark mode a must-have for launch or acceptable in Phase 2?
- [ ] Does the Gmail import run client-triggered only, or should mobile also reflect the 10-minute auto-poll status?
- [ ] Confirm whether direct Supabase writes (with RLS) are acceptable for CRUD, or everything should route through the Next.js API.

---

## Appendix A — Suggested File Structure (Expo Router)

```
/apps/mobile
  /app
    _layout.tsx                 # root: providers (QueryClient, theme, auth gate)
    /auth
      index.tsx                 # sign in
    /(tabs)
      _layout.tsx               # bottom tab bar (Today/Pipeline/Drafts/Leads/More)
      today.tsx
      pipeline.tsx
      drafts.tsx                # list
      leads.tsx                 # list
      more.tsx
    /drafts/[id].tsx            # draft detail
    /leads/[id].tsx             # lead detail
    /more
      tasks.tsx
      sequences.tsx
      menus.tsx
      menus/[id].tsx
      content.tsx
      content/[section].tsx
      integrations.tsx
      settings.tsx
      docs.tsx
  /components                   # StatTile, LeadCard, DraftRow, StagePill, buttons, sheets, skeletons…
  /features                     # drafts/, leads/, pipeline/, today/, tasks/, menus/ (hooks + logic)
  /lib                          # supabase client, api-client, query hooks, push, haptics, theme
  /theme                        # tokens (light/dark), typography
  app.config.ts                 # Expo config, push, universal links
/packages/types                 # Lead, Draft, Task, Menu, Brief…
/packages/api-client            # typed wrappers for /api/* routes
/packages/schemas               # zod schemas
```

## Appendix B — Key Packages

```
expo, expo-router, expo-font, expo-secure-store, expo-haptics,
expo-notifications, expo-local-authentication, expo-image
@tanstack/react-query
@supabase/supabase-js
@shopify/flash-list
@gorhom/bottom-sheet
react-native-gesture-handler, react-native-reanimated, react-native-safe-area-context
nativewind (or tamagui / @shopify/restyle)
@sentry/react-native
zod
```

## Appendix C — Environment / Config

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (client-safe).
- `API_BASE_URL` → `https://www.chefnanawilmot.com` (server routes for AI/email/import).
- Server-only (never in app): Anthropic, Resend, Gmail OAuth, Apollo, Sanity write token, Discord IDs, Expo push server key.
- New Supabase table: `device_tokens (id, user_id, expo_push_token, platform, created_at)` with RLS.

## Appendix D — Handoff Prompt for Claude Code

> Build the Lead Studio mobile app per this PRD. Start by reading the existing Next.js app under `/apps/web` (or the current repo): the Supabase schema, the `/api/*` routes, the auth setup, and the Tailwind/theme tokens. Reconcile the Data Model section against the real schema and flag differences before writing UI. Then scaffold `/apps/mobile` as an Expo Router app with the tab structure and design tokens, and implement Phase 1 in order: app shell + auth → Drafts list (swipe) → Draft detail → Today brief → Leads → Pipeline → push. Reuse server routes for any AI/email/import action; only the Supabase anon key and user session live on device. Match the web app's brand (cream/brass/green, editorial serif headers). Deliver each screen against its acceptance criteria.

---

*Screens audited live at `chefnanawilmot.com/admin` on July 22, 2026: Today, Pipeline, Drafts, Leads, Tasks, Sequences, Content, Menus, Integrations, Settings. Data model, tech stack, and brand tokens inferred from that audit — confirm exact schema and theme values against the codebase during build.*
