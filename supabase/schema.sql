create extension if not exists pgcrypto;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('writing', 'thought', 'program')),
  slug text not null,
  title text,
  content text not null,
  date date,
  video_name text,
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_items_type_slug_key
  on public.content_items (content_type, slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_content_items_updated_at on public.content_items;
create trigger set_content_items_updated_at
before update on public.content_items
for each row
execute function public.set_updated_at();
