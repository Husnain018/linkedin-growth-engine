
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  brand_voice text default 'Professional, insightful, conversational. Avoid jargon and corporate fluff.',
  target_audience text default 'Founders, product builders, and growth-minded professionals on LinkedIn.',
  niche text default 'AI, startups, and product growth',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.agent_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;

-- LINKEDIN ACCOUNTS
create table public.linkedin_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linkedin_urn text not null,
  linkedin_name text,
  linkedin_picture text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.linkedin_accounts enable row level security;
create policy "li_select_own" on public.linkedin_accounts for select using (auth.uid() = user_id);
create policy "li_delete_own" on public.linkedin_accounts for delete using (auth.uid() = user_id);

-- AGENT SETTINGS
create table public.agent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  autopilot_enabled boolean not null default false,
  daily_post_time time not null default '09:00:00',
  timezone text not null default 'UTC',
  posts_per_week int not null default 5,
  content_pillars text[] not null default array['Education','Personal story','Industry trends','Tactical tips','Hot takes'],
  preferred_hashtags text[] not null default array['#AI','#startups','#productivity'],
  notify_email boolean not null default true,
  ai_extra_instructions text default '',
  updated_at timestamptz not null default now()
);
alter table public.agent_settings enable row level security;
create policy "as_select_own" on public.agent_settings for select using (auth.uid() = user_id);
create policy "as_insert_own" on public.agent_settings for insert with check (auth.uid() = user_id);
create policy "as_update_own" on public.agent_settings for update using (auth.uid() = user_id);

-- POSTS
create type post_status as enum ('draft','scheduled','publishing','published','failed','cancelled');
create type post_type as enum ('text','image','carousel','article');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type post_type not null default 'text',
  status post_status not null default 'draft',
  topic text,
  hook text,
  content text not null,
  hashtags text[] default '{}',
  media_urls text[] default '{}',
  scheduled_for timestamptz,
  published_at timestamptz,
  linkedin_post_urn text,
  linkedin_post_url text,
  error_message text,
  retry_count int not null default 0,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_user_status_idx on public.posts(user_id, status);
create index posts_schedule_idx on public.posts(status, scheduled_for) where status = 'scheduled';
create index posts_hash_idx on public.posts(user_id, content_hash);
alter table public.posts enable row level security;
create policy "posts_select_own" on public.posts for select using (auth.uid() = user_id);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = user_id);

-- POST ANALYTICS
create table public.post_analytics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  impressions int default 0,
  clicks int default 0,
  captured_at timestamptz not null default now()
);
create index analytics_post_idx on public.post_analytics(post_id, captured_at desc);
alter table public.post_analytics enable row level security;
create policy "an_select_own" on public.post_analytics for select using (auth.uid() = user_id);

-- ACTIVITY LOG
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  level text not null default 'info',
  message text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index logs_user_idx on public.activity_logs(user_id, created_at desc);
alter table public.activity_logs enable row level security;
create policy "log_select_own" on public.activity_logs for select using (auth.uid() = user_id);

-- TRIGGER: new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.agent_settings for each row execute function public.touch_updated_at();
