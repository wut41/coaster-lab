# Repository map

Audit date: **2026-11-27**. This page records what every branch holds, where every version lives, and what is still
waiting for a decision. Nothing listed here has been deleted, renamed, force-pushed or rewritten.

## Before and after

| | Before (2026-11-27 morning) | After this reorganization |
|---|---|---|
| Default branch | `claude/festive-newton-8ueu8m` (8.6, Nov 9) | `main` **(switch pending owner approval)** |
| `main` / `develop` | did not exist | both created at `3e0b79a` (10.1 + merged branches, 875 tests passing per the 10.1 report) |
| Branches | 20, all `claude/<random-name>` | 22 (20 kept untouched + `main` + `develop`) and short-lived PR branches |
| Newest version in git | 10.1 | 10.1 in source form; 10.2 → 10.10.0 as builds in `builds/` (build-import PR) |
| Tags / releases | none / none | archive tags prepared (see below); no release published |
| GitHub Actions runs | none | CI workflow (syntax + secret scan) and a regression workflow added |
| Changelog | 6 separate `CHANGES-*.md` files | one `CHANGELOG.md` + originals in `docs/changes/` |
| Docs at top level | 10 Markdown files | `README`, `CHANGELOG`, `CONTRIBUTING`, `SECURITY`; the rest in `docs/` |
| Unrelated projects | mixed into game branches | listed below with a move plan |

`main` contains the old default branch in full (it is a straight-line descendant), so no history was lost by
creating it.

## Branch inventory

"Ahead" = commits on the branch that are **not** in `main`. Zero means everything on it is already in `main`.

### Fully merged into `main` (safe to remove later, after owner approval)

