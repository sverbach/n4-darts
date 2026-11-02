# A shared password for the public site

Status: needs-triage
Type: task
Blocked by: 01

## What to do

- `N4_PUBLIC_PIN`: every public route but the login answers 401 without a session; `POST /api/public/login` with the PIN sets a session cookie (as the admin PIN does: long-lived, httpOnly, secure behind TLS). Without `N4_PUBLIC_PIN` the public process refuses to start.
- The public web app shows a login page (one field, like admin's PIN screen) and remembers the session.
- Wrong attempts are slowed down (a short delay, and nginx rate limit in 07).

## Acceptance

- Server tests: 401 without a session, a session after the right PIN, refused with the wrong one, refused to start without a PIN.
