# Complete Game Flow: Lobby → Pairing → Gameplay

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN / REGISTER                             │
│                    (Authentication & Setup)                          │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CREATE/JOIN LOBBY                               │
│                   (Lobby Code Entry)                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Users: 1/3                                                    │  │
│  │ Player 1 (You) → Waiting                                     │  │
│  │ Player 2 → Waiting                                           │  │
│  │ Player 3 → Waiting                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                   [Ready When: All Joined]                          │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROLE SELECTION PAGE                             │
│             (All 3 Players Select Roles)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │ │ Municipality │  │     MRF      │  │   Broker     │         │  │
│  │ │              │  │              │  │              │         │  │
│  │ │   [Select]   │  │   [Select]   │  │   [Select]   │         │  │
│  │ └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                 │  │
│  │ Player 1: Municipality (Selected ✓)                           │  │
│  │ Player 2: MRF (Selected ✓)                                    │  │
│  │ Player 3: Broker (Selected ✓)                                 │  │
│  │                   [Continue] → Start Game                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                   [Status: READY TO START]                          │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼ (Leader clicks Start Game)
┌─────────────────────────────────────────────────────────────────────┐
│                    PAIRING SYSTEM - STATE 1                          │
│               "Join Pairing Queue"                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │              🎯 Team Pairing                                   │  │
│  │         Ready to compete?                                     │  │
│  │                                                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ 🎯 Competitive Pairing                                 │  │  │
│  │  │ 🏆 Real-Time Competition                               │  │  │
│  │  │ 📊 Performance Tracking                                │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │
│  │            [Join Pairing Queue]                               │  │
│  │  ⏱️ Estimated wait: 2-5 minutes                              │  │
│  │                                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                   [Status: WAITING TO JOIN]                         │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                             ▼ (User clicks "Join Pairing Queue")
┌─────────────────────────────────────────────────────────────────────┐
│                    PAIRING SYSTEM - STATE 2                          │
│            "Waiting in Queue"                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │         🎉 Waiting for Match                                  │  │
│  │      You are in the pairing queue                            │  │
│  │                                                                 │  │
│  │  ┌──────────────────────┬──────────────────────┐             │  │
│  │  │ Queue Position       │ Estimated Wait Time  │             │  │
│  │  │        2             │      4:32            │             │  │
│  │  └──────────────────────┴──────────────────────┘             │  │
│  │                                                                 │  │
│  │       ◦ ◦ ◦                                                   │  │
│  │    Finding your match...                                      │  │
│  │                                                                 │  │
│  │  Teams Ahead: 1    Queue Status: Active                       │  │
│  │                                                                 │  │
│  │  💡 While you wait:                                           │  │
│  │    ✓ Review your team strategy                               │  │
│  │    ✓ Check the game rules and objectives                     │  │
│  │    ✓ Plan your role-specific actions                         │  │
│  │                                                                 │  │
│  │               [Leave Queue]                                    │  │
│  │                                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                 [Status: IN QUEUE - POLLING]                        │
│               [Auto-checks status every 5 sec]                      │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                ◀────WebSocket "teams-paired" Event────▶
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PAIRING SYSTEM - STATE 3                          │
│          "Teams Paired - Ready for Game"                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │             🎉 Teams Paired!                                  │  │
│  │       Ready for competitive gameplay                         │  │
│  │                                                                 │  │
│  │  ┌──────────────────┬─────────┬──────────────────┐           │  │
│  │  │  Your Team       │   vs    │   Opponent Team  │           │  │
│  │  │  Team A          │         │   Team B         │           │  │
│  │  │  Ready ✓         │         │   Ready ✓        │           │  │
│  │  └──────────────────┴─────────┴──────────────────┘           │  │
│  │                                                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │          Opponent Metrics                                │ │  │
│  │  │  Budget: $50,000  │  City Health: 75%                    │ │  │
│  │  │  Total CO₂: 145 tons  │  Current Turn: 0                 │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │                                                                 │  │
│  │  Pair ID: abc123def456                                        │  │
│  │  Partner Session: xyz789...                                   │  │
│  │                                                                 │  │
│  │  ✓ Both teams are ready. Start the game!                     │  │
│  │                                                                 │  │
│  │         [Start Competitive Game]                             │  │
│  │                                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                   [Status: PAIRED - READY]                          │
│              [Auto-fetch partner metrics every 10 sec]              │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
                      ▼ (User clicks "Start Game")
