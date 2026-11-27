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

## Branch protection (recommended settings)

Set in GitHub → *Settings* → *Branches* → *Add branch ruleset*. Not applied yet: needs the owner.

### `main`
* Require a pull request before merging, **1 approval**; dismiss stale approvals when new commits are pushed.
* Require status checks to pass: **`CI / syntax`**, **`CI / secrets`**.
* Require conversation resolution before merging.
* Block force pushes. Block deletions.
* Require linear history: **off** (merge commits keep each branch's history visible).
* Restrict who can push: owner only. Allow the owner to bypass in an emergency.

### `develop`
* Require a pull request before merging (approval optional while the team is small).
* Require status checks: **`CI / syntax`**, **`CI / secrets`**.
* Block force pushes. Block deletions.

### Everything else
* `archive/*` tags: block deletion and updates (tag ruleset).

### Repository settings
* **Default branch → `main`.**
* *Automatically delete head branches*: **off** for now (turn on once the old `claude/*` branches are sorted out).
* Enable **secret scanning** and **push protection** (Settings → Code security; free for public repositories).
* Enable **Dependabot alerts** for `tests/package.json` and `trailer/package.json`.
