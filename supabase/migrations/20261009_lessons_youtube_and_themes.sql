-- Video-backed lessons and synchronised visual preferences.
alter table public.profiles add column if not exists theme text;
alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check
  check (theme is null or theme in ('notion-light', 'notion-dark', 'akiflow-midnight', 'warm-sepia'));

revoke update on public.profiles from anon, authenticated;
grant update (display_name, theme, updated_at) on public.profiles to authenticated;

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 500),
  ar_title text not null default '',
  subject text not null,
  level text not null check (level in ('1AS', '2AS', '3AS')),
  term text not null check (term in ('1', '2', '3', 'all')),
  file_url text,
  youtube_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_resource_check check (file_url is not null or youtube_url is not null),
  constraint lessons_youtube_url_check check (
    youtube_url is null or youtube_url ~ '^https?://(www[.])?(youtube[.]com|m[.]youtube[.]com|youtu[.]be|youtube-nocookie[.]com)/'
  )
);

alter table public.lessons enable row level security;
create policy "Lessons are publicly readable" on public.lessons for select using (true);
create policy "Admins create lessons" on public.lessons for insert to authenticated with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins update lessons" on public.lessons for update to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins delete lessons" on public.lessons for delete to authenticated using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
