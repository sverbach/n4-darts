# Live streams that work behind a reverse proxy

Status: done
Type: task

On 2026-10-21 the app ran behind nginx (default config) at darts.niver.ch.
- **Symptoms:** darts showed up later and later, up to 5+ s; every action looked slow; `/live` requests hung for 25+ s.
- **Not the app:** via the local IP there was no delay.
- **Cause:** nginx buffers responses by default (`proxy_buffering on`), so Server-Sent Events wait in its buffer until it fills or the 25 s keep-alive pushes them through. Compression (gzip) makes it worse.

The app is meant for the local network, and the public access is being removed. Still, the live streams should survive a proxy someone puts in front.

## In scope

- **Headers.** `streamView` (`packages/server/src/live.ts`) sends:
  - `X-Accel-Buffering: no`: nginx then passes every message straight on, without any nginx config.
  - `Cache-Control: no-cache, no-transform`: proxies and CDNs then don't compress or rewrite the stream.
- **Keep-alive.** Check the keep-alive interval: 25 s is fine for nginx's default `proxy_read_timeout` of 60 s. Keep it, and note why in a comment.
- **README.** A short "Behind a reverse proxy" note:
  - the headers make nginx work out of the box;
  - for other proxies: turn buffering and compression off for `/api/*/live`;
  - the app has no login apart from the admin PIN, so don't expose it to the internet.

## Acceptance

- A test checks the headers on a live stream.
- Checked through a local nginx with its default config (e.g. a Docker `nginx:stable` with a plain `proxy_pass`): darts show up as fast as without the proxy, also late in a long match.

## Comments

2026-10-22: Done.
- **Change:** `streamView` sends `X-Accel-Buffering: no` and `Cache-Control: no-cache, no-transform`. The 25 s keep-alive stays, with a comment. There's a header test in `live.test.ts`, and a README section "Behind a reverse proxy".
- **Local nginx check** (`nginx:stable`, plain `proxy_pass`; 120 visits = 360 darts; dart → station stream):
  - **Default config:** didn't reproduce the delay even without the header (about 25 ms). nginx's default gzip doesn't touch `text/event-stream`.
  - **`gzip on` + `gzip_types text/event-stream`, header ignored** (the old behaviour): every dart waited for the keep-alive, 25–30 s.
  - **Same config with the header:** 25–28 ms, flat over the whole match.
  - So the live setup most likely had gzip on for event streams (or something similar that buffers). The header fixes both.
