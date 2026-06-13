# SKILLS.md — `lib/`

## Directory Purpose
Low-level library/infrastructure helpers supporting app-wide mechanics.

## Structure
- `websocket/socketManager.ts`: socket connection lifecycle, event wiring helpers.

## Working Guidance
- Keep connection orchestration centralized here.
- Ensure cleanup/unsubscribe semantics are preserved to avoid leaks.
- Keep protocol/event names aligned with backend socket contracts.

## Debug Heuristics
- Duplicate socket events or stale state: inspect subscription and cleanup paths.
