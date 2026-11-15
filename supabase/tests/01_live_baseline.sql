-- Test rig only. The objects that existed in the live project (celqksoohozvqbdktapm) when it was inspected read-only
-- on 2026-11-15, written out from the catalog: the result of the three migrations applied there on 2026-11-07
-- (account_system_init, lock_down_rls_auto_enable, updated_at_trigger_and_policy_tuning). The 10.0 and 10.1 migrations
-- are tested on top of this, because this is what they will meet. (The rls_auto_enable event trigger is left out: it
-- only switches RLS on for new tables, which the migrations do themselves.)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (char_length(username) >= 3 and char_length(username) <= 24),
  created_at timestamptz not null default now()
);
create table public.coasters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) >= 1 and char_length(name) <= 80),
  design jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index coasters_user_id_idx on public.coasters (user_id);
alter table public.profiles enable row level security;
alter table public.coasters enable row level security;

create policy "Users can view their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users can view their own coasters" on public.coasters for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own coasters" on public.coasters for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own coasters" on public.coasters for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own coasters" on public.coasters for delete to authenticated using ((select auth.uid()) = user_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'rider_' || substr(new.id::text, 1, 8)));
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
create trigger coasters_set_updated_at before update on public.coasters for each row execute function public.set_updated_at();
