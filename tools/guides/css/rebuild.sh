#!/bin/sh
# Rebuild css/cp-guide.css from the classes used in tools/guide_build.py + js/cp-guide.js.
# TW_DIR = any folder whose node_modules has tailwindcss@3, @tailwindcss/forms, @tailwindcss/container-queries,
#          postcss, postcss-prefix-selector, cssnano.   Usage: TW_DIR=/path/to/tw sh tools/guides/css/rebuild.sh
set -e
: "${TW_DIR:?set TW_DIR to a folder containing node_modules}"
R="$(cd "$(dirname "$0")/../../.." && pwd -W 2>/dev/null || pwd)"
cd "$TW_DIR"
cp "$R/tools/guides/css/build.js" ./guide-build.js
cp "$R/tools/guides/css/tailwind.guide.config.js" ./guide.tw.config.js
CP_ROOT="$R" node node_modules/tailwindcss/lib/cli.js -c ./guide.tw.config.js -i "$R/tools/guides/css/in.css" -o guide.raw.css 2>&1 | tail -1
cat "$R/tools/guides/css/extra.css" >> guide.raw.css
cp guide.raw.css out.raw.css
node guide-build.js "$R/css/cp-guide.css"
cat "$R/tools/guides/css/site.css" >> "$R/css/cp-guide.css"
