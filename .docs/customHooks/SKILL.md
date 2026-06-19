# SKILLS.md — `customHooks/`

## Directory Purpose
Contains grouped reusable custom hook-like UI abstractions used by components.

## Structure Notes
- Organized under `component/` by UI concern (arrow button, dropdown, trader card, welcome flow, etc.).

## Working Guidance
- Keep these abstractions reusable and component-focused.
- Avoid backend/API logic here unless intentionally shared and generic.
- Prefer naming hooks/utilities by behavior intent.

## Debug Heuristics
- Repeated UI interaction issue across components: inspect matching helper under this tree.
