#!/usr/bin/env bash
# Applies the repository rulesets in .github/rulesets/ and turns on Dependabot alerts. For the repository OWNER
# (needs admin rights; a Claude session cannot change settings). Safe to run again: an existing ruleset with the same
# name is updated, not duplicated.
#   bash tools/repo/apply-branch-protection.sh          dry run: shows what would change
#   bash tools/repo/apply-branch-protection.sh --yes    applies it
# Undo: GitHub → Settings → Rules → Rulesets → delete the ruleset (or set it to "Disabled").
set -euo pipefail
REPO="${REPO:-wut41/coaster-lab}"; DIR="$(cd "$(dirname "$0")/../../.github/rulesets" && pwd)"; GO="${1:-}"
command -v gh >/dev/null || { echo "Install the GitHub CLI (https://cli.github.com) and run: gh auth login"; exit 1; }
existing="$(gh api "repos/$REPO/rulesets?includes_parents=false" --jq '.[] | "\(.id)\t\(.name)"')"
for f in "$DIR"/*.json; do
  name="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["name"])' "$f")"
  id="$(printf '%s\n' "$existing" | awk -F'\t' -v n="$name" '$2==n{print $1}')"
  if [ "$GO" != "--yes" ]; then echo "would ${id:+update}${id:-create}: $name"; continue; fi
  if [ -n "$id" ]; then gh api -X PUT "repos/$REPO/rulesets/$id" --input "$f" >/dev/null; echo "updated: $name";
  else gh api -X POST "repos/$REPO/rulesets" --input "$f" >/dev/null; echo "created: $name"; fi
done
if [ "$GO" = "--yes" ]; then
  gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null && echo "Dependabot alerts: on"
  gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null && echo "Dependabot security updates: on"
  echo; gh api "repos/$REPO/rules/branches/main" --jq '"main now has " + (length|tostring) + " rules: " + ([.[].type]|join(", "))'
else echo; echo "dry run only: add --yes to apply"; fi
