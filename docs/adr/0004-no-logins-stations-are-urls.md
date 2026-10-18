# No logins: stations are URLs, admin is behind a shared PIN

Players never authenticate. A station is just the page `/station/<n>`; any number of devices (the station laptop, phones) can control it at once, and `/watch/<n>` is a view-only mirror for the projector. The organiser's `/admin` is protected only by a shared PIN from server config, to stop accidental edits rather than attackers. The room is private and the whole point is that nobody has to log in; the Board Manager API is unauthenticated anyway.
