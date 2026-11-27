## What and why

<!-- Plain language: what changes for players or developers, and why. -->

**Version:** <!-- e.g. 10.11.0, or "none (docs/CI only)" -->
**Type:** feature / fix / hotfix / docs / chore / test / release
**Made by:** <!-- owner, or the AI/tool and session, e.g. "Claude Code session …" -->

## Testing

- [ ] CI green (syntax + secrets)
- [ ] Regression suites run — results:
- [ ] Tested on iPhone Safari — what exactly:
- **Only code-read (not run):**

## Risk and rollback

<!-- What could break? How do we undo it? Does it change saves, the database, or anything live? -->

## Checklist

- [ ] One purpose only; branch name follows `CONTRIBUTING.md`
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] New build files added to `builds/README.md` with SHA-256
- [ ] No secrets (ran `python3 tools/ci/secret-scan.py`)
- [ ] No force-push, no deleted branches, no history rewrite
