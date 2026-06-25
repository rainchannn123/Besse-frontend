import { useCallback, useEffect, useRef, useState } from "react";
import { socketManager } from "../lib/websocket/socketManager";
import { lobbyService } from "../services/lobbyService";
import { useUserStore } from "../stores/userStore";

export interface Notification {
  id: number;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

export const usePairingSystem = (
  sessionId: string,
  enabled: boolean = true
) => {
  const { pairingStatus, setPairingStatus, updatePairingStatus } =
    useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerMetrics, setPartnerMetrics] = useState<any>(null);
  const [pairData, setPairData] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addNotification = useCallback(
    (message: string, type: Notification["type"] = "info") => {
      const notification: Notification = {
        id: Date.now(),
        message,
        type,
      };
      setNotifications((prev) => [...prev.slice(-4), notification]);
      return notification;
    },
    []
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Join pairing queue
  const joinPairingQueue = useCallback(async () => {
    // console.log("Joining pairing queue with sessionId:", sessionId);
    if (!sessionId) {
      addNotification("Session ID not found", "error");
      return false;
    }

    try {
      setIsLoading(true);
      const response = await lobbyService.joinPairingQueue({ sessionId });

      if (response.success) {
        const position = response.data?.result?.queuePosition ?? 1;
        const waitTime = 30; // Default wait time

        setPairingStatus({
          isInQueue: true,
          position,
          estimatedWaitTime: waitTime,
          isPaired: false,
          pairId: null,
          partnerSessionId: null,
          teamRole: null,
        });
        addNotification(
          `Joined pairing queue at position ${position}. Estimated wait: ${Math.ceil(
            waitTime / 60
          )} minutes`,
          "success"
        );
        return true;
      } else {
        addNotification(
          response.message || "Failed to join pairing queue",
          "error"
        );
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Failed to join pairing queue";
      addNotification(errorMessage, "error");
      console.error("Join pairing queue error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addNotification, setPairingStatus]);

  // Leave pairing queue
  const leavePairingQueue = useCallback(async () => {
    if (!sessionId) {
      addNotification("Session ID not found", "error");
      return false;
    }

    try {
      setIsLoading(true);
      const response = await lobbyService.leavePairingQueue({ sessionId });

      if (response.success) {
        setPairingStatus(null);
        addNotification("Left pairing queue", "info");
        return true;
      } else {
        addNotification(
          response.message || "Failed to leave pairing queue",
          "error"
        );
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Failed to leave pairing queue";
      addNotification(errorMessage, "error");
      console.error("Leave pairing queue error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, addNotification, setPairingStatus]);

  // Check pairing status
  const checkPairingStatus = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await lobbyService.getPairingStatus(sessionId);

      if (response.success && response.data?.status) {
        const status = response.data.status;

        // Update position if in queue
        if (
          status.queuePosition !== undefined &&
          status.queuePosition !== null
        ) {
          updatePairingStatus({
            position: status.queuePosition,
          });
        }

        return status;
      }
    } catch (error: any) {
      console.error("Failed to check pairing status:", error);
    }
  }, [sessionId, updatePairingStatus]);

  // Get partner metrics
  const getPartnerMetrics = useCallback(async () => {
    if (!sessionId || !pairingStatus?.isPaired) return null;

    try {
      const response = await lobbyService.getPartnerMetrics(sessionId);

      if (response.success) {
        setPartnerMetrics(response.data?.metrics ?? null);
        return response.data?.metrics;
      }
    } catch (error: any) {
      console.error("Failed to get partner metrics:", error);
    }
  }, [sessionId, pairingStatus?.isPaired]);

  // Get pairing result
  const getPairingResult = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const response = await lobbyService.getPairingResult(sessionId);

      if (response.success && response.data?.result) {
        const result = response.data.result;

        // Only set paired status if we have actual pairing data
        if (result.pairId && result.partnerSessionId && result.teamRole) {
          // Map API status to store format
          const statusMap: Record<string, any> = {
            Active: "active",
            "Team A Eliminated": "team_a_eliminated",
            "Team B Eliminated": "team_b_eliminated",
            "Pair Completed": "completed",
          };

          setPairingStatus({
            isInQueue: false,
            position: 0,
            estimatedWaitTime: 0,
            isPaired: true,
            pairId: result.pairId,
            partnerSessionId: result.partnerSessionId,
            teamRole: result.teamRole,
            pairStatus: (statusMap[result.pairStatus] || "active") as any,
          });
          addNotification(
            `Teams paired! You are ${result.teamRole}`,
            "success"
          );
          return result;
        } else {
          // No pairing data yet, remain in queue or unpaired state
          // console.log("No pairing result available yet");
          return null;
        }
      }
    } catch (error: any) {
      console.error("Failed to get pairing result:", error);
    }
  }, [sessionId, addNotification, setPairingStatus]);

  // Stable event handlers using useCallback
  const handlePairingJoined = useCallback(
    (data: any) => {
      // console.log("[usePairingSystem] handlePairingJoined:", data);
      setPairingStatus({
        isInQueue: true,
        position: data.position ?? 1,
        estimatedWaitTime: data.estimatedWaitTime ?? 30,
        isPaired: false,
        pairId: null,
        partnerSessionId: null,
        teamRole: null,
      });
      addNotification(
        `Joined pairing queue at position ${
          data.position || 1
        }. Estimated wait: ${Math.ceil(
          (data.estimatedWaitTime || 30) / 60
        )} minutes`,
        "info"
      );
    },
    [setPairingStatus, addNotification]
  );

  const handlePairingStatusUpdate = useCallback(
    (data: any) => {
      // console.log("[usePairingSystem] handlePairingStatusUpdate:", data);
      if (data.status) {
        updatePairingStatus(data.status);
      }
    },
    [updatePairingStatus]
  );

  const handleTeamsPaired = useCallback(
    (data: any) => {
      // console.log(
      //   "[usePairingSystem] ⭐⭐⭐ TEAMS PAIRED EVENT RECEIVED ⭐⭐⭐"
      // );
      // console.log(
      //   "[usePairingSystem] Event data:",
      //   JSON.stringify(data, null, 2)
      // );
      // console.log("[usePairingSystem] Setting paired status with:", {
      //   pairId: data.pairId,
      //   partnerSessionId: data.partnerSessionId,
      //   teamRole: data.teamRole,
      // });

      setPairingStatus({
        isInQueue: false,
        position: 0,
        estimatedWaitTime: 0,
        isPaired: true,
        pairId: data.pairId,
        partnerSessionId: data.partnerSessionId,
        teamRole: data.teamRole,
        pairStatus: "active",
      });

      addNotification(
        `🎉 Teams paired! You are ${data.teamRole}. Starting competitive game...`,
        "success"
      );
    },
    [setPairingStatus, addNotification]
  );

  const handleGameStateFull = useCallback(
    (data: any) => {
      if (data.pairData) {
        setPairData(data.pairData);
      }
    },
    [setPairData]
  );

  const handlePartnerEliminated = useCallback(
    (data: any) => {
      // console.log("[usePairingSystem] handlePartnerEliminated:", data);
      updatePairingStatus({
        pairStatus: "team_a_eliminated" as any,
      });
      addNotification(
        `Partner team eliminated: ${data.reason || "Unknown"}`,
        "warning"
      );
    },
    [updatePairingStatus, addNotification]
  );

  const handlePairingLeft = useCallback(() => {
    // console.log("[usePairingSystem] handlePairingLeft");
    setPairingStatus(null);
    addNotification("Left pairing queue", "info");
  }, [setPairingStatus, addNotification]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!enabled || !sessionId) return;

    // console.log(
    //   "[usePairingSystem] Setting up WebSocket event listeners for sessionId:",
    //   sessionId
    // );

    socketManager.on("pairing-joined", handlePairingJoined);
    socketManager.on("pairing-status-update", handlePairingStatusUpdate);
    socketManager.on("teams-paired", handleTeamsPaired);
    socketManager.on("partner-eliminated", handlePartnerEliminated);
    socketManager.on("pairing-left", handlePairingLeft);
    socketManager.on("game-state-full", handleGameStateFull);

    return () => {
      // console.log(
      //   "[usePairingSystem] Cleaning up WebSocket event listeners for sessionId:",
      //   sessionId
      // );
      socketManager.off("pairing-joined", handlePairingJoined);
      socketManager.off("pairing-status-update", handlePairingStatusUpdate);
      socketManager.off("teams-paired", handleTeamsPaired);
      socketManager.off("partner-eliminated", handlePartnerEliminated);
      socketManager.off("pairing-left", handlePairingLeft);
      socketManager.off("game-state-full", handleGameStateFull);
    };
  }, [
    enabled,
    sessionId,
    handlePairingJoined,
    handlePairingStatusUpdate,
    handleTeamsPaired,
    handlePartnerEliminated,
    handlePairingLeft,
    handleGameStateFull,
  ]);

  // Auto-poll pairing status when in queue
  useEffect(() => {
    if (
      !enabled ||
      !sessionId ||
      !pairingStatus?.isInQueue ||
      pairingStatus?.isPaired
    ) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkPairingStatus();
    getPairingResult(); // Also check for pairing result immediately

    // Then poll every 3 seconds (more frequent to catch pairing quickly)
    pollingIntervalRef.current = setInterval(async () => {
      await checkPairingStatus();
      // Also check if pairing is complete
      const result = await getPairingResult();
      if (result) {
        // console.log("Pairing complete detected via polling:", result);
      }
    }, 3000); // Changed from 20000ms to 3000ms for faster detection

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    enabled,
    sessionId,
    pairingStatus?.isInQueue,
    pairingStatus?.isPaired,
    checkPairingStatus,
    getPairingResult,
  ]);

  // Auto-get partner metrics when paired
  useEffect(() => {
    if (!enabled || !sessionId || !pairingStatus?.isPaired) return;

    const interval = setInterval(() => {
      getPartnerMetrics();
    }, 10000); // Poll every 10 seconds

    // Get immediately
    getPartnerMetrics();

    return () => clearInterval(interval);
  }, [enabled, sessionId, pairingStatus?.isPaired, getPartnerMetrics]);

  return {
    pairingStatus,
    notifications,
    isLoading,
    partnerMetrics,
    pairData,
    joinPairingQueue,
    leavePairingQueue,
    checkPairingStatus,
    getPartnerMetrics,
    getPairingResult,
    addNotification,
    clearNotifications,
  };
};
