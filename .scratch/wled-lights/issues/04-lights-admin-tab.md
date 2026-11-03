# Admin → Lights

Status: done
Type: task
Blocked by: 02

## What to do

- A "Lights" admin tab: devices (name, URL, add, remove, "Test connection" showing the device's name and preset count, or the error); per station: device, idle and playing preset (dropdowns from the device's presets), and per event a preset and seconds, each with a "Test" button.
- Same patterns as the rest of admin (cards, ⋮ menus, pills).

## Acceptance

- Browser test with the fake WLED: add a device, test it, map an event, test it (the fake shows the preset); visual suite gets the tab at phone and kiosk width.

## Comments

2026-11-03: Built. Admin → Lights (`features/admin/lights/LightsAdmin.tsx`), live through `/api/admin/lights/live`. Devices (right column on desktop, below on a phone): a card each with its address, "Test connection" (a green pill with the device's name and preset count, or the error in red), and a ⋮ menu (Edit, Remove with a confirmation); "Add a device" (name, address). Stations: a card each with the device ("No lights" or one of the devices), the idle and playing presets, and per event a preset, its seconds and a "Test" button. Presets are dropdowns from the device (asked once per device in use); while it can't be reached, their numbers can be typed. Every choice saves as it's made. Event rows stack on a phone (the event above, then preset, seconds and Test). Tests: `e2e/tests/lights.spec.ts` against a fake WLED that `e2e/src/start.ts` now starts (add, test, map the game shot, test it: the fake shows preset 5); visual suite: admin-lights at phone and kiosk. The kiosk admin snapshots changed for the extra tab, diagnostics for its Lights section.
