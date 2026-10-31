---
name: n4-darts
description: A 90s-anime future-retro scoreboard for private, offline darts evenings.
colors:
  command-black: "#060708"
  cockpit-panel: "#0b0d0f"
  cockpit-surface: "#0f1215"
  hairline: "#1a1d20"
  frame-line: "#2b2f33"
  phosphor-paper: "#f2ede4"
  readout-grey: "#8c9096"
  dead-pixel: "#3a3f44"
  mecha-violet: "#a68cff"
  mecha-violet-tint: "#120f1a"
  mecha-violet-line: "#3a3150"
  sync-green: "#5cffa0"
  sync-green-tint: "#0a1611"
  sync-green-line: "#1f4a35"
  caution-amber: "#ffb23d"
  caution-amber-tint: "#140f06"
  caution-amber-line: "#5a4318"
  alarm-red: "#ff4d3d"
  alarm-red-tint: "#170a09"
  alarm-red-line: "#5a2420"
  alarm-red-faint: "#6e4440"
  avatar-1: "#4b3a7a"
  avatar-2: "#1f5249"
  avatar-3: "#6a3f1f"
  avatar-4: "#2a4a72"
  avatar-5: "#5a2645"
  avatar-6: "#4a5a22"
  avatar-7: "#6b2e2e"
  avatar-8: "#3a4048"
  avatar-9: "#2e5a5a"
typography:
  display:
    fontFamily: "Geist Pixel, monospace"
    fontSize: "clamp(96px, min(13vw, 24vh), 220px)"
    fontWeight: 400
    lineHeight: 0.8
  headline:
    fontFamily: "Silkscreen, monospace"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "3px"
  title:
    fontFamily: "Silkscreen, monospace"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1px"
  body:
    fontFamily: "Geist Pixel, monospace"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  label:
    fontFamily: "Silkscreen, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "1px"
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button:
    backgroundColor: "{colors.cockpit-surface}"
    textColor: "{colors.phosphor-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.mecha-violet}"
    textColor: "{colors.command-black}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.readout-grey}"
  button-cta:
    backgroundColor: "{colors.mecha-violet}"
    textColor: "{colors.command-black}"
    rounded: "{rounded.none}"
    padding: "0 32px"
    height: "72px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.readout-grey}"
    rounded: "{rounded.none}"
    height: "44px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.alarm-red}"
    rounded: "{rounded.none}"
    height: "44px"
  button-pressed:
    backgroundColor: "{colors.mecha-violet-tint}"
    textColor: "{colors.phosphor-paper}"
  input:
    backgroundColor: "{colors.cockpit-panel}"
    textColor: "{colors.phosphor-paper}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "48px"
  status-ok:
    backgroundColor: "{colors.sync-green-tint}"
    textColor: "{colors.sync-green}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  status-warn:
    backgroundColor: "{colors.caution-amber-tint}"
    textColor: "{colors.caution-amber}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  status-danger:
    backgroundColor: "{colors.alarm-red-tint}"
    textColor: "{colors.alarm-red}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  panel:
    backgroundColor: "{colors.cockpit-panel}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: n4-darts

## Overview

**Creative North Star: "The 90s Anime Future-Retro Scoreboard"**

A darts evening shown the way a 90s anime shows a command room: dark grounds, terse readouts in capitals, one signal colour that says *this one, now*. It's a flavour, not a costume. The system takes that genre's discipline (hard edges, bracketed big moments, status in square-dot readouts) and none of its props. The pixel type gives the scoreboard its character, and the remaining score is always the loudest thing on the screen.

Function comes first. Every surface is read somewhere hard: a station from 2–3 m by touch, the projector from across the room, admin and stats one-handed on a phone. When character and legibility pull apart, legibility wins and the character waits. Density stays low on station and projector and is moderate in admin. Decoration is rare and always earns its place.

The palette is near-black and nearly monochrome: warm phosphor text on command black, layered in five greys. Mecha Violet is the only accent. Status gets its own three colours, which are used for nothing else.

**Key Characteristics:**
- Dark only, near-black grounds, depth from tonal layers and 1px lines, never shadows.
- Two pixel fonts: Silkscreen for words in capitals, Geist Pixel for numbers and running text.
- No rounded corners anywhere. Hard edges, cut-corner octagons, slanted CTAs.
- One accent (Mecha Violet) marks the active player, the selection and the primary action.
- Big moments (game shot, champion) get violet corner brackets. Nothing else does.
- Every font is bundled, and nothing loads from the internet.

## Colors

A command room at night: five greys stepping up from black, warm paper-white text, one violet signal and three status lights.

### Primary
- **Mecha Violet** (`mecha-violet`): the one accent. It marks the active player's remaining score, the selected chip or option (on its tint, `mecha-violet-tint`, with a violet border), primary and CTA buttons, match labels ("GROUP A"), points in tables, focus rings, played progress squares and the brackets around big moments. Its line (`mecha-violet-line`) borders accent status pills.

