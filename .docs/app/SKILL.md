# SKILLS.md — `app/`

## Directory Purpose
Hosts Next.js App Router routes, pages, and layouts that define navigation and page composition.

## Key Structure
- `layout.tsx`, `page.tsx`: root app shell and landing page.
- `admin/`: admin pages.
- `auth/`: auth-specific layout and pages (`login`, `register`).
- `dashboard/`: core feature pages and nested subroutes for game flow.

## Working Guidance
- Route-level concerns live here (navigation, composition, gate placement).
- Move reusable logic to hooks/components instead of bloating pages.
- Preserve nested layout boundaries when adding/editing pages.

## Debug Heuristics
- Broken page rendering: inspect local `layout.tsx` + `page.tsx` chain.
- Route auth behavior: inspect `auth` layout and dashboard wrappers.
- Feature flow issues: trace related dashboard subroute pages.
