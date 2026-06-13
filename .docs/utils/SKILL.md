# SKILLS.md — `utils/`

## Directory Purpose
Pure helper functions used across frontend modules.

## Files
- `calculation.ts`
- `lobbyStage.ts`
- `secureStorage.ts`

## Working Guidance
- Keep utils pure where possible.
- Keep security-sensitive local storage helpers centralized in `secureStorage.ts`.
- Avoid embedding feature orchestration logic in utility modules.

## Debug Heuristics
- Derived value mismatch: inspect calculation/lobby stage helpers first.
- Persistence/session anomalies: inspect secure storage read/write/clear behavior.