### Neutral
- **Command Black** (`command-black`): the page ground, and the text colour on violet fills.
- **Cockpit Panel** (`cockpit-panel`): panels, fields and status pills, one step above the page.
- **Cockpit Surface** (`cockpit-surface`): buttons and selects, the raised layer.
- **Hairline** (`hairline`): row dividers and disabled borders and fills.
- **Frame Line** (`frame-line`): borders of panels, buttons and fields, header rules in tables, unplayed progress squares.
- **Phosphor Paper** (`phosphor-paper`): all primary text and scores. Warm, not pure white.
- **Readout Grey** (`readout-grey`): labels, hints, ghost buttons, placeholders, column headers.
- **Dead Pixel** (`dead-pixel`): disabled text and the dash between leg counts. Present but switched off.

### Status
- **Sync Green** (`sync-green`, with tint and line): "Board online", "ok".
- **Caution Amber** (`caution-amber`, with tint and line): "Board stopped", notices, warnings.
- **Alarm Red** (`alarm-red`, with tint, line and faint): errors, "Board offline", "Server offline", bust, destructive buttons.

### Avatar Set
Nine muted grounds (`avatar-1` to `avatar-9`) for initials avatars, chosen from the player id so each player keeps theirs. They are muted on purpose so phosphor text reads on all of them. They're used for nothing else.

### Named Rules
**The One Signal Rule.** Mecha Violet is the only accent. If two things on a screen are violet, they must mean the same thing: active, selected or primary.

**The Status Lights Rule.** Green, amber and red mean status and nothing else. A status always shows as a tint plus line plus colour, never as a bare coloured word.

**The Role-Token Rule.** Every colour is a role variable on `:root` (`styles/theme.css`). Components never use a hex value directly, so a theme can swap them in one place.

## Typography

**Display / Body Font:** Geist Pixel (fallback monospace)
**Label / Heading Font:** Silkscreen (fallback monospace)

**Character:** Silkscreen is the voice of the readout: words, names and buttons, always in capitals and slightly letter-spaced. Geist Pixel carries the numbers and running text in mixed case. Together they read as one 8-bit instrument panel.

### Hierarchy
- **Display** (Geist Pixel 400, `clamp(96px, min(13vw, 24vh), 220px)` on the kiosk, `clamp(44px, 17vw, 72px)` on phones, line-height 0.8): the remaining score. On the projector it scales with the screen (up to 200 mockup px). Leg counts on game shot go to 160px. Nothing competes with it.
- **Headline** (Silkscreen 700, 36px on the kiosk and 26px on phones, letter-spacing 3px/2px, capitals): page titles such as "NEW MATCH".
- **Title** (Silkscreen 700, 18px/16px, 1px tracking, capitals): section headings.
- **Body** (Geist Pixel 400, 22px on the kiosk and 20px on phones, line-height 1.2): running text, field values, stats numbers. Fields use 24px.
- **Label** (Silkscreen 400, 13px/11px, 1px tracking, capitals, Readout Grey): small headings ("STATIONS"), button text (12px), status pills, table headers, back links.

### Named Rules
**The Two-Voice Rule.** Words in Silkscreen capitals, numbers in Geist Pixel. A score is never set in Silkscreen, and a label is never in Geist Pixel.

**The Stored-Name Rule.** Names show in capitals through `text-transform`. The stored name never changes.

**The Tight-Numbers Rule.** Big numbers sit at line-height 0.8–0.85 so they pack like a scoreboard, not like text.

## Layout

There are two layouts and one breakpoint, **kiosk** at 760px. Phones get the stacked layout below it. The kiosk laptop and wider screens get the desktop layout. Everything above the breakpoint is a step larger: type, touch targets (`min-h-12` to `min-h-16`) and padding.

Projector pages (`/display`, `/watch`) don't use the breakpoint. They lay out in mockup pixels through the `--px` unit (one pixel of a 1920×1080 or 1280×720 mockup), using `text-pu-*`, `gap-pu-*` and similar utilities, so every screen shows the same composition and nothing scrolls.

Spacing works in a small rhythm: 6 / 8 / 12 / 16 / 24px, with 10px as the common inside gap of pills and notices. Match settings sit in a grid that fills by itself (`minmax(140px, 1fr)`). Tables run full width with the name column taking the slack and numbers right-aligned.

**The Fit-The-Room Rule.** Projector pages never scroll and never reflow. They scale.

## Elevation & Depth

The system is flat. There are no shadows. Depth comes from tonal layers (Command Black → Cockpit Panel → Cockpit Surface) and 1px borders in Frame Line, with Hairline for quieter dividers. The only "lift" is state: a pressed or selected button gets a violet tint and a 1px violet inner ring. The photo editor dims the page with a scrim (`rgb(2 3 3 / 0.85)`).

**The No-Shadow Rule.** Separation is a step in tone or a 1px line. A `box-shadow` is only used as an inset 1px ring for the selected state.

