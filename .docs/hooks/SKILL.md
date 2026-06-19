# SKILLS.md — `hooks/`

## Directory Purpose
Core domain hooks for gameplay timing, pairing logic, guards, and realtime behavior.

## Files
- `useGameDay.ts`
- `useGameOverCountdown.ts`
- `usePairingGuard.tsx`
- `usePairingSystem.ts`
- `useShiftCountdown.ts`
- `useWebSocket.ts`

## Working Guidance
- Keep domain side-effects localized in hooks.
- Keep hooks deterministic with explicit dependencies.
- Expose stable return contracts for consuming components.

## Debug Heuristics
- Countdown/state timing bugs: inspect relevant countdown/day hooks.
- Pairing flow bugs: inspect guard + system hooks together.
- Realtime sync bugs: inspect `useWebSocket.ts` and `lib/websocket/socketManager.ts`.
