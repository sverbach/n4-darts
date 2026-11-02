import sys
import wave
from pathlib import Path

from piper import PiperVoice

ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def below_hundred(n):
    if n < 20:
        return ONES[n]
    return TENS[n // 10] + ("-" + ONES[n % 10] if n % 10 else "")


def words(n):
    if n < 100:
        return below_hundred(n)
    rest = n % 100
    return "one hundred" + (" and " + below_hundred(rest) if rest else "")


def lines():
    yield "0", "No score."
    for n in range(1, 181):
        text = words(n)
        yield str(n), text[0].upper() + text[1:] + ("!" if n == 180 else ".")
    yield "gameshot", "Game shot!"
    yield "matchshot", "Game shot, and the match!"
    yield "busted", "No score."


def main(model, espeak_dir, out_dir):
    voice = PiperVoice.load(model, espeak_data_dir=espeak_dir)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for key, text in lines():
        with wave.open(str(out / f"{key}.wav"), "wb") as file:
            voice.synthesize_wav(text, file)


if __name__ == "__main__":
    main(*sys.argv[1:4])
