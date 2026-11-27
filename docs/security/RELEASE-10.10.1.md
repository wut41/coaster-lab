# Coaster Lab 10.10.1: release security review (2026-11-27)

**Verdict: not ready for a public release yet.** The database code in this repository now resists every attack in
the test suites, and the 10.10.1 page held up against everything sent to it. But **production does not run that
code**, and several controls can only be switched on by the owner. Until the blockers below are closed, the evidence
does not support calling the game secure.

Ground rules followed: every attack ran in a throw-away local PostgreSQL or a headless browser with a stand-in cloud,
using made-up players and documentation-range addresses. Production was only **read** (catalog queries, migration
list, advisors, Edge Function source, API log field names and counts). Nothing was written to production, nothing was
deployed, no repository setting was changed, and no game code changed.

## Blockers (must be closed before a public release)

| # | Blocker | Who | How |
|---|---|---|---|
| **B1** | **Production lacks all three repository migrations.** 10.10.1 calls 11 `cl_*` functions that do not exist live, so accounts, cloud saves and park sharing do not work, and production sign-up still accepts any name ("Admin" included). | Owner approves | Create a Supabase **branch** (isolated copy, costs a little). Apply `supabase/migrations/` in order, then run B2 there. Then apply the same three files to production. Verified read-only on 2026-11-27: no existing player name would block them (0 case clashes, 0 reserved names, 0 unsafe characters). |
| **B2** | **Rate limits must be confirmed through the real gateway.** The limits now key on `cf-connecting-ip`. Every request in the production API log has it (16 of 16, all through Cloudflare), but only a branch can prove it reaches the database unchanged. | Owner / Duet, on the branch | `supabase/branch-checks/verify_headers.sql` (steps at the top). PASS = same fingerprint with and without forged headers. |
| ~~B3~~ | **PostgreSQL 17: closed 2026-11-27, see below.** Production runs 17.11. The suites ran on 16 here: running downloaded 17.11 binaries was refused by this session's permission check, and the PostgreSQL apt repository is unreachable from here. | On the branch | Run `bash supabase/tests/run.sh payments` on a machine with PostgreSQL 17. Applying the migrations on the branch (B1) also exercises 17. |
| **B4** | **`main` is not protected.** There are no rulesets, Dependabot security updates are off, and **private vulnerability reporting is off**, although `SECURITY.md` tells people to use it. | Owner (admin) | `bash tools/repo/apply-branch-protection.sh --yes`. It now also switches private vulnerability reporting on. This session cannot change settings (blocked by its proxy). |
| **B5** | **Supabase Auth settings** (they cannot be read from this session). The advisor confirms *Leaked password protection* is **off**. The game uses email and password sign-up. | Owner, dashboard | Authentication → Providers → Email: minimum password length **8** (the page asks for 8, but the server default is 6, and the page is not a control). Turn **leaked password protection** on. Prefer **Confirm email on** with a real SMTP sender: with it off and no CAPTCHA, a script can create unlimited accounts, and every account gets one vote per park. URL Configuration: only the game's exact address in Redirect URLs (no wildcards: reset links carry a session). Review Authentication → Rate Limits. |