| Branch | Tip | Date | Held | Proposed archive tag |
|---|---|---|---|---|
| `claude/festive-newton-8ueu8m` | `c5cd625` | 11-09 | 8.5 baseline + 8.6 (old default branch) | `archive/claude/festive-newton-8ueu8m` |
| `claude/coaster-lab-v9-upgrade-x510cl` | `fccf29b` | 11-11 | 9.0 / 9.0.1 | `archive/claude/coaster-lab-v9-upgrade-x510cl` |
| `claude/coaster-lab-logo-art` | `d23a338` | 11-13 | neon logo, photo clouds, sunset sky (PR #2) | `archive/claude/coaster-lab-logo-art` |
| `claude/coaster-lab-graphics-extras` | `cc2b37b` | 11-13 | glow, sun, metal, speed effects (PR #3) | `archive/claude/coaster-lab-graphics-extras` |
| `claude/coaster-sounds` | `e80c4d2` | 11-13 | sound upgrade (PR #4) | `archive/claude/coaster-sounds` |
| `claude/coaster-lab-park-upgrade` | `e76674d` | 11-13 | Track Builder 6 groundwork | `archive/claude/coaster-lab-park-upgrade` |
| `claude/coaster-sharp-graphics` | `ab303c1` | 11-13 | sharper graphics (PR #5) | `archive/claude/coaster-sharp-graphics` |
| `claude/coaster-lab-park-build-2` | `394fce1` | 11-14 | My Park building round two | `archive/claude/coaster-lab-park-build-2` |
| `claude/coaster-lab-trailer` | `67722aa` | 11-14 | first-visit trailer | `archive/claude/coaster-lab-trailer` |
| `claude/coaster-lab-daily-streak` | `c9deae7` | 11-14 | daily streak (PR #6) | `archive/claude/coaster-lab-daily-streak` |
| `claude/coaster-lab-engineering-upgrade-mbxjoc` | `3e0b79a` | 11-17 | **10.1** — identical to `main` and `develop` now | `archive/claude/coaster-lab-engineering-upgrade-mbxjoc` |

### Not merged — unique work, must be preserved

| Branch | Tip | Date | Ahead | What only this branch has | Recommendation | Proposed name |
|---|---|---|---|---|---|---|
| `claude/ride-challenges-10b` | `e23c28d` | 11-16 | 3 | **Ride challenges** (12 bronze/silver/gold feats, XP, badges, titles, Champion skin), rebased on 10.0 + PR #6 | Port onto 10.10.0 as a feature (not in any build yet) | `feature/ride-challenges` |
| `claude/ride-challenges-10` | `2ce0faa` | 11-13 | 1 | Earlier version of the same feature on plain 10.0 | Keep as history of the above | `archive/…` only |
| `claude/upbeat-meitner-pw7oe6` | `fd8f792` | 11-20 | 3 | **8.7 VIP pack** ($2, golden coasters), Supabase `vip-status`/`vip-webhook` functions, **Remotion trailer project** (`trailer/`) | Decide: port VIP to 10.x (needs the P0 payment/entitlement checks first) or retire. Trailer project could live in its own repo | `feature/vip-pack-8.7` |
| `claude/great-fermat-rrwnat` | `22ea58d` | 11-25 | 14 | **Review squad**: `.claude/agents/*` (developer, debugger, designer, security, tester), `reports/` (debug, design, security, tester), `t6_robust` corrupted-save tests | Merge the agents + reports into `develop` (docs/tooling only); several findings already shipped in 10.6 | `chore/review-squad` |
| `claude/quirky-thompson-7h0bzz` | `70df0c2` | 11-17 | 3 | **YouTube branding**: `branding/` logo + banner SVG/PNG and export script | Merge into `develop` under `branding/` (assets only) | `docs/branding` |
| `claude/beautiful-pasteur-82f2g4` | `11bf2a3` | 11-15 | 1 | The PR #6 merge commit. Its content reached `main` through the individual branch merges in 10.1. Open **PR #1** targets the old default branch | Close PR #1 as superseded after review; keep the tag | `archive/…` only |
| `claude/trailer-footage` | `1fdaf82` | 11-14 | 1 | Nothing: an empty root commit "emptied (safe to delete)" | Delete after approval (tag keeps it) | — |

### Unrelated projects

These are not Coaster Lab. Each is preserved on its branch; the plan is to give each its own repository.

| Branch | Project | Files | Proposed home |
|---|---|---|---|
| `claude/cerealsquad1-analytics-dashboard-5p6asu` | **@cerealsquad1 YouTube analytics dashboard** (data snapshot, 1M-subscriber goal meter) | `cerealsquad1-dashboard.html` | new repo `wut41/cerealsquad1-dashboard` (or `project/cerealsquad1-dashboard` until then) |
| `claude/serene-tesla-7zg09k` | **Neon Arcade** (Neon Breakout, Duel, Serpent, Swarm) + bot playthrough test | `arcade/` | new repo `wut41/neon-arcade` (or `project/neon-arcade`) |
| *(upload, not in git)* | **Mini roller coaster 3D-print files** (OpenSCAD, Bambu Studio guide) | `mini_roller_coaster.scad` | new repo `wut41/coaster-print` or keep offline |

Both project branches also carry a copy of the 8.6 game and its tests (they were started from the old default
branch). When moved, only the project's own files need to go.

**Moving a project without losing history** (needs owner approval; creates a new repo, touches nothing here):

```bash
git clone --branch claude/serene-tesla-7zg09k https://github.com/wut41/coaster-lab neon-arcade
cd neon-arcade && git remote set-url origin https://github.com/wut41/neon-arcade && git push -u origin HEAD:main
```

## Archive tags

Preserving every branch tip as a tag means any branch can later be renamed or removed without losing a commit.
The 20 annotated tags `archive/<branch-name>` were created, but **this session's git proxy refused tag pushes
(HTTP 403)**, so they are not on GitHub yet. The owner can create them with one command from any clone:

```bash
git fetch origin
for r in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/claude); do
  git tag -a "archive/${r#origin/}" "$r" -m "Snapshot of ${r#origin/} before the 2026-11-27 reorganization"
done
git push origin 'refs/tags/archive/*'
```

Until then, the branches themselves are the preservation, and the tip SHAs above are the record.

## Where every version lives

| Version | Location | Source form? |
|---|---|---|
| 4.1, Owner's Edition, VELOCITY 1.1 | `builds/legacy/` | single file only |
| 8.5, 8.6 | top level | single file (8.6 built in place) |
| 8.7 (VIP) | branch `claude/upbeat-meitner-pw7oe6` | single file, unmerged |
| 9.0 / 9.0.1 | top level `coaster_lab_v9_0.html` | single file (base of `build.mjs`) |
| 10.0, 10.1 | top level | **yes**: `src/v10/` + `build.mjs` |
| 10.2 → 10.10.0 | `builds/` | **no**: finished builds only (see open questions) |

## Open questions for the owner and Duet

1. **Which 10.10.0 file is the merged one?** Two uploads carry `version:'10.10.0'`. They differ only in the
   holiday-hat code (`_2` skips arm pivots). The import PR treats `_2` as canonical and keeps the other as
   `coaster_lab_v10_10_0-pre.html`. Please confirm.
2. **Where are the 10.2+ sources?** `src/v10/` stops at 10.1, so `build.mjs` cannot rebuild 10.10.0. Either the
   10.10.0 HTML becomes the new source of truth (recommended until a new source split exists), or Duet supplies
   the sources that produced it.
3. **Which version is on the live site?** coaster-playground.foundable.app is published through Foundable, not from
   this repository. Knowing its version lets `main` match production exactly.
4. **Default branch switch to `main`** — approve? (Nothing deploys from this repo, so the switch should not affect the
   live site, but anyone who clones it will get `main` instead of 8.6.)