┌─────────────────────────────────────────────────────────────────────┐
│                      GAME DASHBOARD                                  │
│              (Protected by Pairing Guard)                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │  📊 GAME DASHBOARD (Municipality Role)                        │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │  │
│  │                                                                 │  │
│  │  ┌────────────────────┬────────────────────────────────────┐ │  │
│  │  │   YOUR TEAM        │     OPPONENT METRICS (Team B)      │ │  │
│  │  │ ┌────────────────┐ │ ┌──────────────────────────────┐  │ │  │
│  │  │ │ Budget: $50K   │ │ │ Budget: $50K   │ Real-time  │  │ │  │
│  │  │ │ Health: 75%    │ │ │ Health: 75%    │ Updates   │  │ │  │
│  │  │ │ CO₂: 145 tons  │ │ │ CO₂: 145 tons  │ Every 10s │  │ │  │
│  │  │ │ Day: 1/7       │ │ │ Day: 1/7       │           │  │ │  │
│  │  │ └────────────────┘ │ │ Turn: 0        │           │  │ │  │
│  │  │                    │ │ Status: Active │           │  │ │  │
│  │  │ Role: Municipality │ │ Role: (Team B) │           │  │ │  │
│  │  │                    │ │                │           │  │ │  │
│  │  │ [Collect Waste]    │ │ [View Details] │           │  │ │  │
│  │  │ [Reject Waste]     │ └──────────────────────────────┘  │ │  │
│  │  │ [View Broker Mats] │                                    │ │  │
│  │  └────────────────────┴────────────────────────────────────┘ │  │
│  │                                                                 │  │
│  │  [Waste Batches] [Projects] [Broker Market] [Inventory]        │  │
│  │                   [End Turn]                                   │  │
│  │                                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                  [Status: GAME IN PROGRESS]                         │
│         [WebSocket: Real-time game state updates]                  │
│      [Pairing: Partner metrics visible & updating]                │
└─────────────────────────────────────────────────────────────────────┘
```

## Flow States & Transitions

### State 1: Initial Screen - "Join Pairing Queue"

```
Condition: pairingStatus === null
Display: PairingQueue component
Action: User clicks "Join Pairing Queue"
Next State: "In Queue"
```

### State 2: "In Queue" - Waiting for Match

```
Condition: pairingStatus.isInQueue === true && pairingStatus.isPaired === false
Display: PairingWaitingRoom component
Features:
  - Position tracking (position 1, 2, 3...)
  - Estimated wait time (countdown)
  - Auto-polling every 5 seconds
  - Leave queue button
WebSocket Events:
  - "pairing-status-update" → Update position/time
  - "teams-paired" → Transition to State 3
Action: WebSocket "teams-paired" event or polling detects match
Next State: "Teams Paired"
```

### State 3: "Teams Paired!" - Ready for Game

```
Condition: pairingStatus.isPaired === true
Display: PairingStatus component
Features:
  - Show team role (Team A or Team B)
  - Show opponent session ID
  - Show pair ID
  - Show opponent metrics (auto-fetch every 10 sec)
  - "Start Competitive Game" button
Action: User clicks "Start Game"
Navigation: router.push(`/dashboard?sessionId=${sessionId}`)
Next State: Game Dashboard (protected by usePairingGuard)
```

### State 4: Game Dashboard

```
Condition: Route=/dashboard && pairingStatus.isPaired === true
Display: Game dashboard with role-specific UI
Features:
  - Current team metrics
  - Opponent metrics (visible side-by-side)
  - Real-time updates via WebSocket
  - Role-specific actions (Municipality, MRF, Broker)
Protection:
  - usePairingGuard prevents access if not paired
  - If pairingStatus becomes null, redirect to pairing page
