-- Run manually in the Supabase SQL editor, once per person, after
-- 20260714090000_create_profiles.sql has been applied.
--
-- Find each person's id: Supabase dashboard, Authentication, Users, match by
-- the Google email they sign in with, copy the value in the UID column.
-- Fred's auth.users row already exists (soon2b@gmail.com is in the current
-- allowlist, so he has signed in before). Jillian and Nana need to attempt
-- "Continue with Google" once first, the app will reject them with
-- "unauthorized" until their row is inserted here, but the attempt creates
-- their auth.users row so their id becomes visible in the dashboard.

-- Fred, admin. Replace <FRED_AUTH_USER_ID> with his real auth.users id.
insert into public.profiles (id, full_name, role, avatar_color)
values ('<FRED_AUTH_USER_ID>', 'Fred', 'admin', '#C9973A')
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  avatar_color = excluded.avatar_color;

-- Jillian, manager. Uncomment and fill in once her auth.users id is known.
-- insert into public.profiles (id, full_name, role, avatar_color)
-- values ('<JILLIAN_AUTH_USER_ID>', 'Jillian', 'manager', '#2D5F3D')
-- on conflict (id) do update set
--   full_name = excluded.full_name, role = excluded.role, avatar_color = excluded.avatar_color;

-- Nana, owner. Uncomment and fill in once her auth.users id is known.
-- insert into public.profiles (id, full_name, role, avatar_color)
-- values ('<NANA_AUTH_USER_ID>', 'Nana', 'owner', '#B85A35')
-- on conflict (id) do update set
--   full_name = excluded.full_name, role = excluded.role, avatar_color = excluded.avatar_color;
