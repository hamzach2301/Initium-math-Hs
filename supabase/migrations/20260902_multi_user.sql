-- Run this migration in the Supabase SQL editor before enabling the app's authenticated features.
create type public.app_role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracker_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null,
  title text not null check (char_length(title) between 1 and 500),
  ar_title text not null,
  status text not null default 'todo' check (status in ('todo', 'progress', 'done')),
  custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tracker_tasks enable row level security;

create policy "Profiles are readable by their owner" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Profiles may update permitted fields only" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Column privileges prevent a student from ever updating role, including through a crafted API request.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

create policy "Students read their own tasks" on public.tracker_tasks for select to authenticated using (user_id = auth.uid());
create policy "Students create their own tasks" on public.tracker_tasks for insert to authenticated with check (user_id = auth.uid());
create policy "Students update their own tasks" on public.tracker_tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Students delete their own tasks" on public.tracker_tasks for delete to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Student'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Repository files: public read access is intentional; uploads/deletes are restricted to authenticated admins.
insert into storage.buckets (id, name, public) values ('repository', 'repository', true) on conflict (id) do nothing;
create policy "Repository files are publicly readable" on storage.objects for select using (bucket_id = 'repository');
create policy "Only admins upload repository files" on storage.objects for insert to authenticated with check (
  bucket_id = 'repository' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Only admins modify repository files" on storage.objects for update to authenticated using (
  bucket_id = 'repository' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
) with check (bucket_id = 'repository');
create policy "Only admins delete repository files" on storage.objects for delete to authenticated using (
  bucket_id = 'repository' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
