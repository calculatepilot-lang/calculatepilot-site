#!/usr/bin/env bash
# Deploy Stitch-redesigned calculator pages to production (push to main).
# Builds in a clean worktree off origin/main so unrelated local changes never ship,
# and regenerates each page from the *upstream* HTML so head edits made on main
# (analytics, ads) are preserved.
#
# Usage: tools/cpx_deploy.sh "<commit message>" financial/a-calculator.html [financial/b-calculator.html ...]
# Every page that uses css/cp-calc.css should be listed when the stylesheet changed,
# so they all pick up the new cache-busting version.
set -euo pipefail
MSG="$1"; shift
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
W="${TMPDIR:-/tmp}/cpx-deploy-$$"
cd "$ROOT"
git fetch -q origin main
git worktree add -q "$W" origin/main -b "cpx-deploy-$$"
trap 'cd "$ROOT"; git worktree remove --force "$W" >/dev/null 2>&1 || true; git branch -D -q "cpx-deploy-$$" >/dev/null 2>&1 || true' EXIT

copy() { mkdir -p "$W/$(dirname "$1")"; cp "$ROOT/$1" "$W/$1"; }
copy css/cp-calc.css; copy js/cp-calc.js; copy tools/cpx_apply.py; copy tools/cpx_deploy.sh
for page in "$@"; do
  slug="$(basename "$page" .html)"; slug="${slug%-calculator}"
  copy "js/calc/$slug.js"; copy "tools/redesign/$slug.main.html"
  [ -f "tools/redesign/$slug.head.json" ] && copy "tools/redesign/$slug.head.json"
done
cd "$W"
python tools/cpx_apply.py "$@"
for page in "$@"; do
  n=$(grep -c 'adsbygoogle\|googletagmanager\|analytics.ahrefs\|rankai' "$page" || true)
  [ "$n" -ge 3 ] || { echo "tracking scripts missing in $page ($n)"; exit 1; }
done
git add -A
git -c core.safecrlf=false diff --cached --stat | tail -1
git commit -q -m "$MSG"
git rebase -q origin/main
git push -q origin HEAD:main
git log --oneline -1
