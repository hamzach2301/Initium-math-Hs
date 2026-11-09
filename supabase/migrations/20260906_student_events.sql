-- Personal calendar items. Apply after 20260902_multi_user.sql.
create table if not exists public.student_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  event_date date not null,
  type text not null check (type in ('study', 'exam', 'task')),
  created_at timestamptz not null default now()
);
alter table public.student_events enable row level security;
create policy "Students read their own calendar events" on public.student_events for select to authenticated using (user_id = auth.uid());
create policy "Students create their own calendar events" on public.student_events for insert to authenticated with check (user_id = auth.uid());
create policy "Students delete their own calendar events" on public.student_events for delete to authenticated using (user_id = auth.uid());
