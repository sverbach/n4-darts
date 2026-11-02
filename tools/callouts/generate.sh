#!/bin/sh
set -eu

PIPER_VERSION=1.8.0
VOICE=en_US-ljspeech-high
VOICE_URL=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high
VOICE_SHA256=5d4f08ba6a2a48c44592eed3ce56bf85e9de3dd4e20df90541ae68a8310c029a

here=$(cd "$(dirname "$0")" && pwd)
out=${1:-"$here/../../packages/web/public/callouts/default"}
work=${CALLOUTS_WORK:-"$here/.work"}

command -v ffmpeg >/dev/null || { echo "ffmpeg is needed" >&2; exit 1; }
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
