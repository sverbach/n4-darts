# README screenshots

`shots.sh` cuts the README's screenshots in `docs/images/` from the visual suite's baselines, so take those first:

```sh
pnpm --filter @n4/e2e visual -- --update-snapshots
tools/readme-shots/shots.sh
```

Every image comes out 16:10, so the feature grid's rows line up: kiosk shots (1440 wide) are cropped to their top 1440 × 900, and projector shots (1920 × 1080) are padded to 1920 × 1200 in the page background. Needs `ffmpeg`. To show a different screen, change its line at the bottom of the script.
