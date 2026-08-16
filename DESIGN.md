---
version: alpha
name: Beech & Baize
description: Design system for trakkit — a team task board where every interactive element is a painted wooden piece sitting on a baize board.

colors:
  primary: "#89582C"
  primary-edge: "#653C1F"
  primary-ink: "#FEFCF7"
  accent: "#90D94F"
  accent-border: "#63B739"
  accent-edge: "#3E8637"
  accent-ink: "#0C511A"
  accent-tint: "#D3EEB4"
  ground: "#64B468"
  ground-ink: "#18110C"
  surface: "#FEFCF7"
  surface-sunk: "#EDE7DC"
  on-surface: "#18110C"
  muted: "#6A6258"
  border: "#D9D0C1"
  flag: "#CD493C"
  flag-ink: "#8E2B26"
  flag-tint: "#FFDED5"
  due: "#DC8818"
  due-ink: "#894C06"
  due-tint: "#FBE9CA"
  brand-lime: "#C3F73A"
  brand-ink: "#071013"
  ground-dark: "#17110D"
  surface-dark: "#26201B"
  on-surface-dark: "#E8E4DD"
  muted-dark: "#9D978F"
  border-dark: "#3F3831"
  primary-dark: "#6E451E"
  primary-edge-dark: "#371E0D"
  accent-dark: "#7DBE54"
  accent-edge-dark: "#366C33"
  flag-dark: "#DD7767"
  flag-tint-dark: "#411F19"
  due-dark: "#E2A355"
  due-tint-dark: "#3B260C"
  accent-tint-dark: "#1E3619"

typography:
  display:
    fontFamily: Fredoka
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Fredoka
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.25
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0.008em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.1em
    fontFeature: "'case' 1"
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.01em
  data-display:
    fontFamily: Sono
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.01em
    fontFeature: "'tnum' 1"
  data-md:
    fontFamily: Sono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "'tnum' 1"
  data-sm:
    fontFamily: Sono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: 0.02em
    fontFeature: "'tnum' 1"

rounded:
  sm: 4px
  md: 8px
  lg: 14px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 40px
  gutter: 16px
  margin: 24px
  rail: 212px

components:
  page:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ground-ink}"
    typography: "{typography.body-md}"
    padding: "{spacing.margin}"
  page-dark:
    backgroundColor: "{colors.ground-dark}"
    textColor: "{colors.on-surface-dark}"
  rail:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.body-md}"
    width: "{spacing.rail}"
    padding: "{spacing.md}"
  rail-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.primary-ink}"
  rail-item-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  plaque:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  zone-label:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  button-primary-pressed:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  button-primary-dark:
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.ground-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  button-secondary-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-surface-dark}"
  task-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  task-row-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-surface-dark}"
  task-row-meta:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.data-sm}"
  task-row-meta-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.muted-dark}"
  column-well:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.muted}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  stat-readout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-display}"
    padding: "{spacing.md}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  divider-dark:
    backgroundColor: "{colors.border-dark}"
    height: 1px
  piece-border-leaf:
    backgroundColor: "{colors.accent-border}"
    height: 2px
  piece-edge-leaf:
    backgroundColor: "{colors.accent-edge}"
    height: 3px
  piece-edge-leaf-dark:
    backgroundColor: "{colors.accent-edge-dark}"
    height: 3px
  piece-edge-wood:
    backgroundColor: "{colors.primary-edge}"
    height: 5px
  piece-edge-wood-dark:
    backgroundColor: "{colors.primary-edge-dark}"
    height: 5px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  input-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.flag-ink}"
    typography: "{typography.body-sm}"
  chip-project:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  chip-flag:
    backgroundColor: "{colors.flag-tint}"
    textColor: "{colors.flag-ink}"
    typography: "{typography.data-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  chip-flag-dark:
    backgroundColor: "{colors.flag-tint-dark}"
    textColor: "{colors.flag-dark}"
  chip-due:
    backgroundColor: "{colors.due-tint}"
    textColor: "{colors.due-ink}"
    typography: "{typography.data-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  chip-due-dark:
    backgroundColor: "{colors.due-tint-dark}"
    textColor: "{colors.due-dark}"
  chip-done-dark:
    backgroundColor: "{colors.accent-tint-dark}"
    textColor: "{colors.accent-dark}"
  chip-done:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.data-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  priority-stripe:
    backgroundColor: "{colors.flag}"
    width: 4px
  deadline-stripe:
    backgroundColor: "{colors.due}"
    height: 4px
  tooltip:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  wordmark:
    backgroundColor: "{colors.brand-ink}"
    textColor: "{colors.brand-lime}"
    typography: "{typography.headline-lg}"
