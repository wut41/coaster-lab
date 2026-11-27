# Repository map

Last updated **2026-11-27**. Where every branch, version and project lives, and what is still waiting for the owner.
No history was rewritten and no unmerged work was deleted during the reorganization.

## At a glance

| | Before (2026-11-27 morning) | After |
|---|---|---|
| Default branch | `claude/festive-newton-8ueu8m` (8.6) | `main` — **one click by the owner** (see [Owner checklist](#owner-checklist)) |
| `main` / `develop` | did not exist | `main` = released line · `develop` = integration |
| Branch names | 20 × `claude/<random-words>` | `main`, `develop`, `feature/*`, `chore/*`, `docs/*`, `project/*` (see below) |
| Newest version in git | 10.1 | 10.1 in source form; every build from prototype 01 to 10.10.1 archived by PR #8 |
| Docs at top level | 10 loose Markdown files | `README` · `CHANGELOG` · `CONTRIBUTING` · `SECURITY`; everything else in `docs/` |
| Automation | no GitHub Actions runs | CI (syntax, secrets, database, lockfile) on every push and PR; 10.10.1 regression on every PR into `main` |
| Security | never scanned | full-history scan: no secrets ([report](security/SECRET-SCAN-2026-11-27.md)) |

## Branch map

### Permanent

| Branch | Holds |
|---|---|
| `main` | Released / ready-to-release game. Contains the full history of the old default branch. |
| `develop` | Integration branch. Every change lands here first through a pull request. |
| `backup/2026-11-27` | 🛡️ **Backup, never work here.** One snapshot commit whose parents are all 31 branch tips of 2026-11-27, so every commit stays in GitHub after old names are deleted. `BACKUP.md` lists each branch and SHA for restoring. |

### Active work (renamed from `claude/*` on 2026-11-27, same commits)

| Branch | Was | What it holds | Next step |
|---|---|---|---|
| `feature/ride-challenges` | `claude/ride-challenges-10b` | 12 bronze/silver/gold ride feats, XP, badges, titles, Champion skin (on 10.0 + PR #6) | Port onto 10.10.1 — in no build yet |
| `feature/ride-challenges-first-draft` | `claude/ride-challenges-10` | First version of the same feature on plain 10.0 | Keep as history |
| `feature/vip-pack-8.7` | `claude/upbeat-meitner-pw7oe6` | 8.7 VIP pack ($2, golden coasters), Supabase VIP functions, Remotion trailer project | Decide: port to 10.x after the P0 payment checks, or retire |
| `chore/review-squad` | `claude/great-fermat-rrwnat` | Five review agents (`.claude/agents/`), debug / design / security / tester reports, corrupted-save tests | Merge into `develop` (tooling + docs only) |
| `docs/branding` | `claude/quirky-thompson-7h0bzz` | YouTube logo + banner (SVG/PNG) and export script | Merge into `develop` under `branding/` |

### Unrelated projects (waiting for their own repositories)

| Branch | Was | Project | Proposed repository |
|---|---|---|---|
| `project/cerealsquad1-dashboard` | `claude/cerealsquad1-analytics-dashboard-5p6asu` | @cerealsquad1 YouTube analytics dashboard | `wut41/cerealsquad1-dashboard` |
| `project/neon-arcade` | `claude/serene-tesla-7zg09k` | Neon Arcade (Breakout, Duel, Serpent, Swarm) | `wut41/neon-arcade` |
| *(not in git)* | — | Mini roller coaster 3D-print files (OpenSCAD) | own repo, or keep offline |

Moving a project keeps its history and changes nothing here:

```bash
git clone --branch project/neon-arcade https://github.com/wut41/coaster-lab neon-arcade
cd neon-arcade && git remote set-url origin https://github.com/wut41/neon-arcade && git push -u origin HEAD:main
```

### Open pull requests

| PR | Branch | Status |
|---|---|---|
| #8 | `chore/import-builds-10.2-to-10.10.0` | Every build from prototype 01 to 10.10.1. **Waiting for Duet** to confirm the canonical 10.10.0 file |
| #1 | `claude/beautiful-pasteur-82f2g4` | Old 9.0 PR into the old default branch. Its content reached `main` through later merges. Kept open by owner's choice |

### Old names still to remove (owner action)

This session's git proxy does not allow branch deletion, so these old names still show on GitHub. Every one of them is
either fully inside `main` or copied to its new name above — removing them loses nothing.
`tools/repo/cleanup-old-branches.sh` re-checks each one and deletes it only if that is still true.

| Old branch | Why it is safe to remove |
|---|---|
| `claude/festive-newton-8ueu8m` | Fully inside `main` (remove **after** the default switches to `main`) |
| `claude/coaster-lab-v9-upgrade-x510cl`, `claude/coaster-lab-logo-art`, `claude/coaster-lab-graphics-extras`, `claude/coaster-sounds`, `claude/coaster-lab-park-upgrade`, `claude/coaster-sharp-graphics`, `claude/coaster-lab-park-build-2`, `claude/coaster-lab-trailer`, `claude/coaster-lab-daily-streak`, `claude/coaster-lab-engineering-upgrade-mbxjoc` | Fully inside `main` |
| `claude/trailer-footage` | Empty commit marked "safe to delete" |
| `claude/ride-challenges-10b`, `claude/ride-challenges-10`, `claude/upbeat-meitner-pw7oe6`, `claude/great-fermat-rrwnat`, `claude/quirky-thompson-7h0bzz`, `claude/cerealsquad1-analytics-dashboard-5p6asu`, `claude/serene-tesla-7zg09k` | Identical copies under the new names above |

## Where every version lives

| Version | Location | Source form? |
|---|---|---|
| prototype 01, 2, 4.0, 4.1, 5.1, 5.2, 6.0, 6.1, 6.2, 6.3, 7.0, 7.1, 8.4, Owner's Edition, VELOCITY 1.1 | `builds/legacy/` (PR #8) | single file only |
| 7.2 | inside `builds/website-2026-11-07/` (PR #8) | built site only |
| 8.5, 8.6 | top level | single file |
| 8.7 (VIP) | `feature/vip-pack-8.7` | single file, unmerged |
| 9.0.1 | top level `coaster_lab_v9_0.html` | single file (base of `build.mjs`) |
| 10.0, 10.1 | top level | **yes**: `src/v10/` + `build.mjs` |
| 10.2 → 10.10.0 | `builds/` (PR #8) | **no**: finished builds only |

No file exists yet for 3, 5.0, 8.0–8.3, 10.5, 10.6 and 10.9.2 (their code is inside later builds).

## Owner checklist

1. **Make `main` the default branch** — GitHub → *Settings* → *General* → *Default branch* → ⇄ → `main` → *Update*.
2. **Remove the old names** — from any clone: `bash tools/repo/cleanup-old-branches.sh` (dry run), then
   `bash tools/repo/cleanup-old-branches.sh --yes`.
3. **Push the archive tags** (optional extra safety) — add `--tags` to tag every old branch tip as `archive/<name>`
   before it is removed.
4. **Protect `main` and `develop`** — `bash tools/repo/apply-branch-protection.sh --yes` (details in [`RELEASES.md`](RELEASES.md#branch-protection)).
5. **Turn on secret scanning + push protection** and *Keep my email addresses private* ([security report](security/SECRET-SCAN-2026-11-27.md)).
6. **Ask Duet** the open questions below, then merge PR #8.

## Open questions for Duet

1. **Which 10.10.0 file is the merged one?** *New evidence: 10.10.1 contains the `_2` arm-pivot fix, so it was built on `_2`.* PR #8 treats `coaster_lab_v10_10_0_2` as canonical (it skips arm pivots
   when placing holiday hats) and keeps the other as `-pre`.
2. **Where are the 10.2+ sources?** `src/v10/` stops at 10.1, so `build.mjs` cannot rebuild 10.10.0.
3. **Which version is live** on coaster-playground.foundable.app?
4. **The 2026-11-07 website build** (login/signup/account pages around 7.2): where is its source, and was it deployed?