**2026-11-27: no Supabase branch.** The owner chose not to pay for one (about $0.013 an hour, not covered by the Spend
Cap). The branch was never created. B1–B3 stay open; free ways to close them:
* **B3 (PostgreSQL 17): closed.** The new free CI job `database (PostgreSQL 17)` (`.github/workflows/ci.yml`) ran on
  this branch on 2026-11-27 ([run 46077692819](https://github.com/wut41/coaster-lab/actions/runs/46077692819/job/140769174019)):
  PostgreSQL 17.12, all three migrations applied (each twice), **176 passed, 0 failed**. Production runs 17.11.
* **B1 + B2:** production holds only 3 accounts and no parks, coasters or purchases, so the migrations can go straight
  to production once the owner approves (they were tested on an exact copy of its schema, are safe to run twice, and
  each says how to undo it). Right after that, a short live check with dummy data, deleted afterwards, covers B2 (forged
  headers do not reset the publishing limit) and the game's real sign-in, save and publish path. That check writes to
  production, so it needs its own approval.

## What was fixed (verified)

New migration **`supabase/migrations/20261127000000_coaster_lab_10_10_1_release_hardening.sql`**. It keeps the same
function names, arguments and answers, so 10.0 to 10.10.1 keep working, and it is safe to run twice.

| Attack (check in `supabase/tests/20_attacks.sql`) | Before | After |
|---|---|---|
| Reset the publishing limits by writing a new `x-forwarded-for` / `x-real-ip` each time (L2) | **got through** | blocked: only `cf-connecting-ip`, or the last proxy hop |
| Rotate addresses inside one IPv6 /64 (2^64 addresses per household / server) (L3) | **got through** | blocked: IPv6 counted per /64; neighbours unaffected (L4); `::ffff:` IPv4 still per address (L5) |
| Hammer the leaderboard, the call that ranks every park (L6) | **unlimited** | 1800 an hour per connection (the game asks at most every 20 s) |
| Reverse a stored address fingerprint by hashing all 2^32 IPv4 addresses (F1) | **possible** | keyed with a server secret no API role can read (F2) |
| Publish a guest park as "Admin" / "Coaster Lab Official" (N1), with full-width letters (N2), or as a registered player "EVE" (N3) | **got through** | shown as "Anonymous" |
| Hide right-to-left overrides, zero-width or tag characters in park, author and player names (N4, N5b, N7, N8) | **kept** | removed (NFKC + invisible/bidi/tag strip) |
| Take a player name that only differs by invisible or full-width characters (N5, N6) | **got through** | counts as taken / reserved |
| Write `cl_saves` directly over REST, skipping the park check, the 240/h limit and the revision counter (D1, D2) | **got through** | refused; reading and deleting your own saves still work (D3) |
| Rename yourself directly, skipping the 5/h limit (D4); fill the unused `coasters` table (D5) | **got through** | refused; names change through `cl_set_username` only |
| Store markup as the device label shown on your other devices (V1) | **kept** | cleaned |
| Also: `vip_purchases` loses its last browser grant (report H4) | | |

**Database result:** `bash supabase/tests/run.sh payments` → **176 passed, 0 failed**: production snapshot 27, the
three migrations (each run twice) with the 10.0 / 10.1 checks 65, release attacks and runbook 36, payments design 48.
With only the 10.0 and 10.1 migrations, the same attack file showed **19 of 33 attacks getting through**. All 7
server-side authorization checks (X1–X7) held both before and after.

## Server-side authorization and owner permissions (verified)

* **Browsers can call exactly 12 functions** (X1): the game's `cl_*` set. There is no admin, owner, moderator or helper
  entry point. Helpers, triggers and the secret are unreachable (A6, F2).
* **Only `auth.uid()` identifies a player.** No function or policy reads JWT claims, `app_metadata`,
  `user_metadata`, `auth.role()` or the database role (X2, O2). A token edited to say `service_role` / `admin`
  changes nothing (X4, X5): another player's parks, saves and profile stay out of reach.
* **Account isolation:** a player sees and changes only their own profile, saves and parks, through the functions or
  the tables (B3–B15, E10–E13, X5). Lists and fetched parks never expose device-key hashes, fingerprints, account ids or
  private park keys (X7).
* **The in-game owner and moderator locks are browser-only** (PBKDF2 hashes in the page). That is safe **only because
  the server gives them no power** (O1–O7, X1–X3). Any future owner feature that changes shared data must be enforced
  in the database (a `security definer` function checking a server-side role table that no API role can write).
* **Moderation is done in the dashboard.** The runbook below is tested (M1–M3).

## Browser: the 10.10.1 page (verified)

`builds/coaster_lab_v10_10_1.html` (SHA-256 `33587874…f6f856`) in headless Chromium 1243:

**84 passed, 0 failed.**

| Suite | Result |
|---|---|
| `t26_v10_10_1` | **22 / 22**: version 10.10.1; clean start at 320×568, 390×844 and 1280×800; CSP; start-up requests only to allowed hosts; owner lock PBKDF2 600k + 1.4M rounds, moderator 600k, no passcode in the page; flat 3D memory; quiet offline start |
| `t20_security` A–H | **24 / 24**: XSS from other players' parks, names and codes; injected handlers; hostile park data; a 16 kB code that unpacks to 12 MB; a flood of 300 fake live visitors; owner lock and test flag |
| `t22_diag` | **33 / 33**: diagnostics exist only behind the owner lock |
| `t27_hostile_cloud` (new) | **5 / 5**: parks with 10,000 levels of JSON nesting in three places open with only their real carousel and no errors, in 6.1–6.3 s against 5.8 s for an ordinary park (both include the test's fixed waits); a 10,000-row leaderboard with a 2 MB name is cut to 49 short rows |

(In the first combined run, t26 hit a screenshot timeout after its 9 start-up checks because t27 was running in
parallel on the same CPU. Run on its own, it passed 22 / 22.)

* **three.js integrity:** the import map's `sha384-61S/Nu32…lykFZ` equals the npm-locked `three@0.160.0`
  `build/three.module.js`, recomputed here.
* **Content Security Policy** (t26): `default-src`, `object-src`, `frame-src`, `base-uri`, `script-src-attr` are `'none'`,
  with no `unsafe-eval` and only the expected hosts. `script-src` still allows `'unsafe-inline'` and all of
  `cdn.jsdelivr.net`, which is the game's single-file design. The SRI pin and the page's own escaping carry the weight.

## Accepted risks and follow-ups (not blockers, decide consciously)

| # | Risk | Note |
|---|---|---|
| R1 | **Live presence uses public Realtime channels.** Anyone with the public key can join any park's channel, show a made-up visitor (or 👑), move another visitor's pin by sending their id, and send the six reactions. One attacker can also use up the project's Realtime connection and message quota. | The page caps the damage (40 pins, positions clamped, only the six emoji, 1 a second each, the crown is decoration). A real fix is a game change: private channels with policies on `realtime.messages`, then Realtime "Allow public access" off. **For Duet.** |
| R2 | **Per-connection limits are shared behind one address** (schools, mobile carrier NAT): 6 new parks an hour, 20 a day, 10 guest parks per connection, 1800 leaderboard requests an hour. | A product decision. Also: holders of a /48 (cloud servers) or a botnet can still spread out, and the whole-cloud guard (60 new parks a minute) can then be used to make publishing say "busy" for everyone. |
| R3 | **Published park data is any JSON up to 400 kB** with an `objs` list. | The page rebuilds every field it uses (t20 C, t27). The cloud can still be used to host arbitrary JSON. |
| R4 | **The VIP Edge Functions are live in production but unused by 10.10.1.** `vip-status` has no rate limit, open CORS, and returns the restore code to anyone who sends a matching `player_id`. Their source exists only on `feature/vip-pack-8.7`. | `vip-webhook` verifies Stripe's signature (HMAC, 5-minute tolerance, constant-time compare). Until VIP ships: undeploy them, or add a limit. Changing production needs owner approval. |
| R5 | The page's own `cleanName` keeps right-to-left overrides (t27 INFO). | The database now removes them before they are stored. A one-line client fix is optional. **For Duet.** |
| R6 | Name rules are now stricter: emoji joined with ZWJ split into separate emoji, variation selectors are removed, and anything containing "coasterlab" is reserved. | **For Duet** (visible to players). |
| R7 | Two older behaviour checks still differ on 10.10.x (`t20` section I, `t21_saves`). | Unchanged from the 2026-11-27 report, waiting on the game team. |
| R8 | `cl_username_free`, `cl_my_parks` and `cl_unpublish_park` have no rate limit. | Each is one index lookup. `cl_username_free` lets anyone check whether a player name is registered (names are not secret: they are shown as park authors). |
| R9 | The sign-in session is kept in the page's `localStorage`, like the Supabase JS library does. | Any script injection would expose it. That is why the escaping and CSP checks (t20 A–C, t26) are release checks. |
| R10 | Players cannot delete their own account; the owner does it in the dashboard (runbook step 4). | Fine for a soft launch; a privacy question for a public one. |

Outside this review: children's privacy rules (COPPA / GDPR-K) for a game that collects email addresses, load testing,
and the Supabase platform itself (Auth, PostgREST's JWT check, Realtime). These need their own sign-off.

## Moderation runbook (Supabase dashboard → SQL Editor; tested as M1–M3)

```sql
-- look a reported park up
select code, name, author, user_id, created_at, visits from public.cl_parks where code = 'ABC234';
-- 1. take it down (its ratings and visit counts go with it)
delete from public.cl_parks where code = 'ABC234';
-- 2. give an abusive player a neutral name, on the profile and on every park they published
update public.profiles set username = 'rider_' || substr(md5(random()::text), 1, 10) where id = '<player uuid>';
update public.cl_parks p set author = pr.username from public.profiles pr where pr.id = p.user_id and p.user_id = '<player uuid>';
-- 3. remove every guest park published from the same connection as a reported one
delete from public.cl_parks where user_id is null and creator_hash = (select creator_hash from public.cl_parks where code = 'ABC234');
-- 4. stop an account: Authentication → Users → the player → Ban user (or Delete user: saves and profile go, parks stay ownerless,
--    so run "delete from public.cl_parks where user_id = '<player uuid>';" first)
```

## How to repeat everything

```bash
bash supabase/tests/run.sh payments                      # database: 176 passed, 0 failed
cd tests && npm ci && npm run test:release               # browser: t26, t20 A-H, t22, t27 against 10.10.1
python3 tools/ci/secret-scan.py                          # no secrets in tracked files
```
