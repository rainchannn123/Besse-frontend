# SKILLS.md — `components/`

## Directory Purpose
Reusable UI units, feature widgets, and layout components.

## Key Structure
- `admin/`: admin-specific reusable dialogs/components.
- `examples/`: integration/reference examples.
- `layout/`: common headers/footers and shell pieces.
- `ui/`: broad feature component library for dashboard/game actions.

## Working Guidance
- Prefer composition over duplication.
- Keep business logic outside presentational components; move to hooks/services.
- Align styling patterns with existing component conventions.

## Debug Heuristics
- Visual bug: inspect component props + parent usage in route page.
- Incorrect action wiring: inspect component callbacks and connected hooks/services.
