-- Tighten menu-photos storage policies to require team membership, not just
-- any authenticated Supabase session. Necessary because the ALLOWED_EMAILS
-- allowlist that used to be the only gate on who could become "authenticated"
-- was removed as part of the multi-user auth upgrade, and any Google account
-- can now sign in. Supabase Storage is called directly against Supabase's
-- own API, so these policies are not protected by this app's middleware.

drop policy if exists "Authenticated can upload menu photos" on storage.objects;
drop policy if exists "Authenticated can read menu photos" on storage.objects;
drop policy if exists "Authenticated can delete menu photos" on storage.objects;

create policy "Team members can upload menu photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-photos' and public.is_team_member());

create policy "Team members can read menu photos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'menu-photos' and public.is_team_member());

create policy "Team members can delete menu photos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-photos' and public.is_team_member());
