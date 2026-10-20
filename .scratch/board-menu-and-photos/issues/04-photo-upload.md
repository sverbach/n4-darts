# Uploading a photo in admin

Status: done
Type: task
Blocked by: 03

- `/admin` → Players: each row shows the avatar; "Add photo" / "Change photo" opens a file input (`accept="image/*"`, camera or gallery on a phone), then a square crop preview (drag to move, slider or pinch to zoom), Save / Cancel. Saving draws the crop to a 512×512 canvas and uploads it as JPEG (quality ~0.85). "Remove photo" with confirmation.
- Errors (too big, server refused) shown inline.

## Acceptance

- Checked in a browser at phone width: upload a photo, crop, replace, remove.

## Comments

**2026-10-20, done.** In `/admin` → Players each row starts with the player's avatar (`Avatar.tsx`: photo, or initials in a colour from the player id); tapping it opens `PhotoEditor.tsx`: the current photo with Add/Change photo and Remove photo (confirmed); choosing a file (`accept="image/*"`: camera or gallery on a phone) shows a round crop of a square, dragged with a finger or the mouse, zoomed with the slider, a pinch or the wheel, always covering the square. Save draws the crop onto a 512×512 canvas and uploads it as JPEG (quality 0.85). Errors show inline. Player rows now wrap their buttons below the name on a narrow phone, since the avatar left too little room.
- Checked in a browser at 390 px with touch: upload a 1280×720 picture, drag, zoom, save (22 KB JPEG stored), reopen, remove.
