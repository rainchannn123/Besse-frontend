# SKILLS.md — `config/`

## Directory Purpose
Centralized frontend app configuration for API and query/cache behavior.

## Files
- `api.ts`: API client/base URL/endpoint config patterns.
- `queryClient.ts`: query client defaults, cache policies, retry behavior.

## Working Guidance
- Add/update API base settings here, not ad hoc in services.
- Keep query defaults stable and explicit for predictable data behavior.

## Risk Notes
- Changing base API config impacts all services.
- Aggressive query retry/cache tweaks can affect UX and load.
