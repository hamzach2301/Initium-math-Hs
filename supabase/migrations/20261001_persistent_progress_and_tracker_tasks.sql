-- Run after the existing migrations. This makes material progress and the
-- tracker durable per authenticated student.
alter table public.tracker_tasks add column if not exists material_id text;
alter table public.tracker_tasks add column if not exists suggested boolean not null default false;

create table if not exists public.student_material_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_id text not null,
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create table if not exists public.student_tracker_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  initialized boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.student_material_progress enable row level security;
alter table public.student_tracker_settings enable row level security;

create policy "Students read their own material progress" on public.student_material_progress for select to authenticated using (user_id = auth.uid());
create policy "Students create their own material progress" on public.student_material_progress for insert to authenticated with check (user_id = auth.uid());
create policy "Students update their own material progress" on public.student_material_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Students delete their own material progress" on public.student_material_progress for delete to authenticated using (user_id = auth.uid());

create policy "Students read their tracker settings" on public.student_tracker_settings for select to authenticated using (user_id = auth.uid());
create policy "Students create their tracker settings" on public.student_tracker_settings for insert to authenticated with check (user_id = auth.uid());
create policy "Students update their tracker settings" on public.student_tracker_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
