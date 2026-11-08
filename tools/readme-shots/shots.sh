#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/../.." && pwd)
shots="$root/packages/e2e/tests/visual.spec.ts-snapshots"
out="$root/docs/images"
command -v ffmpeg >/dev/null || { echo "ffmpeg is needed" >&2; exit 1; }

(cd "$root/packages/e2e" && npx playwright test -c playwright.showcase.config.ts)

baseline() {
  ffmpeg -loglevel error -y -i "$shots/$1-visual-darwin.png" -vf "crop=1440:900:0:0" "$out/$2.png"
  echo "$2.png  <- $1"
}

baseline station-cricket-kiosk games
baseline station-correcting-kiosk correcting
baseline admin-lights-kiosk lights