End State: Game completion (win/loss condition)
```

## Key Integration Points

### 1. Role Selection Page (`/dashboard/role`)

**File**: `/home/meraj/projects/egl/besse-frontend/app/dashboard/role/page.tsx`

```typescript
// When leader clicks "Continue" after all roles selected:
const handleContinue = async () => {
  if (lobbyState?.status === 'ready') {
    if (lobbyState.leader === (user as any)._id) {
      const response = await lobbyService.startGame({ sessionId: userInfo.currentSession });
      if (response.success) {
        // Redirect to pairing page instead of direct game page
        router.push(`/dashboard/pairing?sessionId=${userInfo.currentSession}`);
      }
    }
  }
};
```

### 2. Pairing Page (`/dashboard/pairing`)

**File**: `/home/meraj/projects/egl/besse-frontend/app/dashboard/pairing/page.tsx`

```typescript
// Renders different UI based on pairingStatus:
export default function PairingPage({ searchParams }) {
  const sessionId = searchParams?.sessionId;
  const { pairingStatus } = useUserStore();
  const { joinPairingQueue, leavePairingQueue, ... } = usePairingSystem(sessionId);

  return (
    <>
      {!pairingStatus?.isInQueue && !pairingStatus?.isPaired && (
        <PairingQueue onJoinQueue={joinPairingQueue} />
      )}
      {pairingStatus?.isInQueue && !pairingStatus?.isPaired && (
        <PairingWaitingRoom position={...} estimatedWaitTime={...} />
      )}
      {pairingStatus?.isPaired && (
        <PairingStatus teamRole={...} partnerSessionId={...} onStartGame={handleStartGame} />
      )}
    </>
  );
}
```

### 3. Game Dashboard Protection

**File**: Use in any game page (e.g., `/dashboard/municipality`)

```typescript
'use client';

import { usePairingGuard } from '@/hooks/usePairingGuard';

export default function MunicipalityPage() {
  const { isPaired, canPlayGame, teamRole } = usePairingGuard();

  // Redirect handled automatically by hook
  // If not paired, usePairingGuard redirects to /dashboard/pairing?sessionId=...

  if (!canPlayGame) {
    return <LoadingScreen />;
  }

  return (
    <MunicipalityDashboard>
      {/* Show opponent metrics */}
      <OpponentMetrics teamRole={teamRole} />

      {/* Municipality-specific UI */}
      <WasteCollection />
      <BrokerMaterials />
    </MunicipalityDashboard>
  );
}
```

## Error Handling

### Error Scenarios & Recovery

```
1. Session ID Missing
   Error: "Session ID not found"
   Recovery: Redirect to /dashboard/role

2. Join Queue Failed
   Error: "Failed to join pairing queue"
   Recovery: Retry button, auto-retry after 5 sec

3. Already Paired (on re-load)
   Auto-action: Fetch pairing result and populate status

4. Partner Eliminated
   Notification: "Partner team eliminated"
   Status: Continue game solo or game over

5. Network Disconnection
   WebSocket: Auto-reconnect
   Polling: Continues checking status
```

## Performance Considerations

```
Polling Intervals:
- Pairing status: Every 5 seconds (when in queue)
- Partner metrics: Every 10 seconds (when paired)
- Game state: Real-time via WebSocket

Auto-fetch on Load:
- getPairingResult() when page loads
- Prevents stale UI if user reloads while paired

Cleanup:
- All polling intervals cleared on unmount
- All WebSocket listeners removed
- Proper dependency arrays in useEffects
```

## Testing the Flow

```bash
# 1. Create lobby with 3 players
# 2. All select roles → Ready
# 3. Leader clicks "Continue" → Redirected to pairing
# 4. Click "Join Pairing Queue" → Waiting room
# 5. Check position & time updates
# 6. Simulate backend: Send "teams-paired" event
# 7. UI updates to show opponent info
# 8. Click "Start Game" → Redirected to /dashboard
# 9. Game page visible with opponent metrics
# 10. Verify opponent metrics update every 10 sec
```

## Summary

The complete flow ensures:

- ✅ Teams cannot skip pairing
- ✅ Clear visual progression through states
- ✅ Real-time updates via WebSocket
- ✅ Fallback polling for reliability
- ✅ Protected game pages require pairing
- ✅ Partner metrics visible during gameplay
- ✅ Error handling & recovery
- ✅ Mobile responsive design
