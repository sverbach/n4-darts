"""Fetches a German caller pack from Fish Audio, one request per call.

Usage: fish.py <raw-dir> [key ...]

Needs FISH_API_KEY. FISH_VOICE is the voice model's reference id, FISH_MODEL
the TTS model sent in the `model` header. Each clip lands in <raw-dir>/<key>.mp3
next to a <key>.txt holding what was asked for; a clip is only fetched again
when its text, voice or model changed, so reruns cost nothing.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.fish.audio/v1/tts"
DEFAULT_VOICE = "fbb19c617d814cc897adb459290462bb"
DEFAULT_MODEL = "s2.1-pro-free"

ONES = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun",
        "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn",
        "siebzehn", "achtzehn", "neunzehn"]
TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]


def below_hundred(n):
    if n < 20:
        return ONES[n]
    unit = n % 10
    prefix = ("ein" if unit == 1 else ONES[unit]) + "und" if unit else ""
    return prefix + TENS[n // 10]


def words(n):
    if n < 100:
        return below_hundred(n)
    return "hundert" + below_hundred(n % 100)


def lines():
    yield "0", "No Score etzadla!"
    for n in range(1, 181):
        text = words(n)
        yield str(n), text[0].upper() + text[1:] + ("!" if n == 180 else ".")
    yield "gameshot", "[excited] Game Shot!"
    yield "matchshot", "[excited] Game Shot, und das Match! Meddl on!"
    yield "busted", "[excited] No Score etzadla!"


def fetch(text, voice, model, key):
    body = json.dumps({"text": text, "reference_id": voice, "format": "mp3"}).encode()
    request = urllib.request.Request(API, data=body, method="POST", headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "model": model,
    })
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            detail = error.read().decode(errors="replace")[:300]
            sys.exit(f"Fish Audio said {error.code}: {detail}")
        except urllib.error.URLError:
            if attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise


def main(raw_dir, *only):
    key = os.environ.get("FISH_API_KEY") or sys.exit("Set FISH_API_KEY.")
    voice = os.environ.get("FISH_VOICE", DEFAULT_VOICE)
    model = os.environ.get("FISH_MODEL", DEFAULT_MODEL)
    raw = Path(raw_dir)
    raw.mkdir(parents=True, exist_ok=True)
    wanted = [(k, t) for k, t in lines() if not only or k in only]
    unknown = set(only) - {k for k, _ in lines()}
    if unknown:
        sys.exit("Unknown keys: " + ", ".join(sorted(unknown)))
    fetched = 0
    for name, text in wanted:
        stamp = json.dumps({"text": text, "voice": voice, "model": model}, ensure_ascii=False)
        mp3, txt = raw / f"{name}.mp3", raw / f"{name}.txt"
        if mp3.exists() and txt.exists() and txt.read_text(encoding="utf-8") == stamp:
            continue
        mp3.write_bytes(fetch(text, voice, model, key))
        txt.write_text(stamp, encoding="utf-8")
        fetched += 1
        print(f"  {name}", flush=True)
    print(f"Fetched {fetched}, reused {len(wanted) - fetched} from {raw}")


if __name__ == "__main__":
    main(*sys.argv[1:])