---

# trakkit — Beech & Baize

## Overview

trakkit is a team task board. People open it first thing, move a few things, and come back four or five times a day. The board itself is dense — dozens of rows, priorities, owners, deadlines — and it has to stay scannable. Wrapped around that density is a reward layer: a garden that grows, clouds that pay out coins, seeds that unlock. Those two things pull in opposite directions, and every previous attempt at this interface has resolved the tension by putting a playful skin on top of a neutral SaaS app.

The direction here resolves it the other way. **Everything in trakkit that you can act on is a painted wooden piece sitting on a baize board.** The referent is a Swedish beech-ply toy set — oiled beech, thick poster paint, routed edges — laid out on the green felt of a games table. Not a metaphor applied as decoration: it is the rule that generates the geometry. A wooden piece has thickness, so every interactive element shows the edge of its own ply as a hard 3px band beneath it. A piece can be picked up, so hover lifts it 1px. A piece can be pressed into the board, so `:active` pushes it down 2px and the visible edge shrinks to 1px. Nothing in this system blurs, because a piece resting on felt does not cast a soft shadow — you just see its side.

What that buys: the board is legible without labels. Wood is structure (the rail, page plaques, zone markers — things that hold other things). Paint is action (buttons, the active nav item — things you press). Bone-white is data (task rows, cards — things you read). A new screen is designed by asking which of the three a thing is.

What it gives up, deliberately: **information density and institutional seriousness.** Every piece carries 2px of border and 3–5px of edge, and that chrome is space a hairline-ruled table would have spent on rows. trakkit will always show fewer tasks per screen than Linear does. The trade buys an interface a team returns to voluntarily five times a day, which for a tool whose entire value depends on people actually updating it is the more important property. If trakkit ever needs to look like enterprise software, this is the wrong system and it should be replaced rather than diluted.

The system commits to warmth throughout. There is no pure white, no pure black, and no untinted grey anywhere in it.

## Colors

Every color is sampled from the referent — beech ply, poster paint, or table baize — and that constraint set the values rather than preference.

