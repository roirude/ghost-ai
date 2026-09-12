# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Design system and UI primitives setup

## Current Goal

- Define the next feature unit from `context/feature-specs/`.

## Completed

- Design system and UI primitives (`context/feature-specs/01-design-system.md`): shadcn/ui configured via hand-authored `components.json` and `components/ui/*` (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea) using classic Radix-primitive conventions; `lucide-react` installed; `lib/utils.ts` created with the standard `clsx` + `tailwind-merge` `cn()` helper; dark theme tokens from `context/ui-context.md` added to `app/globals.css` and mapped to shadcn's expected CSS variables. Verified: `tsc --noEmit`, `next build`, `eslint` all pass; a temporary scratch route rendered all 7 components and a Dialog in a headless browser with zero console errors and correct dark styling (no light-mode artifacts), then was removed.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here (only `01-design-system.md` exists in `context/feature-specs/` so far).

## Open Questions

- None currently.

## Architecture Decisions

- `app/globals.css` previously had no theme at all (`@import "tailwindcss";` only). The dark theme token table in `context/ui-context.md` was not yet implemented in CSS, so it was added here as part of this unit rather than deferred, since shadcn components need real tokens to render dark-first and the spec's own done-check ("No default light styling appears") depends on it.
- The installed `shadcn` CLI (v4.21.0) has moved to a new default architecture (`base-nova`/`radix-nova` presets, `@base-ui/react` or a bundled `cn` npm package, `@tabler/icons-react` as default icon lib) that no longer matches classic shadcn/ui conventions or this project's spec (which calls for a locally-defined `cn()` and `lucide-react`). Rather than accept CLI defaults, `components.json` and all `components/ui/*` files were hand-authored using classic Radix-primitive shadcn/ui source, restyled to this project's token names. Future `shadcn add` CLI usage should be checked against this convention before trusting its output.

## Session Notes

- `components/ui/*` are the protected foundation files per `context/ai-workflow-rules.md` — do not hand-edit them again except through deliberate re-generation; app-level styling/composition belongs in feature components instead.
