# Security hardening and verification — 2026-11-27

Follows the independent, read-only assessment by ChatGPT and the [secret scan](SECRET-SCAN-2026-11-27.md).
**No game code changed. Nothing in production was written:** Supabase was read only (catalog queries, migration
history, advisors, function source), and every attack ran against a throw-away local copy.

## What was done

| Item | Status | Where |
|---|---|---|
| CI actions pinned to commit SHAs, Dependabot config | ✅ in `main` (PR #10 → #12, merged as `9c952da`) | `.github/workflows/`, `.github/dependabot.yml` |
| Dependency lockfile | ✅ `tests/package-lock.json` committed (it was git-ignored before), 31 packages, each with an integrity hash | `tests/` |
| Reproducible installs | ✅ exact pins (Playwright 1.63.0, three.js 0.160.0, jsdom 31.0.1); `npm ci` in CI; `.npmrc` `save-exact` + `engine-strict` (Node 22); `lockfile` CI job | [`TESTING.md`](../TESTING.md) |
| Regression aimed at 10.10.1 | ✅ `regression 10.10.1` job on every PR into `main`, push to `main`, weekly; checks the build's SHA-256 first | `tests/run_release.js`, `tests/t26_v10_10_1.js` |
| Database security tests | ✅ `database` CI job: production snapshot (27 checks) + repository migrations (64) + proposed payments design (48) = **139 passed, 0 failed** | `supabase/tests/` |
| Branch protection | 🟡 **prepared, not applied:** a Claude session cannot change repository settings | `.github/rulesets/`, `tools/repo/apply-branch-protection.sh` |

## Verified results

### Browser: 10.10.1 (headless Chromium 1243, the same build locally and on GitHub)

Verified twice: in the Claude workspace, and by the `regression 10.10.1` job on GitHub for PR #12 (**79 passed, 0 failed**, after the build's SHA-256 check).

| Suite | Result on 10.10.1 |
|---|---|
| `t26_v10_10_1` (new) | **22 / 22.** Version 10.10.1; clean start at 320×568, 390×844, 1280×800; CSP with `default-src`, `object-src`, `frame-src`, `base-uri`, `script-src-attr` all `'none'`, no `unsafe-eval`, only 5 known hosts; requests at start-up go only to allowed hosts; owner lock PBKDF2 600k + 1.4M rounds, moderator 600k; no passcode in the page; 8 ride switches leave 3D memory flat (145→146 geometries); offline start is quiet |
| `t20_security` sections A–H | **24 / 24:** XSS from other players' parks, names and codes; injected handlers; hostile park data; zip bombs; live channel; owner lock and test flag |
| `t22_diag` | **33 / 33:** diagnostics exist only behind the owner lock |

### Database: production as it is on 2026-11-27, attacked as a visitor and as two players

All 27 checks pass. Highlights:

* RLS is on for every table. Signed-out callers hold **no** privilege on any table and no policy lets them in.
* Players see only their own profile and coasters. They cannot rename others, change ids, plant or hand over coasters,
  or change, delete or `TRUNCATE` another player's data. The victim's row is untouched after every attack.
* **VIP:** players can neither read purchases (emails, restore codes) nor grant themselves VIP. Only the service role
  (the `vip-webhook` / `vip-status` server functions) can read them. `vip-webhook` verifies Stripe's HMAC signature.

### Server-side owner permissions: verified **there are none**

O1–O7: no table holds a role, admin or owner flag. No policy trusts JWT or sign-up metadata (only `auth.uid()`). A
forged `"role":"admin"` at sign-up grants nothing. The database has no owner or admin function. **So the in-game
owner and moderator tools cannot touch any other player's data or any server state.** The owner lock itself is checked
only in the browser. That is safe today *only because* the server gives it no power. Any future owner feature that
changes shared data **must** be enforced in the database (a policy or a `security definer` function that checks a
server-side role), never by the browser lock.

## Findings that need a decision

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| H1 | **High (launch)** | **Production does not have the repository's 10.0 / 10.1 migrations.** The live history is `account_system_init`, `lock_down_rls_auto_enable`, `updated_at_trigger_and_policy_tuning`, `create_vip_purchases`, `coaster_lab_least_privilege_table_grants`. 10.10.1 calls 11 database functions (`cl_save_put`, `cl_publish_park`, `cl_me`, …) that **do not exist live**, so cloud saves, accounts and park sharing cannot work in production. | Before the Dec 1 soft launch: apply both migrations after owner approval. They pass all 64 checks and are safe to run twice. Try them first on a Supabase **branch** (an isolated copy; costs money, so it needs the owner's OK), then on production. |
| H2 | Medium | The two live migrations `create_vip_purchases` and `…least_privilege_table_grants` are not in `supabase/migrations/` (they live only on `feature/vip-pack-8.7`, or were applied by hand). | Copied word for word into `supabase/tests/02_live_2026-11-27.sql` so the tests match production. Add them to `supabase/migrations/` when the VIP branch is merged. |
| H3 | Low | Production sign-up accepts any username from metadata, e.g. **"Admin"**. Reserved names are refused only by the unapplied 10.1 migration. | Fixed by H1. |
| H4 | Low | `authenticated` still holds `SELECT` on `vip_purchases`. RLS returns nothing (O4 proves it). | Defence in depth: `revoke select on public.vip_purchases from authenticated;` (owner approval). |
| H5 | Medium | `main` is not protected yet. | Owner: `bash tools/repo/apply-branch-protection.sh --yes`. |

## Behaviour differences for the game team (not changed: gameplay is out of scope)

Two older checks fail on 10.10.1, and both **fail the same way on 10.10.0**. They follow the 10.9.2 / 10.10 account
and save rework and were not introduced by 10.10.1. They stay out of the required release check until the game team
decides whether the new behaviour is intended (then the test is updated) or a bug (then the game is fixed).

| Suite | Check | What 10.10.x does |
|---|---|---|
| `t20_security` I | "Yes, keep me signed in" carries on: the park is saved to the account | after the magic-link question is answered "yes", no save reaches the account within 8 s |
| `t21_saves` | "Carry on here with the newer park" makes that tab the one that saves | the tab stays marked "Open in another tab · not saving here" |

## Coordination with Duet

Duet is asked to verify independently in [issue #13](https://github.com/wut41/coaster-lab/issues/13). The
four things to check are listed there: the 27 production checks, the owner-permission conclusion, H1 on a Supabase
branch, and the two behaviour differences.

## Limitations

* **Branch protection and Dependabot alerts are not on.** Settings writes are blocked for this session; the owner applies them.
* **No Supabase branch was created.** It costs money and changes the project, so it needs approval. The isolated test
  environment is a local PostgreSQL 16 with a Supabase stand-in (roles, `auth.uid()`, default grants). It is faithful
  for privileges, RLS and functions, but not for Supabase Auth, PostgREST or the Edge Functions (the Edge Functions were
  reviewed as source code).
* The `vip-status` rate limit (S5) and three.js SRI (S7) from the secret-scan report remain open.
* The full 10.1 history suite (`npm test`) was not rerun; it runs weekly or on demand.
