# SKILLS.md — `types/`

## Directory Purpose
Shared TypeScript contracts for frontend domain and API integration.

## Files
- `admin.ts`
- `auth.ts`
- `besse.ts`
- `dashboard.ts`

## Working Guidance
- Update these first when contracts evolve.
- Keep type names domain-specific and explicit.
- Use shared types in services/hooks/components to reduce drift.

## Risk Notes
- Outdated type contracts can hide runtime integration bugs.
