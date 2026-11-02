import csv
import io
import os
import posixpath
import re
import subprocess
import sys
import tempfile
import zipfile
from concurrent.futures import ThreadPoolExecutor

CALLS = {str(n) for n in range(181)} | {"gameshot", "matchshot", "busted"}
SOUND = re.compile(r"\.(mp3|wav)$", re.I)
MAX_BYTES = 50 * 1024 * 1024


def only(names, suffix, what):
    found = [n for n in names if n.lower().endswith(suffix) and not n.startswith("__MACOSX/")]
    if len(found) != 1:
        sys.exit(f"Expected one {what} in the download, found {len(found)}.")
    return found[0]


def template(data):
    rows = []
    for row in csv.reader(io.StringIO(data.decode("utf-8-sig")), delimiter=";"):
        cells = [c for c in row if c]
        if len(cells) == 1:
            cells.append(cells[0].lower())
        rows.append(cells)
    return rows


def sounds(names):
    files = [n for n in names if SOUND.search(n) and not n.startswith("__MACOSX/")]
    by_dir = {}
    for name in files:
        by_dir.setdefault(posixpath.dirname(name), []).append(name)
    order = sorted(by_dir, key=lambda d: (d.count("/"), d))
    return [name for d in order for name in sorted(by_dir[d], key=posixpath.basename)]


def calls(rows, files):
    if len(files) < len(rows):
        sys.exit(f"The pack has {len(rows)} template rows but only {len(files)} recordings.")
    taken = set()
    picked = []
    for row, source in zip(rows, files):
        for key in row[1:]:
            name = key
            n = 0
            while name in taken:
                n += 1
                name = f"{key}+{n}"
            taken.add(name)
            if name.split("+", 1)[0] in CALLS:
                picked.append((name, source))
    return picked


def encode(source_bytes, ext, work, name):
    src = os.path.join(work, f"{name}.in.{ext}")
    dst = os.path.join(work, f"{name}.mp3")
    with open(src, "wb") as f:
        f.write(source_bytes)
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", src,
         "-af", "loudnorm=I=-16:TP=-1.5", "-ac", "1", "-ar", "24000", "-b:a", "48k", dst],
        check=True,
    )
    os.remove(src)
    return name, dst


def main(download, out):
    with zipfile.ZipFile(download) as outer:
        names = outer.namelist()
        rows = template(outer.read(only(names, ".csv", "template (.csv)")))
        inner_bytes = outer.read(only(names, ".zip", "sound archive (.zip)"))
    with tempfile.TemporaryDirectory() as work:
        inner_path = os.path.join(work, "sounds.zip")
        with open(inner_path, "wb") as f:
            f.write(inner_bytes)
        del inner_bytes
        with zipfile.ZipFile(inner_path) as inner:
            picked = calls(rows, sounds(inner.namelist()))
            if not picked:
                sys.exit("No calls n4 uses were found in the pack.")
            with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
                jobs = [
                    pool.submit(encode, inner.read(source), SOUND.search(source).group(1).lower(), work, name)
                    for name, source in picked
                ]
                encoded = [job.result() for job in jobs]
        with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as pack:
            for name, path in sorted(encoded):
                pack.write(path, f"{name}.mp3")
    keys = {name.split("+", 1)[0] for name, _ in picked}
    size = os.path.getsize(out)
    print(f"{len(picked)} recordings for {len(keys)} of {len(CALLS)} calls, {size / 1e6:.1f} MB in {out}")
    missing = sorted(CALLS - keys, key=lambda k: (not k.isdigit(), int(k) if k.isdigit() else 0, k))
    if missing:
        print("Missing (n4's default voice says these): " + ", ".join(missing))
    if size > MAX_BYTES:
        sys.exit("The pack is over the 50 MB upload limit.")


if __name__ == "__main__":
    main(*sys.argv[1:3])
