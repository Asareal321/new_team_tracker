# design-sync notes — trakkit

## Repo shape
- The design system is `packages/ui` (`@trakkit/ui`), created during the first
  sync. The app at the repo root (`src/`) is a Vite application, NOT a component
  library — do not point the converter at the root package.
- Build is plain `tsc` + a `cp` of the three CSS files; no bundler. Entry is
  `packages/ui/dist/index.js`, types alongside it.
- `TaskRowProps` must `Omit<…, 'title'>` — the task's own title shadows the HTML
  `title` attribute and tsc errors without it.

## Source of truth
- `DESIGN.md` at the repo root is normative for every token value and the
  reasoning behind it. `packages/ui/src/tokens.css` is generated from it by hand;
  if they disagree, DESIGN.md wins and the CSS is the bug.
- Ramps were built in OKLCH and converted to hex. Do not "tidy" a token to a
  rounder hex — the values sit on a deliberate lightness curve.

## Known render warns
- (none recorded yet — first sync)
