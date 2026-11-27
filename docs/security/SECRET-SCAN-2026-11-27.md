# Secret and sensitive-data scan — 2026-11-27

**Scope:** every blob reachable from all 20 branches (797 unique blobs, full history, 95 commits) plus the 18 build
files uploaded for 10.2 → 10.10.0, the 4.x/Owner's Edition/VELOCITY files and the 10.9 developer report.
**Tool:** `tools/ci/secret-scan.py` plus a broader one-off pattern sweep (emails, generic `password=`/`secret=`
assignments, JWTs decoded for their role).

## Result: no secret credentials found ✅

| Checked for | Found |
|---|---|
| Supabase secret key (`sb_secret_…`) or `service_role` JWT | none |
| Stripe secret / restricted / webhook keys | none |
| Private keys, `.env` files, credential files | none |
| GitHub, AWS, OpenAI, Anthropic, Slack tokens | none |
| Database URLs with passwords | none (only `localhost` test URLs) |

## Public by design (no action)

| Item | Where | Why it is fine |
|---|---|---|
| Supabase publishable key `sb_publishable_hyXK…` | 10.0+ builds, `src/v10/js/28_ty_share.js` | Meant for browsers; power is set by RLS |
| Supabase anon JWT (role `anon`) for project `celqksoohozvqbdktapm` | 10.0+ builds | Same; legacy form of the publishable key |
| Project URL `https://celqksoohozvqbdktapm.supabase.co` | 8.7, 10.0+ builds | Public endpoint |
| JWT `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0…` | `tests/t22_diag.js` | The well-known jwt.io sample token, used as a test fixture |
| `@example.test` / `you@example.com` addresses | tests, SQL tests | Reserved test domains |
| `secret:'dragon'`, `secret:'rainbow'` | game builds | Names of secret rides, not credentials |

## Findings that need a decision

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| S1 | **Low (privacy)** | The owner's personal email address is in the author field of 4 commits made through GitHub's web interface. The repository is public, so it is visible in history. | Removing it would need a history rewrite — **not done** (not allowed without approval, and would break every clone). Instead: GitHub → Settings → Emails → turn on *Keep my email addresses private* and *Block command line pushes that expose my email*, so future commits use the `noreply` address. |
| S2 | **Medium (design)** | 10.x builds check the owner passcode in the browser against a salted PBKDF2 hash (600k and 1.4M iterations) that ships inside the public HTML. Anyone can copy the hash and try passcodes offline; a short or common passcode would fall quickly. | Already listed as **P0** in the 10.9 developer report ("never trust browser roles"). Owner-only powers must be enforced by the server (Supabase RLS / functions). Until then use a long, random passcode and treat the owner panel as a convenience, not protection. *Game code was not changed by this audit.* |
| S3 | Info | Supabase migrations in `supabase/migrations/` are marked "not yet applied to production" in the 10.1 README. If they have since been applied by hand, the repo no longer reflects production. | Record which migrations are live in `docs/DEVELOPMENT.md`. |

## How to re-run

```bash
python3 tools/ci/secret-scan.py --history      # all history
python3 tools/ci/secret-scan.py builds/*.html   # builds before committing
```
