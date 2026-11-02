#!/bin/sh
set -eu

if [ $# -lt 1 ]; then
  echo "usage: $0 <pack-url-or-zip> [out.zip]" >&2
  exit 1
fi

here=$(cd "$(dirname "$0")" && pwd)
work=${CALLOUTS_WORK:-"$here/.work"}
command -v ffmpeg >/dev/null || { echo "ffmpeg is needed" >&2; exit 1; }

name=$(basename "$1" .zip | sed -E 's/-v[0-9]+$//')
out=${2:-"$work/import/$name.zip"}
mkdir -p "$(dirname "$out")"

case "$1" in
  http://* | https://*)
    download=$(mktemp -d "$work/download.XXXXXX")
    trap 'rm -rf "$download"' EXIT
    echo "Downloading $1"
    curl -sSfL -o "$download/pack.zip" "$1"
    pack="$download/pack.zip"
    ;;
  *) pack=$1 ;;
esac

python3 -I "$here/import_pack.py" "$pack" "$out"
