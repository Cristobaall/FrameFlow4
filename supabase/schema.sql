create extension if not exists "uuid-ossp";

create table public.videos (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  r2_key          text not null unique,
  public_url      text not null,
  thumbnail_url   text,
  duration        numeric,
  uploader_id     uuid not null references auth.users(id) on delete cascade,
  uploader_name   text,
  uploader_avatar text,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now()
);

create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid not null references public.videos(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  user_name   text,
  user_avatar text,
  content     text not null,
  timecode    numeric not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.videos  enable row level security;
alter table public.comments enable row level security;

create policy "videos_select"  on public.videos  for select using (true);
create policy "videos_insert"  on public.videos  for insert with check (auth.uid() = uploader_id);
create policy "videos_delete"  on public.videos  for delete using (auth.uid() = uploader_id);

create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.comments;

create or replace function increment_views(video_id uuid)
returns void language plpgsql as $$
begin
  update public.videos set view_count = view_count + 1 where id = video_id;
end;
$$;