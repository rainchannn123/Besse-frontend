"use client";

import { socketManager } from "@/lib/websocket/socketManager";
import { adminService } from "@/services/adminService";
import { useNotificationStore } from "@/stores/notificationStore";
import { AdminRoomLiveOverview } from "@/types/admin";
import {
  setAdminLiveMonitorActive,
  setAdminLiveMonitorReviewWindow,
} from "@/utils/adminLiveMonitor";

import { ArrowLeft, Clock3, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const POLL_INTERVAL_MS = 4000;
const PUSH_REFRESH_DEBOUNCE_MS = 350;
const TERMINAL_ROOM_STATUSES = new Set([
  "completed",
  "ended",
  "finished",
  "stopped",
]);

const formatTimer = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat().format(Math.round(value * 100) / 100);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeResponse = (
      error as { response?: { data?: { message?: string } } }
    ).response;
    const responseMessage = maybeResponse?.data?.message;
    if (responseMessage) {
      return responseMessage;
    }
  }

  return "Failed to load room live overview";
};

export default function AdminRoomLiveMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const roomCode = String(params.roomCode || "").toUpperCase();

  const [overview, setOverview] = useState<AdminRoomLiveOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayRemainingSeconds, setDisplayRemainingSeconds] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const pushRefreshTimeoutRef = useRef<number | null>(null);
  const countdownTargetTimestampRef = useRef<number | null>(null);
  const hasGameEndedRef = useRef(false);
  const roomNameRef = useRef<string>("");
  const [isGameEnded, setIsGameEnded] = useState(false);

  const markGameEnded = useCallback(() => {
    if (hasGameEndedRef.current) return;

    hasGameEndedRef.current = true;
    setIsGameEnded(true);
    setIsRealtimeConnected(false);
    setDisplayRemainingSeconds(0);
    countdownTargetTimestampRef.current = null;

    if (pushRefreshTimeoutRef.current !== null) {
      window.clearTimeout(pushRefreshTimeoutRef.current);
      pushRefreshTimeoutRef.current = null;
    }

    setAdminLiveMonitorReviewWindow(roomCode, roomNameRef.current || undefined);
    socketManager.leaveAdminMonitorRoom(roomCode);
  }, [roomCode]);

  const fetchLiveOverview = useCallback(
    async (silent = false) => {
      if (hasGameEndedRef.current) {
        return;
      }

      if (!adminService.hasToken()) {
        router.replace("/auth/login");
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setErrorMessage(null);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await adminService.getRoomLiveOverview(roomCode, {
          includeFlowEvents: false,
          flowLimit: 1,
        });

        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Failed to load room live overview",
          );
        }

        const remainingSeconds = Math.max(
          0,
          response.data.room.remainingSeconds,
        );
        const roomStatus = String(
          response.data.room.status || "",
        ).toLowerCase();
        const shouldEndGame =
          remainingSeconds <= 0 || TERMINAL_ROOM_STATUSES.has(roomStatus);

        if (hasGameEndedRef.current) {
          return;
        }

        roomNameRef.current = response.data.room.roomName || "";
        setAdminLiveMonitorActive(
          roomCode,
          response.data.room.roomName || undefined,
        );
        setOverview(response.data);

        if (shouldEndGame) {
          markGameEnded();
          return;
        }

        setDisplayRemainingSeconds(remainingSeconds);
        countdownTargetTimestampRef.current =
          Date.now() + remainingSeconds * 1000;
      } catch (error: unknown) {
        const message = getErrorMessage(error);
        setErrorMessage(message);

        if (!silent) {
          addNotification({
            message,
            type: "error",
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addNotification, markGameEnded, roomCode, router],
  );

  useEffect(() => {
    fetchLiveOverview(false);

    if (isGameEnded) return;

    const pollInterval = window.setInterval(() => {
      fetchLiveOverview(true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(pollInterval);
  }, [fetchLiveOverview, isGameEnded]);

  useEffect(() => {
    if (!adminService.hasToken() || isGameEnded) return;

    const handleConnected = () => {
      setIsRealtimeConnected(true);
      socketManager.joinAdminMonitorRoom(roomCode);
    };

    const handleDisconnected = () => {
      setIsRealtimeConnected(false);
    };

    const handleTelemetryPush = (
      payload: { roomCode?: string } | undefined,
    ) => {
      if (hasGameEndedRef.current) return;

      const pushedRoomCode = String(payload?.roomCode || "").toUpperCase();
      if (pushedRoomCode && pushedRoomCode !== roomCode) return;

      if (pushRefreshTimeoutRef.current !== null) return;

      pushRefreshTimeoutRef.current = window.setTimeout(() => {
        pushRefreshTimeoutRef.current = null;
        fetchLiveOverview(true);
      }, PUSH_REFRESH_DEBOUNCE_MS);
    };

    socketManager.connect();

    socketManager.on("connected", handleConnected);
    socketManager.on("disconnected", handleDisconnected);
    socketManager.on("admin:room-telemetry-updated", handleTelemetryPush);

    if (socketManager.isConnected()) {
      handleConnected();
    }

    return () => {
      socketManager.leaveAdminMonitorRoom(roomCode);
      socketManager.off("connected", handleConnected);
      socketManager.off("disconnected", handleDisconnected);
      socketManager.off("admin:room-telemetry-updated", handleTelemetryPush);

      if (pushRefreshTimeoutRef.current !== null) {
        window.clearTimeout(pushRefreshTimeoutRef.current);
        pushRefreshTimeoutRef.current = null;
      }
    };
  }, [fetchLiveOverview, isGameEnded, roomCode]);

  useEffect(() => {
    const countdownInterval = window.setInterval(() => {
      if (hasGameEndedRef.current) return;

      const targetTimestamp = countdownTargetTimestampRef.current;
      if (targetTimestamp === null) return;

      const secondsLeft = Math.max(
        0,
        Math.ceil((targetTimestamp - Date.now()) / 1000),
      );
      setDisplayRemainingSeconds((prev) =>
        prev === secondsLeft ? prev : secondsLeft,
      );

      if (secondsLeft <= 0) {
        markGameEnded();
      }
    }, 250);

    return () => window.clearInterval(countdownInterval);
  }, [markGameEnded]);

  const warningMessages = overview?.warnings || [];

  const sortedTeams = useMemo(() => {
    if (!overview) return [];

    return [...overview.teams].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.citySlot - b.citySlot;
    });
  }, [overview]);

  if (isLoading && !overview) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#50704C]" />
      </div>
    );
  }

  if (errorMessage && !overview) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-[#5b3a1f] text-lg font-semibold">{errorMessage}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLiveOverview(false)}
            className="rounded-lg bg-[#50704C] px-4 py-2 text-white font-semibold"
          >
            Retry
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg border border-[#50704C] px-4 py-2 text-[#33552C] font-semibold"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const { room, globalMetrics } = overview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <button
                onClick={() => router.push("/admin")}
                className="inline-flex items-center gap-2 text-[#50704C] hover:text-[#33552C]"
              >
                <ArrowLeft size={16} />
                Back to Admin Dashboard
              </button>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#4f2d14]">
                Live Admin Monitor · {room.roomCode}
              </h1>
              <p className="text-sm text-[#6d4b2a]">
                {room.roomName} · Status:{" "}
                <span className="font-semibold uppercase">{room.status}</span>
              </p>
              <p className="text-xs text-[#6d4b2a]">
                Realtime:
                <span
                  className={`ml-1 font-semibold ${
                    isRealtimeConnected ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {isRealtimeConnected
                    ? "True"
                    : "True"}
                </span>
              </p>
            </div>

            <button
              onClick={() => fetchLiveOverview(true)}
              disabled={isRefreshing || isGameEnded}
              className="inline-flex items-center gap-2 rounded-lg border border-[#50704C] px-4 py-2 text-[#33552C] font-semibold hover:bg-[#eef8e4] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              {isGameEnded
                ? "Game Ended"
                : isRefreshing
                  ? "Refreshing"
                  : "Refresh"}
            </button>
          </div>

          {/* {isGameEnded && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Game Ended. Live updates are paused to keep this final dashboard
              snapshot for review.
            </div>
          )} */}

          {warningMessages.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warningMessages.join(" · ")}
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 flex justify-center">
                <div className="relative flex h-72 w-72 md:h-80 md:w-80 items-center justify-center rounded-full border-[10px] border-[#50704C] bg-[#f4faef] shadow-inner">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 text-[#4f2d14] text-sm font-semibold">
                      <Clock3 size={16} />
                      {isGameEnded ? "Session Status" : "Time Remaining"}
                    </div>
                    <p className="text-4xl md:text-5xl font-extrabold tracking-wider text-[#33552C]">
                      {isGameEnded
                        ? "Game Ended"
                        : formatTimer(displayRemainingSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-[#d9ccb7] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-[#7a5f41]">
                    Teams
                  </p>
                  <p className="text-2xl font-bold text-[#4f2d14]">
                    {globalMetrics.totalTeams}
                  </p>
                </div>
                <div className="rounded-lg border border-[#d9ccb7] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-[#7a5f41]">
                    Avg Health
                  </p>
                  <p className="text-2xl font-bold text-[#18613f]">
                    {formatNumber(globalMetrics.avgHealth)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#d9ccb7] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-[#7a5f41]">
                    Avg CO2
                  </p>
                  <p className="text-2xl font-bold text-[#8d2626]">
                    {formatNumber(globalMetrics.avgCO2)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#d9ccb7] bg-white p-3">
                  <p className="text-xs uppercase tracking-wide text-[#7a5f41]">
                    Completed Projects
                  </p>
                  <p className="text-2xl font-bold text-[#2c5b8e]">
                    {globalMetrics.totalCompletedProjects}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#4f2d14] mb-3">Ranking</h2>
            <div className="space-y-2">
              {overview.rankings.map((team) => (
                <div
                  key={team.teamId}
                  className="rounded-lg border border-[#e1d6c4] bg-white p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#4f2d14]">
                      #{team.rank} · City {team.citySlot}
                    </p>
                    <p className="text-xs uppercase text-[#6d4b2a]">
                      {team.gameStatus}
                    </p>
                  </div>
                  <p className="text-sm text-[#6d4b2a] truncate">
                    {team.teamName || `Team ${team.citySlot}`}
                  </p>
                  <div className="mt-1 text-xs text-[#6d4b2a]">
                    Score:{" "}
                    <span className="font-semibold text-[#33552C]">
                      {formatNumber(team.totalProjectScore)}
                    </span>
                    {" · "}
                    Health:{" "}
                    <span className="font-semibold text-[#33552C]">
                      {formatNumber(team.health)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#4f2d14] mb-4">
            Team Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedTeams.map((team) => (
              <article
                key={team.teamId}
                className="rounded-xl border border-[#d9ccb7] bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-[#6d4b2a]">
                      City {team.citySlot}
                    </p>
                    <p className="font-bold text-[#4f2d14]">
                      {team.teamName || `Team ${team.citySlot}`}
                    </p>
                    <p className="text-xs text-[#6d4b2a]">Rank #{team.rank}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      team.connection.hasActiveSocketConnections
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {team.connection.hasActiveSocketConnections ? (
                      <Wifi size={12} />
                    ) : (
                      <WifiOff size={12} />
                    )}
                    {team.connection.hasActiveSocketConnections
                      ? "Connected"
                      : "Disconnected"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-[#f8f3ea] px-2 py-1">
                    <p className="text-xs text-[#7a5f41]">Health</p>
                    <p className="font-semibold text-[#18613f]">
                      {formatNumber(team.metrics.health)}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#f8f3ea] px-2 py-1">
                    <p className="text-xs text-[#7a5f41]">Budget</p>
                    <p className="font-semibold text-[#33552C]">
                      {formatNumber(team.metrics.budget)}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#f8f3ea] px-2 py-1">
                    <p className="text-xs text-[#7a5f41]">CO2</p>
                    <p className="font-semibold text-[#8d2626]">
                      {formatNumber(team.metrics.totalCO2)}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#f8f3ea] px-2 py-1">
                    <p className="text-xs text-[#7a5f41]">Projects</p>
                    <p className="font-semibold text-[#2c5b8e]">
                      {team.metrics.completedProjects}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#6d4b2a]">
                  Players: {team.players.municipality}, {team.players.mrf},{" "}
                  {team.players.broker}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
