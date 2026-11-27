# Testing

Three layers. Every one runs on GitHub Actions and on your own computer.

| Layer | What it checks | Command | When CI runs it |
|---|---|---|---|
| **CI fast checks** | HTML/JS syntax, secrets in files and history, lockfile integrity | see `.github/workflows/ci.yml` | every push and pull request |
| **Database** | row level security and permissions, on a throw-away local PostgreSQL. Nothing is sent to Supabase | `bash supabase/tests/run.sh payments` | every push and pull request (`database` job on PostgreSQL 16, `database (PostgreSQL 17)` job on the version production runs) |
| **Browser: release** | the current build `builds/coaster_lab_v10_10_1.html` in headless Chromium (`t26`, `t20` A–H, `t22`, `t27` hostile cloud answers) | `cd tests && npm run test:release` | every pull request into `main`, pushes to `main`, weekly |
| **Browser: full history** | every suite against the 10.1 source build | `cd tests && npm test` | weekly, or *Actions → Regression → Run workflow → target `full`* |

## Reproducible installs

`tests/package.json` pins exact versions (Playwright **1.63.0**, three.js **0.160.0**, jsdom **31.0.1**), and
`tests/package-lock.json` locks every package with an integrity hash. Always install with:

```bash
cd tests
npm ci                                      # exactly what the lockfile says, nothing newer
npx playwright install --with-deps chromium # the Chromium build that Playwright 1.63.0 expects (revision 1243)
```

`tests/.npmrc` sets `save-exact=true` (new dependencies are pinned) and `engine-strict=true` (Node 22 only).
Dependabot proposes updates once a month as pull requests into `develop`. A Playwright update also changes the
Chromium build, so let the release regression pass on that PR before merging it.

## The database tests

`supabase/tests/run.sh` builds a private PostgreSQL in a temporary folder, then runs these steps in order:

1. `00_supabase_shim.sql`: a stand-in for Supabase (roles `anon` / `authenticated` / `service_role`, `auth.uid()`).
2. `01_live_baseline.sql` + `02_live_2026-11-27.sql`: **production as it is on 2026-11-27**, written out from the live
   catalog and the live migration history, read-only.
3. `05_production_tests.sql`: attacks on that copy, as a signed-out visitor and as two players. Checks P1 to P7
   (privileges), R1 to R13 (rows) and O1 to O7 (owner, admin and VIP permissions). It runs in a transaction that is
   rolled back.
4. The repository migrations in `supabase/migrations/`, applied twice (they must be safe to re-run). They are
   **not applied to production**.
5. `10_tests.sql`: the checks for those migrations.
6. `20_attacks.sql`: the 10.10.1 release attacks on the same database (X server-side authorization and owner
   permissions, N impersonation and Unicode look-alikes, L rate-limit bypass with forged headers and IPv6 rotation,
   D direct table writes, V input validation, F network fingerprints, M the owner's moderation runbook).
   Before `20261127000000_…_release_hardening.sql`, 19 of its 33 attacks got through; with it, none do.

`supabase/branch-checks/verify_headers.sql` is **not** run here: it is the one check that needs the real Supabase API
gateway (run it on a Supabase branch, never production; the steps are at the top of the file).

When production changes (a migration is applied in the Supabase dashboard), add it to the snapshot in `02_…` (or a
new `03_…`) so these tests keep describing the real database.

## Adding a build to the release check

1. Archive the build in `builds/` (see `builds/README.md`).
2. Point `tests/run_release.js` (`BUILD`) and the `sha256sum -c` line in `.github/workflows/regression.yml` at it.
3. Run `t26_v10_10_1.js` with `CL_F=<build> CL_VERSION=<x.y.z>`. Then run each older suite with `CL_F`, and keep in
   `run_release.js` only the suites that pass in full.
4. Rename the required check in `.github/rulesets/main.json` if the job name changes, and run
   `tools/repo/apply-branch-protection.sh --yes` again.
