# Uploading a photo in admin

Status: ready-for-agent
Type: task
Blocked by: 03

- `/admin` → Players: each row shows the avatar; "Add photo" / "Change photo" opens a file input (`accept="image/*"`, camera or gallery on a phone), then a square crop preview (drag to move, slider or pinch to zoom), Save / Cancel. Saving draws the crop to a 512×512 canvas and uploads it as JPEG (quality ~0.85). "Remove photo" with confirmation.
- Errors (too big, server refused) shown inline.

## Acceptance

- Checked in a browser at phone width: upload a photo, crop, replace, remove.
