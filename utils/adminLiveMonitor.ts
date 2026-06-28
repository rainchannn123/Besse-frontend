const ADMIN_LIVE_MONITOR_STORAGE_KEY = "admin_live_monitor_resume";
const ADMIN_ROOMS_REFRESH_ON_RETURN_KEY = "admin_rooms_refresh_on_return";
const REVIEW_WINDOW_MS = 5 * 60 * 1000;

export interface AdminLiveMonitorResumeState {
  roomCode: string;
  roomName?: string;
  reviewUntilMs: number | null;
  updatedAtMs: number;
}

const normalizeRoomCode = (roomCode: string): string =>
  roomCode.trim().toUpperCase();

const canUseStorage = (): boolean => typeof window !== "undefined";

export const readAdminLiveMonitorState =
  (): AdminLiveMonitorResumeState | null => {
    if (!canUseStorage()) return null;

    try {
      const raw = localStorage.getItem(ADMIN_LIVE_MONITOR_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<AdminLiveMonitorResumeState>;
      if (!parsed.roomCode || typeof parsed.roomCode !== "string") return null;

      return {
        roomCode: normalizeRoomCode(parsed.roomCode),
        roomName:
          typeof parsed.roomName === "string" ? parsed.roomName : undefined,
        reviewUntilMs:
          typeof parsed.reviewUntilMs === "number"
            ? parsed.reviewUntilMs
            : null,
        updatedAtMs:
          typeof parsed.updatedAtMs === "number"
            ? parsed.updatedAtMs
            : Date.now(),
      };
    } catch {
      return null;
    }
  };

export const writeAdminLiveMonitorState = (
  roomCode: string,
  roomName?: string,
  reviewUntilMs: number | null = null,
): void => {
  if (!canUseStorage()) return;

  const state: AdminLiveMonitorResumeState = {
    roomCode: normalizeRoomCode(roomCode),
    roomName: roomName?.trim() || undefined,
    reviewUntilMs,
    updatedAtMs: Date.now(),
  };

  localStorage.setItem(ADMIN_LIVE_MONITOR_STORAGE_KEY, JSON.stringify(state));
};

export const setAdminLiveMonitorActive = (
  roomCode: string,
  roomName?: string,
): void => {
  writeAdminLiveMonitorState(roomCode, roomName, null);
};

export const setAdminLiveMonitorReviewWindow = (
  roomCode: string,
  roomName?: string,
  nowMs = Date.now(),
): void => {
  writeAdminLiveMonitorState(roomCode, roomName, nowMs + REVIEW_WINDOW_MS);
};

export const clearAdminLiveMonitorState = (): void => {
  if (!canUseStorage()) return;
  localStorage.removeItem(ADMIN_LIVE_MONITOR_STORAGE_KEY);
};

export const isReviewWindowActive = (
  state: AdminLiveMonitorResumeState,
  nowMs = Date.now(),
): boolean => {
  return typeof state.reviewUntilMs === "number" && state.reviewUntilMs > nowMs;
};

export const getReviewWindowMs = (): number => REVIEW_WINDOW_MS;

export const markAdminRoomsRefreshOnReturn = (): void => {
  if (!canUseStorage()) return;
  localStorage.setItem(ADMIN_ROOMS_REFRESH_ON_RETURN_KEY, "1");
};

export const consumeAdminRoomsRefreshOnReturn = (): boolean => {
  if (!canUseStorage()) return false;

  const shouldRefresh =
    localStorage.getItem(ADMIN_ROOMS_REFRESH_ON_RETURN_KEY) === "1";

  if (shouldRefresh) {
    localStorage.removeItem(ADMIN_ROOMS_REFRESH_ON_RETURN_KEY);
  }

  return shouldRefresh;
};
