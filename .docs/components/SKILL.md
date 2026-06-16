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
- New interactive UI components such as `GameChatbot` should be placed under `components/ui/` and mounted only on the gameplay pages that need them.
- For realtime UI like `GameChatbot` team chat, subscribe on component mount (not tab activation), and keep unread/read indicators in component state.

## Debug Heuristics
- Visual bug: inspect component props + parent usage in route page.
- Incorrect action wiring: inspect component callbacks and connected hooks/services.
- Team chat not syncing at game start: verify `GameChatbot` websocket listener setup, session join call, and backend `team-chat-message` event emission.
