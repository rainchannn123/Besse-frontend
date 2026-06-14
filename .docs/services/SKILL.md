# SKILLS.md — `services/`

## Directory Purpose
Feature-based API layer for backend communication.

## Files
- `adminService.ts`
- `authService.ts`
- `brokerService.ts`
- `gameService.ts`
- `lobbyService.ts`
- `mrfService.ts`
- `municipalityService.ts`

## Working Guidance
- Keep HTTP/request mapping and response normalization here.
- Avoid UI concerns in services.
- Align endpoint contracts with backend changes and update `types/`.
- Add new chatbot APIs in `services/chatbotService.ts` and keep its contract simple: send message, receive reply.

## Debug Heuristics
- API error/mismatch: inspect service method payloads, endpoint paths, and type assumptions.
