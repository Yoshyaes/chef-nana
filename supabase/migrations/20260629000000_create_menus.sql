-- Menus table for the Lead Studio admin
-- Apply this in the Supabase SQL editor or via supabase db push

create table public.menus (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  occasion        text[]      not null default '{}',
  cuisine         text[]      not null default '{}',
  season          text,
  guest_min       int,
  guest_max       int,
  courses         jsonb       not null default '[]'::jsonb,
  -- courses: [{ "name": "Mains", "dishes": [{ "name": "...", "description": "...", "dietary": [], "allergens": [] }] }]
  source_photos   jsonb       not null default '[]'::jsonb,
  -- source_photos: [{ "path": "menu-photos/uuid/file.jpg", "type": "image/jpeg", "uploadedAt": "..." }]
  status          text        not null default 'draft' check (status in ('draft', 'active', 'archived')),
  price_per_guest numeric,
  last_used_at    date,
  notes           text,
  search_tsv      tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index menus_search_idx  on public.menus using gin (search_tsv);
create index menus_status_idx  on public.menus (status);
create index menus_occasion_idx on public.menus using gin (occasion);
create index menus_cuisine_idx  on public.menus using gin (cuisine);

-- Keeps search_tsv and updated_at current.
-- Indexes title, notes, and every dish name + description.
create or replace function public.menus_search_update() returns trigger as $$
begin
  new.search_tsv := to_tsvector('english',
    coalesce(new.title, '') || ' ' || coalesce(new.notes, '') || ' ' ||
    coalesce((
      select string_agg(
        coalesce(course ->> 'name', '') || ' ' ||
        coalesce((
          select string_agg(
            coalesce(dish ->> 'name', '') || ' ' || coalesce(dish ->> 'description', ''),
            ' '
          )
          from jsonb_array_elements(coalesce(course -> 'dishes', '[]'::jsonb)) as dish
        ), ''),
        ' '
      )
      from jsonb_array_elements(coalesce(new.courses, '[]'::jsonb)) as course
    ), '')
  );
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger menus_search_trg
  before insert or update on public.menus
  for each row execute function public.menus_search_update();

alter table public.menus enable row level security;

-- Mirror the leads table RLS: service role bypasses this, but anon key is blocked.
-- Authenticated users (admin session) can read and write their own data.
create policy "Admin can manage menus"
  on public.menus
  for all
  to authenticated
  using (true)
  with check (true);

-- Create the private storage bucket for menu photos.
-- Run this after the table migration, or create the bucket manually in the
-- Supabase dashboard under Storage > New Bucket (name: menu-photos, private).
insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', false)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload and read from menu-photos.
create policy "Authenticated can upload menu photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-photos');

create policy "Authenticated can read menu photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'menu-photos');

create policy "Authenticated can delete menu photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-photos');
