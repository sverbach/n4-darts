# README screenshots

`shots.sh` makes the README's screenshots in `docs/images/`. Build first:

```sh
pnpm build
tools/readme-shots/shots.sh
```

- **From a showcase evening** (`packages/e2e/tests/showcase.spec.ts`): station, stats, caller, tournament, public-profile and projector. It plays three earlier evenings of 501s (moved one, two and three weeks back in the database), then tonight's 501 and an 8-player tournament on both stations, with simulated players who aim at treble 20 or the checkout route and scatter by skill. The darts are random, so every run looks a little different.
- **From the visual suite's baselines:** games, correcting and lights, cropped to 1440 × 900. Take those first with `pnpm --filter @n4/e2e visual -- --update-snapshots` when the UI changed.

Every image is 16:10 (kiosk 1440 × 900, projector 1920 × 1200), so the feature grid's rows line up. Needs `ffmpeg`.
