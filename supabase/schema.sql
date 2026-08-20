-- ============================================================================
-- TaskOrbit — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

-- Profiles (mirrors auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text default '',
  email text default '',
  avatar_url text default '',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  daily_goal integer not null default 5,
  work_hours_start integer not null default 9,
  work_hours_end integer not null default 18,
  default_duration integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#8b5cf6',
  icon text not null default 'tag',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  start_time text,
  end_time text,
  estimated_minutes integer default 60,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email recommendations
create table if not exists public.email_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('morning', 'midday', 'evening')),
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_user_status on public.tasks (user_id, status);
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_tasks_user_priority on public.tasks (user_id, priority);
create index if not exists idx_tasks_category on public.tasks (category_id);
create index if not exists idx_categories_user on public.categories (user_id);
create index if not exists idx_rec_user on public.email_recommendations (user_id, created_at);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.email_recommendations enable row level security;

-- Profiles
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Categories
drop policy if exists "categories select own" on public.categories;
create policy "categories select own" on public.categories
  for select using (auth.uid() = user_id);
drop policy if exists "categories insert own" on public.categories;
create policy "categories insert own" on public.categories
  for insert with check (auth.uid() = user_id);
drop policy if exists "categories update own" on public.categories;
create policy "categories update own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "categories delete own" on public.categories;
create policy "categories delete own" on public.categories
  for delete using (auth.uid() = user_id);

-- Tasks
drop policy if exists "tasks select own" on public.tasks;
create policy "tasks select own" on public.tasks
  for select using (auth.uid() = user_id);
drop policy if exists "tasks insert own" on public.tasks;
create policy "tasks insert own" on public.tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "tasks update own" on public.tasks;
create policy "tasks update own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "tasks delete own" on public.tasks;
create policy "tasks delete own" on public.tasks
  for delete using (auth.uid() = user_id);

-- Email recommendations
drop policy if exists "rec select own" on public.email_recommendations;
create policy "rec select own" on public.email_recommendations
  for select using (auth.uid() = user_id);
drop policy if exists "rec insert own" on public.email_recommendations;
create policy "rec insert own" on public.email_recommendations
  for insert with check (auth.uid() = user_id);
drop policy if exists "rec delete own" on public.email_recommendations;
create policy "rec delete own" on public.email_recommendations
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Trigger: keep profiles.updated_at fresh
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- Trigger: auto-create profile + default categories on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);

  insert into public.categories (user_id, name, color, icon)
  values
    (new.id, 'Work', '#8b5cf6', 'briefcase'),
    (new.id, 'Personal', '#06b6d4', 'user'),
    (new.id, 'Health', '#10b981', 'heart'),
    (new.id, 'Learning', '#f59e0b', 'book-open');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Helper view for daily productivity (used by analytics)
-- ============================================================================
create or replace view public.daily_productivity as
select
  user_id,
  due_date::timestamptz as day,
  count(*) as total_tasks,
  count(*) filter (where status = 'completed') as completed_tasks,
  coalesce((
    count(*) filter (where status = 'completed') * 100.0 /
    nullif(count(*), 0)
  ), 0) as completion_percentage
from public.tasks
where due_date is not null
group by user_id, due_date;

-- ============================================================================
-- Account deletion (called from Settings). Security definer so a user can
-- delete their own auth.users row (service role is never exposed to the client).
-- ============================================================================
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;