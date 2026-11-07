#!/bin/sh
set -eu

PIPER_VERSION=1.8.0
VOICES=https://huggingface.co/rhasspy/piper-voices/resolve/main

here=$(cd "$(dirname "$0")" && pwd)
work=${CALLOUTS_WORK:-"$here/.work"}

case "${1:-northern_english_male}" in
  northern_english_male)
    VOICE=en_GB-northern_english_male-medium
    VOICE_URL=$VOICES/en/en_GB/northern_english_male/medium
    VOICE_SHA256=57a219ae8e638873db7d18893304be5069c42868f392bb95c3ff17f0690d0689
    ;;
  ljspeech)
    VOICE=en_US-ljspeech-high
    VOICE_URL=$VOICES/en/en_US/ljspeech/high
    VOICE_SHA256=5d4f08ba6a2a48c44592eed3ce56bf85e9de3dd4e20df90541ae68a8310c029a
    ;;
  fish)
    VOICE=fish
    ;;
  *)
    echo "usage: $0 [northern_english_male | ljspeech | fish] [out-dir]" >&2
    exit 1
    ;;
esac

command -v ffmpeg >/dev/null || { echo "ffmpeg is needed" >&2; exit 1; }

encode() {
  rm -f "$out"/*.mp3
  for clip in "$@"; do
    key=$(basename "$clip"); key=${key%.*}
    ffmpeg -nostdin -y -v error -i "$clip" \
      -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5" \
      -ac 1 -ar 22050 -b:a 32k "$out/$key.mp3"
  done
  echo "$(ls "$out"/*.mp3 | wc -l | tr -d ' ') files, $(du -sh "$out" | cut -f1) in $out"
}

if [ "$VOICE" = fish ]; then
  out=${2:-"$work/fish/pack"}
  mkdir -p "$out"
  # FISH_KEYS="0 26 180 gameshot" fetches only those, for a test listen.
  # shellcheck disable=SC2086
  python3 -I "$here/fish.py" "$work/fish/raw" ${FISH_KEYS:-}
  encode "$work/fish/raw"/*.mp3
  python3 -I -c 'import sys, zipfile, pathlib
src, dst = pathlib.Path(sys.argv[1]), sys.argv[2]
with zipfile.ZipFile(dst, "w", zipfile.ZIP_STORED) as z:
    for f in sorted(src.glob("*.mp3")): z.write(f, f.name)
print("Pack for Admin -> Sound: " + dst)' "$out" "$work/fish/fish-de.zip"
  exit 0
fi

out=${2:-"$here/../../packages/web/public/callouts/default"}
mkdir -p "$work" "$out"

if [ ! -x "$work/venv/bin/python" ]; then
  python3 -m venv "$work/venv"
  "$work/venv/bin/pip" install -q --disable-pip-version-check "piper-tts==$PIPER_VERSION"
fi

if [ ! -f "$work/$VOICE.onnx" ]; then
  curl -sSfL -o "$work/$VOICE.onnx" "$VOICE_URL/$VOICE.onnx"
  curl -sSfL -o "$work/$VOICE.onnx.json" "$VOICE_URL/$VOICE.onnx.json"
fi
echo "$VOICE_SHA256  $work/$VOICE.onnx" | shasum -a 256 -c - >/dev/null

espeak="$work/espeak-ng-data"
if [ ! -d "$espeak" ]; then
  cp -R "$("$work/venv/bin/python" -I -c 'import piper, os; print(os.path.dirname(piper.__file__))')/espeak-ng-data" "$espeak"
  ln -s . "$espeak/espeak-ng-data"
fi

wavs="$work/wav"
rm -rf "$wavs"
"$work/venv/bin/python" -I "$here/voice.py" "$work/$VOICE.onnx" "$espeak" "$wavs"

rm -f "$out"/*.mp3
for wav in "$wavs"/*.wav; do
  key=$(basename "$wav" .wav)
  ffmpeg -nostdin -y -v error -i "$wav" \
    -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5" \
    -ac 1 -ar 22050 -b:a 32k "$out/$key.mp3"
done

echo "$(ls "$out"/*.mp3 | wc -l | tr -d ' ') files, $(du -sh "$out" | cut -f1) in $out"