## Shapes

Every corner is square (`0px`). Three silhouettes break the rectangle, each with one job:

- **The slant**: the CTA button is a parallelogram (`clip-path`, cut 16px on the kiosk and 14px on phones). It's used only for the main action of a screen ("START", "DONE").
- **The octagon**: avatars, photos included, clipped to an octagon with 12.5% cut corners.
- **The brackets**: violet corner brackets (`avatar-frame`) around the avatar on game shot and for the champion.

Icons are pixel art drawn on a pixel grid (`PixelIcon`, `shape-rendering: crispEdges`): arrow, caret, back, up, down, dots, trophy. Status pills, errors and notices lead with a square dot, never a round one.

## Components

### Buttons
Hard-edged and tactile: square, bordered, never smaller than a thumb.
- **Shape:** square (0px), at least 44px high (60px CTA on phones, 72px on the kiosk), Silkscreen 12px in capitals.
- **Default (secondary):** Cockpit Surface fill, Frame Line border, Phosphor Paper text.
- **Primary:** Mecha Violet fill and border, Command Black text, bold. When disabled it drops to a Hairline fill with Readout Grey text.
- **CTA:** primary colours, borderless, slanted, 15px text (20px with 2px tracking on the kiosk). One per screen.
- **Ghost:** transparent, Readout Grey text.
- **Danger:** transparent with an Alarm Red border and text. When disabled it uses the red line and faint colours.
- **Pressed / toggled (`aria-pressed`):** violet border, violet tint, 1px violet inset ring.
- **Disabled:** Hairline border, transparent, Dead Pixel text.
- **Focus:** 2px Mecha Violet outline, offset 2px, on every focusable element.

### Chips (player picker)
- **Style:** name chips with a small avatar, wrapping.
- **State:** picked chips take the pressed treatment and show their order number. Tapping again removes the pick.

### Cards / Containers
- **Corner style:** square.
- **Background:** Cockpit Panel on Command Black.
- **Shadow strategy:** none (see Elevation & Depth).
- **Border:** 1px Frame Line.
- **Internal padding:** 16px (24px for the station's settings panel on the kiosk).

### Inputs / Fields
- **Style:** Cockpit Panel fill, 1px Frame Line border, square, 48px high, Geist Pixel 24px, Readout Grey placeholder.
- **Select:** Cockpit Surface fill and a pixel chevron in Mecha Violet built from four bars, with no native arrow.
- **Focus:** the global 2px violet outline.
- **Range:** the native control with a violet accent colour.

### Navigation
- **Back link:** "← PLAYERS". A pixel back-arrow and a Silkscreen 12px label in Readout Grey, 44px high, no underline.
- **Links:** underlined Phosphor Paper that turns Mecha Violet on hover.
- **Collapsible sections:** a Silkscreen summary row with a pixel caret that turns 90° when open (0.1s).

### Status Pill (signature)
A readout: a tinted box with a 1px line and a square dot in its own colour, Silkscreen in capitals (11px/13px), 30px high on phones and 36px on the kiosk, never wrapping. It comes in ok, warn, danger and accent tints, plus neutral. Errors and notices are its full-width siblings, in red and amber.

### Scoreboard Player Card (signature)
The remaining score in Display size, with the avatar and the name in Silkscreen capitals. The active player's score turns Mecha Violet, and that is the only signal for whose turn it is. Darts of the current visit show large in Geist Pixel, and an ignored dart is struck through.

### Progress Squares
One square per tournament match in a fixed-width row, Mecha Violet when played and Frame Line when not.

### Motion
Minimal and stepped. The sparkle logo plays a 64-frame sprite strip with `steps(64)` (5.12s loop) and stops under `prefers-reduced-motion`. Carets turn in 0.1s. There are no eased slides, fades or bounces.

## Do's and Don'ts

### Do:
- **Do** use a role token from `styles/theme.css` for every colour (`bg-surface`, `text-accent`, `var(--line-soft)`).
- **Do** set words in Silkscreen capitals and numbers in Geist Pixel.
- **Do** keep every corner square. Use the slant only on a screen's one CTA, the octagon only for avatars and the brackets only for game shot and the champion.
- **Do** show status as a pill with a square dot: tint, line and colour together.
- **Do** keep touch targets at least 44px (48–64px on the station kiosk).
- **Do** size projector pages in `--px` mockup units so they scale and never scroll.
- **Do** keep the remaining score the largest thing on any scoreboard.

### Don't:
- **Don't** round corners or add shadows.
- **Don't** add a second accent colour or use the status colours for decoration.
- **Don't** add scanlines, CRT glow, glitch effects, kanji, warning stripes or hex grids. The anime HUD is a flavour, not a costume.
- **Don't** load fonts, icons or images from the internet. Bundle them.
- **Don't** trade legibility at 2–3 m or across the room for character.
- **Don't** add a light theme or theme switching by hand. Themes come only by swapping the role tokens.
