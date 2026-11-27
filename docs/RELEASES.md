# Releases and branch protection

## Versioning

`MAJOR.MINOR.PATCH` (e.g. `10.10.0`).

* **MINOR** (`10.11.0`): new features. **PATCH** (`10.10.1`): fixes only, nothing new for players to learn.
* **MAJOR** (`11.0.0`): saves or the data format change in a way older builds cannot open, or a full redesign.
* The version string inside the build (`__coasterDebug.version`) must match the file name and the tag.

## Tags

| Tag | Meaning | Who creates it |
|---|---|---|
| `vX.Y.Z` | A released version, on a commit in `main` | the owner (or with the owner's approval) |
| `vX.Y.Z-rc.N` | A release candidate under final QA, on `release/X.Y.Z` | release manager |
| `archive/<branch>` | Snapshot of a branch tip before it was renamed or removed | repository maintainer |

Recommended first tags once the build-import PR is merged (all on `main`):
`v8.5.0`, `v8.6.0`, `v9.0.1`, `v10.0.0`, `v10.1.0` on the commits that added those files, and `v10.10.0` on the merge of
the build import. Intermediate versions (10.2 → 10.9.2) exist only as files in `builds/` and do not need tags.

**Nothing is tagged or published as a GitHub Release yet.** That is waiting for owner approval.

## Release checklist

1. `release/X.Y.Z` branched from `develop`; version string, `CHANGELOG.md` and `builds/README.md` updated.
2. CI green: syntax check of the build, secret scan of the build.
3. Regression suites run (`tests/`, *Regression* workflow) — results pasted into the pull request.
4. **Device check on iPhone Safari** (first ride, camera switch, builder, My Park save/reload) — written up honestly:
   what was tested on a device and what was not.
5. Release blockers from the latest QA report closed or safely switched off
   (for 10.x see the P0/P1 list in [`reports/REPORT-10.9-developer.md`](reports/REPORT-10.9-developer.md)).
6. Pull request `release/X.Y.Z → main`, reviewed by the owner. Merge (no squash, keeps history).
7. Owner tags `vX.Y.Z` on `main` and, if wanted, publishes a GitHub Release with the build file attached.
8. Merge `main` back into `develop`.
9. **Production deployment (Foundable) is a separate, owner-approved step.** Nothing in this repository deploys.

## Branch protection

**Prepared as code, applied by the owner.** The rules live in [`.github/rulesets/`](../.github/rulesets/) and are
applied with one command (a Claude session cannot change repository settings):

```bash
bash tools/repo/apply-branch-protection.sh          # dry run: lists what it would create or update
bash tools/repo/apply-branch-protection.sh --yes    # applies the rulesets and turns on Dependabot alerts
```

| Ruleset | Branches / tags | Rules |
|---|---|---|
| `main.json` | `main` | Pull request required, merge commits only, conversations resolved, no force-push, no deletion. Required checks: `syntax`, `secrets`, `database`, `lockfile`, **`regression 10.10.1`** (branch must be up to date) |
| `develop.json` | `develop` | Pull request required, merge commits only, no force-push, no deletion. Required checks: `syntax`, `secrets`, `database`, `lockfile` |
| `backups.json` | `backup/**` | Never updated, moved or deleted |
| `release-tags.json` | tags `v*`, `archive/**` | Never moved or deleted |

**Approvals: 0.** The team has one human with admin rights, so a required approval would block every merge. The
required checks do the gatekeeping. When a second reviewer joins, set `required_approving_review_count` to 1 in
`main.json` and run the script again. **No bypass list:** nobody, the owner included, can push straight to `main`.
In an emergency, set the ruleset to *Disabled* in Settings → Rules, then turn it back on.

### Repository settings
* **Default branch → `main`.**
* *Automatically delete head branches*: **off** for now (turn on once the old `claude/*` branches are sorted out).
* Enable **secret scanning** and **push protection** (Settings → Code security; free for public repositories).
* **Dependabot alerts**: turned on by the script above. `.github/dependabot.yml` opens monthly update PRs for the pinned
  GitHub Actions and the locked test dependencies.
