# SKILLS.md — `stores/`

## Directory Purpose
Global client state containers for cross-page/session behavior.

## Files
- `authStore.ts`
- `notificationStore.ts`
- `userStore.ts`

## Working Guidance
- Keep global state minimal and intentional.
- Normalize updates through store actions/selectors.
- Avoid duplicating same state across multiple stores.

## Debug Heuristics
- Session/UI inconsistency across routes: inspect state initialization and reset paths.
