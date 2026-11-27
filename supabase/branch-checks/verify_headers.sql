-- RUN ONLY ON A SUPABASE BRANCH (an isolated copy of the project), NEVER ON PRODUCTION.
-- Confirms, through the real Supabase API gateway, the one thing the local tests cannot: which address headers reach
-- the database, and that a browser cannot change the fingerprint the rate limits use (public.cl_caller()).
-- Evidence so far (2026-11-27, read-only): every request in the production API log (16 of 16) arrived through
-- Cloudflare with cf-connecting-ip set. This check proves the header also reaches PostgREST unchanged.
--
-- 1. On the branch, after the three migrations in supabase/migrations/, run this file in the SQL editor.
-- 2. From any computer (BRANCH = the branch's project ref, KEY = the branch's publishable key):
--      curl -s -X POST "https://$BRANCH.supabase.co/rest/v1/rpc/cl_debug_headers" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}'
--      curl -s -X POST "https://$BRANCH.supabase.co/rest/v1/rpc/cl_debug_headers" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}' \
--           -H "CF-Connecting-IP: 203.0.113.7" -H "X-Forwarded-For: 203.0.113.8" -H "X-Real-IP: 203.0.113.9"
--    PASS when: "cf_connecting_ip_present" is true in both answers AND "caller" is the same in both answers
--    (the made-up headers in the second call changed nothing). Anything else: tell the owner before launch.
-- 3. Remove it again:  drop function public.cl_debug_headers();
-- It returns header NAMES, never values, plus the one-way fingerprint; it stores nothing.
create or replace function public.cl_debug_headers() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'names', (select jsonb_agg(k order by k) from jsonb_object_keys(coalesce(h, '{}'::jsonb)) k),
    'cf_connecting_ip_present', coalesce(h ? 'cf-connecting-ip', false),
    'x_forwarded_for_hops', coalesce(array_length(string_to_array(h ->> 'x-forwarded-for', ','), 1), 0),
    'cf_is_last_forwarded_hop', btrim(regexp_replace(coalesce(h ->> 'x-forwarded-for', ''), '^.*,', '')) = coalesce(h ->> 'cf-connecting-ip', '-'),
    'caller', public.cl_caller())
  from (select nullif(current_setting('request.headers', true), '')::jsonb as h) x $$;
revoke execute on function public.cl_debug_headers() from public, authenticated;
grant execute on function public.cl_debug_headers() to anon;
