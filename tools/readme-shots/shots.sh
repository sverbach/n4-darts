#!/bin/sh
set -eu

root=$(cd "$(dirname "$0")/../.." && pwd)
shots="$root/packages/e2e/tests/visual.spec.ts-snapshots"
out="$root/docs/images"
command -v ffmpeg >/dev/null || { echo "ffmpeg is needed" >&2; exit 1; }

page() {
  ffmpeg -loglevel error -y -i "$shots/$1-visual-darwin.png" -vf "crop=1440:900:0:0" "$out/$2.png"
  echo "$2.png  <- $1"
}

projector() {
  ffmpeg -loglevel error -y -i "$shots/$1-visual-darwin.png" -vf "pad=1920:1200:0:60:0x060708" "$out/$2.png"
  echo "$2.png  <- $1"
}

page station-visit-kiosk station
page station-cricket-kiosk games
page tournament-kiosk tournament
page match-kiosk stats
page station-correcting-kiosk correcting
page admin-lights-kiosk lights
page profile-kiosk public-profile
projector watch-game-shot-1080p caller
projector display-groups-1080p projector