- **Primary (#89582C):** *Oiled beech, end grain.* All structural chrome: the sidebar rail, page plaques, zone labels. This is deliberately a step darker than the beech the app shipped with (`#A9773F`), which failed WCAG AA under both creams currently set on it — `#FFFDF5` on plaques and zone labels measures **3.82:1**, and `--wood-ink` `#FDF3E0` on rail nav text measures **3.53:1**. At `#89582C` the cream reads 5.86:1. The lighter beech was a real contrast defect, not a style preference, and it is not preserved.
- **Primary-edge (#653C1F):** *The sawn edge of the ply.* The band under every wooden piece. It is not a shadow color and must never be given opacity or blur.
- **Primary-ink (#FEFCF7):** *Unbleached paper label.* Text on wood. Also the surface color — the same value does both jobs because a paper label glued to a wooden piece and a paper card on the table are the same material.
- **Accent (#90D94F):** *Poster paint, thick coat.* The single action color. It appears on primary buttons and the active rail item, and nowhere else. This is the value the app already used for `--leaf`, kept unchanged because it was right.
- **Accent-border (#63B739) / Accent-edge (#3E8637):** The 2px painted outline and the 3px ply edge of a green piece. Two distinct steps down the same ramp, not one color at two opacities.
- **Accent-ink (#0C511A):** *Dark green paint, second coat.* Text on the accent. 5.24:1.
- **Accent-tint (#D3EEB4):** A wash of the same paint, used only for completed-state chips.
- **Ground (#64B468):** *Table baize.* This is the largest change in the system. The board previously ran on `#95E06C`, which sits at OKLCH `0.83 / 0.168 / 136` — within 0.03 lightness and 0.002 chroma of the accent green. **The primary action button was the same color as the entire page behind it**, which is accent inflation in its purest form: the accent could not signal anything because it was the background. Baize pulls lightness to 0.70 and chroma to 0.115 and shifts the hue toward grass, opening a real gap. The green character of the app survives; the accent starts working.
- **Surface (#FEFCF7) and Surface-sunk (#EDE7DC):** *Card stock and the recessed tray of the box.* Task rows and cards sit on the first; column wells are routed into the second.
- **On-surface (#18110C):** *Ink.* A warm near-black carrying the beech hue. The old `#071013` was a cool blue-green near-black inherited from the previous system and reads as a foreign object against warm neutrals.
- **Muted (#6A6258):** Metadata, timestamps, counts. 5.85:1 on surface — chosen over the more obvious lighter grey specifically because meta text on a task board is read, not decorated.
- **Border (#D9D0C1):** Hairlines *inside* paper surfaces only. Wooden and painted pieces use their own `-border` value.
- **Flag (#CD493C) / Due (#DC8818):** *Poster paint, red and amber pots.* Priority and deadline. These replace `#EF4444` and `#F59E0B` — Tailwind red-500 and amber-500, imported unmodified and sitting at a chroma and hue the rest of the palette never uses. The replacements are built on the same lightness curve and chroma ceiling as the beech and leaf ramps, so a red flag looks like it was painted in the same workshop.
- **Brand-lime (#C3F73A) and Brand-ink (#071013):** The trakkit wordmark, and only the wordmark. These two are fixed brand values and are exempt from the material rules on purpose — a logo is a printed sticker on the box, not a piece in the set. Their scarcity is what keeps them reading as identity rather than as interface.

All ramps were built in OKLCH and converted to hex. Lightness descends on a perceptual curve; chroma peaks mid-ramp and tapers at both ends; hue bends across each ramp (beech 86°→48°, leaf 126°→146°) so the colors behave like pigment rather than like interpolation. Neutrals carry chroma 0.007–0.024 at hue 56–86 — warm throughout. **No value in this system has R = G = B.**

### Dark mode

Dark is a separate design, not an inversion. The ground goes to `#17110D` — a warm near-black, not a navy — surfaces step *up* to `#26201B` rather than casting shadows, and chroma comes off the paints by roughly 15% because saturated color reads hotter against dark. The wood darkens to `#6E451E`; the paint softens to `#7DBE54` and takes `ground-dark` as its ink rather than `accent-ink`, which drops to 3.97:1 against the lighter paint and fails.

| Role | Light | Dark |
|---|---|---|
| Ground | `#64B468` | `#17110D` |
| Surface | `#FEFCF7` | `#26201B` |
| On-surface | `#18110C` | `#E8E4DD` |
| Muted | `#6A6258` | `#9D978F` |
| Border | `#D9D0C1` | `#3F3831` |
| Wood | `#89582C` | `#6E451E` |
| Wood edge | `#653C1F` | `#371E0D` |
| Paint | `#90D94F` | `#7DBE54` |
| Paint edge | `#3E8637` | `#366C33` |
| Flag | `#CD493C` | `#DD7767` |
| Due | `#DC8818` | `#E2A355` |

## Typography

Three families, three jobs. The pairing is a deliberate contrast rather than a blend: **a hand-made toy set with a precise label on it.** Fredoka is the toy; Inter is the label.

**Fredoka** carries the voice — the display plaque and page titles. Rounded geometric: the letterforms are circles and squares with the corners taken off, which is a description of the pieces themselves. A router bit rounding over the edge of a plywood piece and a type designer rounding off a stem terminal are the same gesture on two materials, and Fredoka is where that gesture shows. Used at **600 only**, chosen over 700 because its counters start to close at the heaviest cut and the forms lose the openness that reads as friendly rather than heavy. Never used for running text — its x-height is too small at 13px. Fallback: `Fredoka, "Baloo 2", "Trebuchet MS", sans-serif`. SIL Open Font License.

**Inter** carries the apparatus — body copy, task rows, labels, buttons. It is chosen here, not defaulted into, and the distinction matters: Inter is the most-used interface face in existence and reaching for it reflexively is the clearest sign that no typographic decision was made. The decision here is that **Inter carries none of the personality load.** Fredoka, the paint, and the routed edges do that work. What the board needs from its body face at 13px across forty rows is crispness, a large x-height, open apertures, and hinting that survives on a bad monitor — which is precisely what Inter is best in the world at. A face drawn to disappear is the right choice when there is already something in front of it worth looking at.

Runs at **400 and 700 only**. The app currently loads 400/500/600/700 and uses 500-vs-600 to distinguish a nav item from an active nav item; that distinction is carried here by the paint and the edge, which is a difference you can see across a room. Fallback: `Inter, -apple-system, "Segoe UI", sans-serif`.

One implementation note, verified rather than assumed: **the Fontsource Inter packages ship no `cv*` character variants** — the subsetted files expose only `calt ccmp dnom frac locl numr pnum tnum`, in both the static and variable builds. Inter's single-storey `a` (`cv11`), which would soften the face meaningfully here, requires the official distribution from `rsms.me/inter`. If you self-host from there, enable it and check it visually; if you stay on Fontsource, do not add a `fontFeature` for it, because it will silently do nothing.

**Sono** carries measured data — coin counts, grow timers, cloud odds, streak days, task counts, deadline dates. A soft, rounded monospace, deliberately not a developer-console mono: it keeps the numbers in the same material world as the pieces around them, and it is the one place the rounded gesture reappears at small sizes. Tabular figures are on (`'tnum' 1`) so columns do not jitter as they tick; a garden timer counting down in proportional figures visibly shivers, which is why a mono is here at all. Fallback: `Sono, "DM Mono", ui-monospace, Menlo, monospace`. SIL Open Font License.

The scale runs 11 → 34px on a ≈1.2 ratio, hand-broken at the top so `display` clears `headline-lg` by a real jump. Tracking is set per face: Fredoka takes −0.015em at display rather than the −0.03em a grotesque would want, because rounded geometrics carry their own optical spacing; Inter takes +0.008em at 13px, +0.1em on uppercase labels, and nothing through body. Line height moves inversely with size, 1.05 at display to 1.55 at `body-lg`.

**Two working weights: 400 and 700.** There is no 500 and no 600 in the body face. Fredoka appears at a single cut, 600, and only ever on plaques.

Fredoka and Sono are SIL Open Font License; Inter is SIL OFL as well. Self-host all three — the app currently pulls Inter from the Google Fonts CDN on every page load, which is a third-party dependency on the critical path for no benefit.

## Layout

The rail is fixed at **212px** and does not collapse to icons — it is a piece of furniture, and furniture does not fold. Below 820px it becomes a horizontal strip along the top, scrolling sideways, which is the one place the wooden geometry is allowed to thin (edges drop from 3px to 2px so the strip does not eat vertical space).

Spacing runs on a strict **4px base**. The board is dense enough that an 8px base would round every decision upward and cost roughly a row per column. Nothing sits off the scale — the app currently has font sizes at `0.82rem`, `0.78rem`, `0.72rem`, `0.68rem`, `0.62rem` and `0.55rem`, none of which came from anywhere, and radii at 3, 5, 7, 10, 14, 18, 20 and 22px for the same reason.

**Density varies on purpose, and the variation is the wayfinding.** The board and deadlines views are tight: 8px row padding, `body-md`, `data-sm` metadata. The garden, account, and summary views are open: 16–24px padding, `body-lg`, room around the artwork. You should know which kind of screen you are on before reading a word. Do not normalize this.

Content is flush-left throughout. The one exception is the page plaque, which centers — a nameplate on a box lid is centered, and it is the only centered thing in the app. Body prose is capped at **68 characters**; nothing in trakkit is long-form except the daily summary, and that is where the cap matters most.

## Elevation & Depth

There are **no blurred shadows anywhere in this system**, including on modals and drag states. This is the load-bearing commitment. `--shadow-card: 0 1px 3px rgba(7,16,19,0.07)` and `--shadow-pop: 0 16px 48px rgba(7,16,19,0.18)` are both retired, along with the `backdrop-filter: blur(4px)` on the board hero.

Depth is the visible edge of a piece of ply, and it comes in exactly four states:

| State | Border | Edge | Transform |
|---|---|---|---|
| Flat (task rows, cards) | 1px `border` | none | none |
| Piece at rest (buttons, active nav) | 2px own `-border` | 3px own `-edge` | none |
| Plaque (page titles, zone labels) | 3px `primary-edge` | 5px `primary-edge` | none |
| Lifted (hover, drag) | unchanged | 4px | `translateY(-1px)` |
| Pressed (`:active`) | unchanged | 1px | `translateY(2px)` |

The edge is a hard `box-shadow: 0 Npx 0 <color>` with **zero blur and zero spread**, in the piece's own edge color — never black, never with opacity. An edge with alpha is the single most likely way this system degrades, because it looks almost right and destroys the material reading.

Hover and press change **geometry only, never color**. A button that also lightens on hover reads as a web control; a button that only moves reads as a physical object. Total travel is 3px (up 1, down 2), and it must feel instant — 90ms on transform and box-shadow, nothing else transitioning.

Modals and popovers are lifted pieces on a scrim, not floating panes: a 4px edge plus a `rgba(23,17,13,0.5)` scrim. No blur on the scrim.

Everything above is disabled under `prefers-reduced-motion: reduce` — pieces keep their resting edge and do not travel.

## Shapes

Radius is **hierarchical by material**, not uniform, and each level means something:

- **4px (`sm`)** — paper. Task rows, inputs, anything cut from card stock. Nearly square, because paper is cut not moulded.
- **8px (`md`)** — routed edges. Cards, nav items, column wells. The radius a router bit leaves on a plywood corner.
- **14px (`lg`)** — plaques. Page titles and the hero nameplate only. The heaviest pieces get the softest corners.
- **9999px (`full`)** — tokens. Buttons, chips, zone labels. A pill is a *turned* piece rather than a cut one, and reserving the shape for things you press or read as a tag keeps it meaningful.

Nothing uses a value between these. The rule for a new element is to identify its material first, and the radius follows.

Focus rings are 2px solid `accent-ink` (#0C511A) offset 2px — dark rather than green, because a green ring on a green button against a green board is invisible, and `accent-ink` clears 3:1 against surface, ground, and the accent itself.

## Components

**Rail.** Solid `primary` wood, 212px, `primary-ink` text at `body-md`. It is one continuous piece of wood with a 4px right border in `primary-edge` — the rail has no per-item edges except on the active item, which is a green piece set into it.

**Buttons.** Primary is `accent` paint with `accent-ink` text, pill, 2px `accent-border`, 3px `accent-edge`. Secondary is `surface` with `primary` text, same geometry, edge in `border`. **There is no ghost or tertiary button.** If a screen needs a third level of action, it has too many actions — demote one to a text link in `primary`. Hover and pressed variants exist in the tokens and carry identical colors to their base by design; the state is the transform.

**Plaques (`plaque`, `zone-label`).** Wood with `primary-ink`, centered, 5px edge. Plaques name a place — the board, a page, a zone. They never contain data and never wrap to two lines.

**Task rows.** `surface`, 4px radius, 8px padding, 1px `border` hairline between rows. Flat: a task row is paper on the table, not a piece, and giving rows edges would make a 40-row board unreadable. Priority is a 4px `flag` stripe on the leading edge **plus** a `chip-flag`; deadline is a 4px `due` stripe **plus** a `chip-due`. Never the stripe alone.

**Chips.** Pills at `data-sm`. `chip-flag`, `chip-due`, and `chip-done` are tint-plus-matching-ink pairs, all clearing 5.2:1 or better. The `chip-project` token is the **fallback** for a task with no project; a task that has one takes its color from the project palette below.

**Project colors.** Nine slots, assigned by a hash of the project id so a project is always "the teal one." The values are generated, not picked, and two rules govern them:

1. **Project hues live in the cool half of the wheel, plus rose.** The warm quadrant is reserved — flag sits at hue 29, due at 68, the accent at 133, beech at 66. The nine project hues (100, 158, 190, 220, 252, 288, 318, 348, and a low-chroma slate) each clear all four by at least 20°. This is what stops a project color from being read as a state, and it is the reason the palette looks cooler than the rest of the system rather than an oversight.
2. **Every slot sits at the same lightness as its peers** — dots at OKLCH L 0.62, tints at L 0.93 light and L 0.29 dark. No project may look louder or more urgent than another, and slot order carries no meaning.

Every tint/ink pair clears AA in both themes (measured 6.89–7.74:1); every dot clears 3:1 against both row surfaces, which is why a dot needs no per-theme variant. The nine live as `.pc-N` custom properties (`--pj-bg`, `--pj-text`) in `src/index.css`, with the generator and the contrast notes in `src/lib/projectColors.js`. **Consume them through the class, not through an inline style** — that is what makes the dark variant switch with the theme. A tenth project means generating a tenth value at the same L/C and measuring it, never eyeballing a hex.

**Column wells.** `surface-sunk`, 8px radius, `label-caps` header in `muted`. The well is routed *into* the board, so it has an inset 2px `border` line at the top and no edge beneath.

**Inputs.** `surface`, 4px radius, 1px `border`, `body-md` at full size. Error state switches text to `flag-ink` and the border to `flag`, always with an inline message — never color alone.

**Stat readouts.** `data-display` in `on-surface` on `surface`. Every number in trakkit — coins, streaks, counts, timers — is mono with tabular figures.

**Tooltips.** `on-surface` fill with `surface` text, 4px radius. The one inversion in the system. 150ms in, instant out, no edge.

**Wordmark.** `brand-lime` on `brand-ink`, with the existing 2px lime underline and 6px terminal dot. Exempt from every material rule above. It appears once per screen, in the rail.

**Garden and clouds.** The reward layer is the one place saturated color outside the palette is permitted — rarity tiers need to be instantly distinguishable and there are five of them. Constrain it: rarity colors appear only on cloud artwork and seed cards, never on board chrome, and they must be built on this system's lightness curve so a Legendary amber does not out-shout the deadline amber sitting two panels away.

## Do's and Don'ts

- **Do** keep `accent` (#90D94F) on primary buttons and the active rail item only. It is the sole action color and its meaning is entirely a function of scarcity — the previous system put it on the page background and it stopped signalling anything.
- **Don't** blur a shadow. Every edge in this system is `0 Npx 0` with zero blur, zero spread, in the piece's own edge color. No `rgba()` edges, no black, no `backdrop-filter`. This is the single commitment the whole direction rests on.
- **Do** change geometry on hover and press, never color. Up 1px, down 2px, 90ms.
- **Don't** give a task row an edge. Rows are paper and stay flat; only pieces you press get edges. A board where every row is a piece is unscannable.
- **Do** pick the radius from the material — 4px paper, 8px routed, 14px plaque, pill for tokens. Never a value in between.
- **Don't** add a font weight. 400 and 700 do the work; Fredoka 600 exists only on plaques. If a heading is not reading as a heading, it needs space above it, not an intermediate weight.
- **Don't** let Inter creep onto the plaques. The split is load-bearing: Fredoka is the toy, Inter is the label on it. A plaque set in Inter is just a brown box, and the system loses the one place its voice is allowed to show.
- **Do** set every number in Sono with `tnum`. Counters that tick — grow timers, coin totals — visibly shiver in proportional figures.
- **Don't** reach for a Tailwind default. `#EF4444`, `#F59E0B`, `#94A3B8` and `#F5F5F4` are all currently in `src/` and all four are being removed; adding another imports a foreign palette one value at a time.
- **Do** pair every state color with a second cue — a stripe with a chip, an error color with a message. Roughly 8% of men cannot rely on the red/amber distinction, and priority is the most consequential signal on the board.
- **Don't** center anything except the page plaque. The system is flush-left, including empty states and modals.
- **Do** let the board be dense and the garden be open. The density difference is deliberate wayfinding, not an inconsistency to normalize.
- **Don't** introduce `#FFFFFF`, `#000000`, or any grey where R = G = B. Every neutral here is warm-tinted, and an untinted value next to them reads as a rendering bug.
- **Do** keep `brand-lime` and `brand-ink` on the wordmark alone. They are the sticker on the box, not a piece in the set.
