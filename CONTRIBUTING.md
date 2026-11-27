# Contributing to Coaster Lab

This guide is for everyone who changes the repository: the owner, human helpers, and every AI collaborator.
AIs do not share memory between sessions, so the rules below are what keeps work from being lost or overwritten.

## The five rules

1. **Never push straight to `main` or `develop`.** Work on a branch, open a pull request.
2. **Never force-push, rewrite history, or delete a branch that has unmerged work.** If a branch looks finished,
   say so in the pull request or in `docs/REPOSITORY.md`; the owner decides.
3. **One branch = one purpose.** Don't mix a feature, a bug fix and a cleanup in one branch.
4. **Wrap, don't rewrite.** Keep working features working. Extend an existing function instead of replacing it.
5. **Be honest about testing.** Every pull request says what was *run* and what was only *read*.

## Branch structure

```
main      ← released / ready to release. Protected. Merges only from develop, release/*, hotfix/*.
  ▲
develop   ← integration. Every feature and fix lands here first.
  ▲
feature/* fix/* docs/* chore/* test/* release/* hotfix/*   ← short-lived work branches
```

## Branch names

Format: **`<type>/<short-description>`**, lowercase, words joined with `-`, no spaces. Add the version when it helps.

| Type | Use it for | Branches from → merges into | Example |
|---|---|---|---|
| `feature/` | New gameplay or UI | `develop` → `develop` | `feature/ride-challenges`, `feature/holiday-quest` |
| `fix/` | A bug fix | `develop` → `develop` | `fix/recorder-track-cleanup` |
| `hotfix/` | Urgent fix to what is live | `main` → `main` **and** `develop` | `hotfix/10.10.1-save-loss` |
| `release/` | Freezing a version for final QA | `develop` → `main` | `release/10.11.0` |
| `docs/` | Documentation only | `develop` → `develop` | `docs/supabase-setup` |
| `chore/` | Repository, tooling, CI | `develop` → `develop` | `chore/repo-organization` |
| `test/` | Tests only | `develop` → `develop` | `test/save-recovery-fuzz` |
| `experiment/` | Throw-away prototypes (may never merge) | anywhere | `experiment/webgpu-renderer` |
| `project/`, `backup/` (snapshots only, never commit to them) | Unrelated projects waiting to move to their own repo | — | `project/neon-arcade` |

**AI session branches.** Tools such as Claude Code create names like `claude/festive-newton-8ueu8m`. That is fine for
a session, but before opening a pull request, rename the branch to the format above (or create a well-named branch
from it), and put the tool name in the pull request description instead.

## Commits

* Present tense, say what changed for the player or the developer: `Track Builder: undo restores the last piece`.
* Prefix with the area when it helps: `My Park:`, `Builder:`, `Cloud:`, `Tests:`, `Docs:`, `CI:`.
* Keep each commit about one thing. Never commit secrets (see [`SECURITY.md`](SECURITY.md)).

## Pull requests

Use the template (it opens automatically). Every pull request needs:

* **What and why** in plain language.
* **Version** it targets and a **CHANGELOG.md** entry under `[Unreleased]`.
* **Testing**: what was run (with results) and what was only code-read. Device tests (iPhone) are listed separately.
* **Risk**: what could break, and how to roll back.
* Green CI (syntax check + secret scan). Regression suites for anything that touches gameplay.
* One review: the owner, or an independent QA collaborator, before merge into `main`.

## Builds

* A finished single-file build goes in `builds/` as `coaster_lab_v<MAJOR>_<MINOR>_<PATCH>.html`
  (e.g. `coaster_lab_v10_10_0.html`) and gets a row in `builds/README.md` with its SHA-256.
* Files at the top level (`coaster_lab_v8_5.html` … `coaster_lab_v10_1.html`) are inputs to `build.mjs` and the tests.
  Do not edit, move or rename them.
* Never commit the same build twice under different names; check the SHA-256 table first.

## Versions

`MAJOR.MINOR.PATCH` — MINOR for new features, PATCH for fixes only. A version is not "released" until it is tagged
`vX.Y.Z` on `main`; see [`docs/RELEASES.md`](docs/RELEASES.md).
