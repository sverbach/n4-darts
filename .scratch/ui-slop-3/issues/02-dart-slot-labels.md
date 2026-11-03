# "Dart 1–3" instead of "D1–D3"

Status: done
Type: task

The visit's dart slots are labelled "D1", "D2", "D3" (`StationPage.tsx`, the dart button and the "+ Add" slot). In darts "D1" means double 1, and the slots show values like "D16" right next to them.

## What to do

- Label the slots "Dart 1", "Dart 2", "Dart 3" (both the thrown dart and the "+ Add" slot). Keep "Ignored" as is.
- Check other places that label dart slots the same way (/watch, admin match detail) and change them too.

## Acceptance

- No "D1–D3" slot label left; station snapshots updated.

## Comments

2026-11-03: Built: "Dart 1" to "Dart 3" on the thrown and the "+ Add" slots (`StationPage.tsx`). /watch and admin match detail have no slot labels. docs/ui-pages.md updated.
