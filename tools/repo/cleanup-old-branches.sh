#!/usr/bin/env bash
# Removes the old claude/* branch names left over from the 2026-11-27 reorganization — safely.
#
# Every branch is re-checked before it is touched:
#   * "merged"  branches are deleted only if their tip is still inside origin/main
#   * "renamed" branches are deleted only if their tip still equals the new branch's tip
#   * the empty trailer-footage branch only if it still has an empty tree
#   * the old default branch only if it is no longer the default
# Anything that fails its check is skipped and reported. Nothing is force-pushed.
#
#   bash tools/repo/cleanup-old-branches.sh            # dry run: shows what would happen
#   bash tools/repo/cleanup-old-branches.sh --yes      # delete
#   bash tools/repo/cleanup-old-branches.sh --yes --tags   # tag each tip as archive/<name> first, then delete
set -euo pipefail

YES=0; TAGS=0
for a in "$@"; do case "$a" in --yes) YES=1;; --tags) TAGS=1;; *) echo "unknown option $a"; exit 2;; esac; done

MERGED=(
  claude/festive-newton-8ueu8m
  claude/coaster-lab-v9-upgrade-x510cl
  claude/coaster-lab-logo-art
  claude/coaster-lab-graphics-extras
  claude/coaster-sounds
  claude/coaster-lab-park-upgrade
  claude/coaster-sharp-graphics
  claude/coaster-lab-park-build-2
  claude/coaster-lab-trailer
  claude/coaster-lab-daily-streak
  claude/coaster-lab-engineering-upgrade-mbxjoc
)
declare -A RENAMED=(
  [claude/ride-challenges-10b]=feature/ride-challenges
  [claude/ride-challenges-10]=feature/ride-challenges-first-draft
  [claude/upbeat-meitner-pw7oe6]=feature/vip-pack-8.7
  [claude/great-fermat-rrwnat]=chore/review-squad
  [claude/quirky-thompson-7h0bzz]=docs/branding
  [claude/cerealsquad1-analytics-dashboard-5p6asu]=project/cerealsquad1-dashboard
  [claude/serene-tesla-7zg09k]=project/neon-arcade
)
EMPTY=claude/trailer-footage

git fetch --prune origin >/dev/null
git remote set-head origin -a >/dev/null 2>&1 || true
DEFAULT=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
echo "default branch: ${DEFAULT:-unknown}"

ok=(); skip=()
exists() { git rev-parse -q --verify "refs/remotes/origin/$1" >/dev/null; }

for b in "${MERGED[@]}"; do
  exists "$b" || { echo "  gone      $b"; continue; }
  if [ "$b" = "$DEFAULT" ]; then skip+=("$b (still the default branch — switch the default to main first)"); continue; fi
  if git merge-base --is-ancestor "origin/$b" origin/main; then ok+=("$b"); else skip+=("$b (has commits not in main)"); fi
done
for b in "${!RENAMED[@]}"; do
  n=${RENAMED[$b]}
  exists "$b" || { echo "  gone      $b"; continue; }
  if exists "$n" && [ "$(git rev-parse "origin/$b")" = "$(git rev-parse "origin/$n")" ]; then ok+=("$b"); else skip+=("$b (differs from $n)"); fi
done
if exists "$EMPTY"; then
  if [ -z "$(git ls-tree "origin/$EMPTY")" ]; then ok+=("$EMPTY"); else skip+=("$EMPTY (not empty any more)"); fi
fi

for b in "${ok[@]}";   do echo "  delete    $b  ($(git rev-parse --short "origin/$b"))"; done
for b in "${skip[@]}"; do echo "  KEEP      $b"; done

if [ $YES -ne 1 ]; then echo; echo "Dry run. Re-run with --yes to delete ${#ok[@]} branch(es)."; exit 0; fi
[ ${#ok[@]} -gt 0 ] || { echo "Nothing to delete."; exit 0; }

if [ $TAGS -eq 1 ]; then
  for b in "${ok[@]}"; do
    git tag -f -a "archive/$b" "origin/$b" -m "Snapshot of $b before removal (2026-11-27 reorganization)" >/dev/null
  done
  git push origin $(printf 'refs/tags/archive/%s ' "${ok[@]}")
fi
git push origin --delete "${ok[@]}"
echo "Deleted ${#ok[@]} old branch name(s)."
