-- Job status table for AI photo-to-menu extraction (Menus Phase 2)
-- A transient record: created when extraction is requested, polled by the
-- admin UI, and never referenced by menus directly (results are merged into
-- the in-memory form and only persisted when the menu itself is saved).

create table public.menu_extractions (
  id           uuid        primary key default gen_random_uuid(),
  photo_paths  jsonb       not null,
  -- photo_paths: [{ "path": "menu-photos/uuid/file.jpg", "type": "image/jpeg" }]
  status       text        not null default 'pending' check (status in ('pending', 'done', 'error')),
  result       jsonb,
  -- result: { "title": "...", "courses": [{ "name": "...", "dishes": [...] }] }
  error        text,
  created_at   timestamptz not null default now()
);

alter table public.menu_extractions enable row level security;

create policy "Admin can manage menu extractions"
  on public.menu_extractions
  for all
  to authenticated
  using (true)
  with check (true);
