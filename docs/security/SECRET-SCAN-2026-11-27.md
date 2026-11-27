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
| S2 | **Medium (design)** | 10.x builds check the owner passcode in the browser against a salted PBKDF2 hash (600k and 1.4M iterations) that ships inside the public HTML (`OWNER_KDF72`; the moderator lock `MOD_KDF83` works the same way, 600k iterations). Anyone can copy the hash and try passcodes offline; a short or common passcode would fall quickly. | Already listed as **P0** in the 10.9 developer report ("never trust browser roles"). Owner-only powers must be enforced by the server (Supabase RLS / functions). Until then use a long, random passcode and treat the owner panel as a convenience, not protection. *Game code was not changed by this audit.* |
| S3 | Info | Supabase migrations in `supabase/migrations/` are marked "not yet applied to production" in the 10.1 README. If they have since been applied by hand, the repo no longer reflects production. | Record which migrations are live in `docs/DEVELOPMENT.md`. |

## Triple-check (2026-11-27, after 10.10.1 arrived)

| Pass | Tool | Scope | Result |
|---|---|---|---|
| 1 | `tools/ci/secret-scan.py --history` + JWT role decode | 1,237 items: every blob in 107 commits, all branches | **0 problems** |
| 1b | same | all 71 uploads, including 10.10.1 | **0 problems** |
| 2 | `detect-secrets` 1.5.0, every plugin, `--all-files` | 700 unique text files from history + 10.10.1 | 1,049 raw hits, **all triaged as safe**: 2 JWTs (jwt.io sample; Supabase `anon`), secret-ride names, minified SDK code (`token:e`), CSP `sha384-` hashes, the publishable key, and the S2 passcode hashes |
| 3a | GitHub API | repository settings | Secret scanning **on**, push protection **on**. Dependabot alerts **off**, `main` **not protected** (see S6) |
| 3b | Supabase advisors + policies (read-only) | project `celqksoohozvqbdktapm` | RLS on all 3 tables; `profiles`/`coasters` limited to the row owner; `vip_purchases` has no client policies on purpose (service role only). `vip-webhook` verifies the Stripe signature (HMAC-SHA256, timing-safe compare, 5-minute window). See S4, S5 |
| 3c | pattern audit | `coaster_lab_v10_10_1.html` | No `eval`, `new Function`, `document.write`, string timers or `postMessage` listeners. No plain `http://`. A strict CSP allows only 5 origins (jsDelivr, Google Fonts, CloudFront media, Supabase). three.js pinned to `0.160.0`. User text going into `innerHTML` passes through an `esc()` helper. See S7 |

### New findings (report only, nothing in the game or database was changed)

| # | Severity | Finding | Recommendation |
|---|---|---|---|
| S4 | Low | Supabase Auth: leaked-password protection is off | Dashboard → Authentication → Password security → turn on *Leaked password protection* ([docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)) |
| S5 | Low | `vip-status` has no rate limit, so restore codes (31⁸ ≈ 850 billion combinations per email) can be guessed without slowdown. Anyone holding a `player_id` can also read that player's restore code | Acceptable for launch; later add a per-IP limit or a delay after failures |
| S6 | Medium (process) | `main` has no branch protection; Dependabot alerts are off | Owner: follow `docs/RELEASES.md` → branch protection; Settings → Code security → enable Dependabot alerts (the new `.github/dependabot.yml` then opens update PRs) |
| S7 | Low | three.js is loaded from jsDelivr without a Subresource Integrity hash, so a compromised CDN could serve different code | Future build: add an `integrity` entry to the import map, or self-host three.js. Game code not changed by this audit |

### CI hardening done in this pass
- Every GitHub Action is pinned to a full commit SHA (`checkout` v4.4.0, `setup-node` v4.4.0, `upload-artifact` v4.6.2).
- `.github/dependabot.yml` added: monthly update PRs for actions and test tooling, aimed at `develop`.

## How to re-run

```bash
python3 tools/ci/secret-scan.py --history      # all history
python3 tools/ci/secret-scan.py builds/*.html   # builds before committing
```
