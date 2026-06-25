# AGENT.md

## Purpose
This file provides fast, practical guidance for future coding tasks in `Besse-frontend`, minimizing repeated full-codebase scans and improving safe, targeted edits.

## Working Principles (Short Guidelines)
- Prefer **small, scoped edits** that preserve existing UX and behavior.
- Follow the frontend architecture flow: **page/route → hooks/state → services/api → UI components**.
- Keep API communication logic in `services/` and config in `config/`.
- Keep reusable logic in `hooks/` or `customHooks/`, not duplicated in pages.
- Keep shared state in `stores/` when cross-page synchronization is needed.
- Reuse existing UI building blocks in `components/ui/` before creating new components.
- Preserve route group layouts and auth gating behavior under `app/`.
- Keep type safety by updating `types/` when payloads/contracts change.
- Avoid broad refactors unless explicitly requested.

## Frontend Structure Overview

### `app/`
Next.js App Router pages/layouts.
- Route entry points, page-level composition, and nested layouts.
- Feature routes under dashboard/auth/admin.

### `components/`
Reusable presentational and composite UI components.
- `components/ui/` contains feature-specific UI modules.
- `components/ui/chatbot/GameChatbot.tsx`: Floating chat widget mounted on three game pages (mrf-collection, broker-inventory, municipality). Features: page-specific welcome messages, markdown rendering of assistant replies, user message plain text, floating icon at bottom-right with expand/collapse animation, teammate-only realtime team chat via websocket, and unread message badge on the launcher icon.
- `components/layout/` contains header/footer and layout primitives.

### `config/`
Frontend runtime configuration.
- `api.ts`: API base URL/endpoints/client setup patterns.
- `queryClient.ts`: query/cache client setup.

### `customHooks/`
Custom reusable UI/helper hook groups.
- Localized reusable interactive behavior utilities.

### `hooks/`
Core app hooks.
- Domain hooks such as websocket integration, pairing logic, countdown/day transitions.

### `lib/`
Library-style infra helpers.
- `lib/websocket/socketManager.ts`: websocket lifecycle/connection orchestration.

### `public/`
Static assets.
- Images and public resources served directly.

### `services/`
API service layer.
- Feature-based HTTP client functions aligned with backend domains.
- **Chatbot service** (`chatbotService.ts`): Handles REST calls to backend `/api/chatbot/*` endpoints. Sends user messages with page context (mrf-collection, broker-inventory, municipality) and receives markdown-formatted LLM responses via RAG vectorstore retrieval.

### `stores/`
Global client-side state stores.
- Auth/user/notification cross-page states.

### `types/`
TypeScript contracts.
- Shared DTO/domain interfaces for safer integration.

### `utils/`
Reusable pure utility logic.
- Calculations, lobby stage helpers, secure storage helpers.

## High-Value Navigation Heuristics
- UI bug on a page: start at `app/.../page.tsx` → related `components/*` → hooks used.
- Data mismatch: inspect `services/*` + `config/api.ts` + related `types/*`.
- Realtime issue: inspect `hooks/useWebSocket.ts` + `lib/websocket/socketManager.ts`.
- Auth/session issue: inspect `stores/authStore.ts`, `services/authService.ts`, and route layouts in `app/auth` and protected dashboard areas.
- Pairing/game flow issue: inspect `hooks/usePairingSystem.ts`, `hooks/usePairingGuard.tsx`, and corresponding dashboard pages.
- **Chatbot issue**: Check `components/ui/chatbot/GameChatbot.tsx` (frontend widget, markdown rendering, context switching) → `services/chatbotService.ts` (API wrapper, message send logic) → backend `/api/chatbot/*` endpoints.
- **Team chat sync issue**: Check `components/ui/chatbot/GameChatbot.tsx` websocket subscription and session join behavior (must subscribe from mount, not tab-open only), then verify backend event emission in `Besse-backend/src/services/websocketService.ts`.

## Chatbot Lifecycle Notes
- Initialization: `GameChatbot` should subscribe to `team-chat-message` immediately on mount and ensure room/session join is active for current game session.
- Runtime sync: Team messages must be received regardless of active tab; tab switching should only affect read/unread state, not subscription.
- Termination/reset: On session/page-context change and game end transitions, reset local team chat state and unread counts to prevent stale carryover.

## Safe-Change Checklist
- Trace flow end-to-end: page/component → hook/store → service → backend contract.
- Keep API payload compatibility unless explicitly changing contracts.
- Reuse existing components/hooks before adding new abstractions.
- Update relevant `types/*.ts` whenever request/response shapes change.
- Update `.docs/*/SKILLS.md` when architecture/behavior changes materially.

## Important note for code editing tasks
- You are allowed to run terminal commands and implement the revised code directly into my code files.
- If there is a "/.docs" directory in the code base, you should select and read the appropriate SKILLS.md files within that directory to gain more detailed structure knowledge of the code base you are working on, to better plan your task and enhance your response performance.
