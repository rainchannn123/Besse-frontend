'use client';

import { adminService } from '@/services/adminService';
import { useNotificationStore } from '@/stores/notificationStore';
import { AdminMonitorOverviewData, AdminPlayerGameRecord, AdminPlayerRow, AdminPlayerStatus } from '@/types/admin';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import StudentRegistrationModal from '@/components/admin/StudentRegistrationModal';
import ActivityLogModal from '@/components/admin/ActivityLogModal';

interface Room {
  roomCode: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  isAdminRoom: boolean;
  maxTeams: number;
  teams: Array<{
    teamId: string;
    citySlot: number;
    players: Array<{
      userId: string;
      name: string;
      role: string | null;
      isLeader: boolean;
    }>;
    isReady: boolean;
  }>;
  status: 'waiting' | 'ready' | 'started' | 'completed';
  gameSessionId?: string;
  createdAt: string;
}

const statusColors: Record<AdminPlayerStatus, string> = {
  offline: 'bg-gray-200 text-gray-800',
  'waiting-room': 'bg-yellow-100 text-yellow-900',
  'role-selection': 'bg-blue-100 text-blue-900',
  pairing: 'bg-purple-100 text-purple-900',
  'in-game': 'bg-emerald-100 text-emerald-900',
  completed: 'bg-orange-100 text-orange-900',
  'session-unknown': 'bg-red-100 text-red-900',
};

const statusLabel: Record<AdminPlayerStatus, string> = {
  offline: 'Offline / No Session',
  'waiting-room': 'Waiting Room',
  'role-selection': 'Role Selection',
  pairing: 'Pairing',
  'in-game': 'In Game',
  completed: 'Completed',
  'session-unknown': 'Session Unknown',
};

const cardStyle = 'rounded-xl border border-[#d3c4ad] bg-[#fff9ef] p-4 shadow-[0_2px_10px_rgba(52,37,12,0.08)]';

export default function AdminMonitorPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminMonitorOverviewData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminPlayerStatus>('all');
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);
  const [expandedHistoryUserId, setExpandedHistoryUserId] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<Record<string, AdminPlayerGameRecord[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // ✅ Helper to get admin token
  const getAdminToken = (): string | null => {
    return localStorage.getItem('admin_monitor_token') || localStorage.getItem('auth_token');
  };
  const isAdminAuthenticated = adminService.hasToken();

  const loadOverview = async (silent = false) => {
    if (!adminService.hasToken()) {
      router.push('/auth/login');
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await adminService.getOverview();
      if (response.success && response.data) {
        setOverview(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        adminService.logout();
        router.push('/auth/login');
        return;
      }

      addNotification({
        message: error.response?.data?.message || 'Failed to load monitoring overview',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

    const fetchRooms = useCallback(async () => {
    try {
      const adminToken = getAdminToken();
      if (!adminToken) {
        return;
      }

      const response = await fetch(`${API_URL}/matchmaking/rooms/all`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        adminService.logout();
        router.push('/auth/login');
        return;
      }

      if (data.success) {
        setRooms(data.data?.rooms || []);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  }, [API_URL, router]);

  const handleStartGameFromAdmin = async (roomCode: string) => {
    const confirmStart = confirm(`Start game for room ${roomCode}?`);
    if (!confirmStart) return;

    try {
      const adminToken = getAdminToken();
      const response = await fetch(`${API_URL}/matchmaking/rooms/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ roomCode }),
      });
      const data = await response.json();

            if (data.success) {
        addNotification({
          message: `Game started for room ${roomCode}. Redirecting to live monitor...`,
          type: 'success',
        });
        await loadOverview(true);
        await fetchRooms();
        router.push(`/dashboard/admin-game-room/${roomCode}/live`);
      } else {
        addNotification({
          message: data.message || 'Failed to start game',
          type: 'error',
        });
      }
    } catch (error: any) {
      addNotification({
        message: error.message || 'Failed to start game',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    loadOverview();
    fetchRooms();

    const interval = setInterval(() => {
      loadOverview(true);
      fetchRooms();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ✅ Handle creating a room
  const handleCreateRoom = async () => {
    setCreatingRoom(true);
    
    try {
      const adminToken = getAdminToken();
      
      if (!adminToken) {
        addNotification({
          message: 'No admin token found. Please login again.',
          type: 'error',
        });
        setCreatingRoom(false);
        return;
      }

      const response = await fetch(`${API_URL}/matchmaking/rooms/admin-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          isPrivate: false,
          isAdminRoom: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addNotification({
          message: `✅ Room ${data.data.roomCode} created successfully!`,
          type: 'success',
        });
        
        window.location.href = `/dashboard/admin-game-room/${data.data.roomCode}`;
      } else {
        addNotification({
          message: data.message || 'Failed to create room',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Create room error:', error);
      addNotification({
        message: error.message || 'Failed to create room',
        type: 'error',
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleStartGameForTeam = async (sessionId: string, teamName: string) => {
    const confirmStart = confirm(`Start game for team "${teamName}"?`);
    if (!confirmStart) return;

    try {
      const adminToken = getAdminToken();
      
      if (!adminToken) {
        addNotification({
          message: 'No admin token found. Please login again.',
          type: 'error',
        });
        return;
      }

      const roomsResponse = await fetch(`${API_URL}/matchmaking/rooms`, {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const roomsData = await roomsResponse.json();

      let targetRoomCode = null;
      if (roomsData.success && roomsData.data?.rooms) {
        for (const room of roomsData.data.rooms) {
          const isInRoom = room.teams?.some((t: any) => t.sessionId === sessionId);
          if (isInRoom) {
            targetRoomCode = room.roomCode;
            break;
          }
        }
      }

      if (!targetRoomCode) {
        addNotification({
          message: 'No game room found for this team',
          type: 'error',
        });
        return;
      }

      const startResponse = await fetch(`${API_URL}/matchmaking/rooms/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ roomCode: targetRoomCode }),
      });

      const startData = await startResponse.json();

      if (startResponse.ok && startData.success) {
        addNotification({
          message: `✅ Game started for "${teamName}"! Redirecting to dashboard...`,
          type: 'success',
        });
        await loadOverview(true);
        await fetchRooms();
        setTimeout(() => {
          router.push('/dashboard/matchmaking-lobby');
        }, 1200);
      } else {

        addNotification({
          message: startData.message || 'Failed to start game',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Start game error:', error);
      addNotification({
        message: error.message || 'Failed to start game',
        type: 'error',
      });
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!overview) return [];

    return overview.players.filter(player => {
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        player.name.toLowerCase().includes(q) ||
        player.email.toLowerCase().includes(q) ||
        (player.currentSession || '').toLowerCase().includes(q) ||
        (player.pairId || '').toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [overview, search, statusFilter]);

  const handleForceExit = async (player: AdminPlayerRow) => {
    // addNotification({
    //   message: 'Admin authorization required',
    //   type: 'error',
    // });

    try {
      setActionLoadingUserId(player.userId);
      await adminService.forceExitPlayer(player.userId, 'Admin manual reset for bug recovery');

      setOverview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.userId === player.userId
              ? { ...p, currentSession: null, status: 'offline' as AdminPlayerStatus }
              : p
          ),
        };
      });

      setActionLoadingUserId(null);
      loadOverview(true);
    } catch (error: any) {
      addNotification({
        message: error.response?.data?.message || 'Failed to force-exit player',
        type: 'error',
      });
      setActionLoadingUserId(null);
    }
  };

  const handleLogout = () => {
    adminService.logout();
    router.push('/auth/login');
  };

  const handleToggleHistory = async (player: AdminPlayerRow) => {
    if (expandedHistoryUserId === player.userId) {
      setExpandedHistoryUserId(null);
      return;
    }

    setExpandedHistoryUserId(player.userId);

    if (historyRecords[player.userId]) return;

    try {
      setHistoryLoading(player.userId);
      const response = await adminService.getPlayerHistory(player.userId, 20, 0);
      if (response.success && response.data) {
        setHistoryRecords(prev => ({
          ...prev,
          [player.userId]: response.data!.history,
        }));
      }
    } catch (error: any) {
      addNotification({
        message: error.response?.data?.message || 'Failed to load player history',
        type: 'error',
      });
      setExpandedHistoryUserId(null);
    } finally {
      setHistoryLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex items-center justify-center">
        <p className="text-[#5b3a1f] text-xl font-semibold">Loading admin monitor...</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-[#f5efe2] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-[#5b3a1f] text-lg font-semibold">No admin overview data available.</p>
        <button onClick={() => loadOverview()} className="rounded-lg bg-[#5b7f3b] px-4 py-2 text-white font-semibold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#efe4d2] via-[#f8f1e6] to-[#e8dcc7] p-4 md:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#4f2d14]">Game Master Monitor</h1>
              <p className="text-sm md:text-base text-[#6d4b2a]">
                Track live sessions, team composition, role assignments, and force-reset players when needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* ✅ Create Room Button */}
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom}
                className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
                  creatingRoom
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#3A7D2C] text-white hover:bg-[#2d6322]'
                }`}
              >
                {creatingRoom ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Creating...
                  </span>
                ) : (
                  'Create Admin Game Room'
                )}
              </button>
              <button
                onClick={() => loadOverview(true)}
                className="rounded-lg border border-[#5b7f3b] px-4 py-2 text-[#2e4a1f] font-semibold hover:bg-[#eef8e4]"
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="rounded-lg border border-[#5b7f3b] px-4 py-2 text-[#2e4a1f] font-semibold hover:bg-[#eef8e4]"
              >
                Register Students
              </button>
              <button
                onClick={() => setShowActivityLogModal(true)}
                className="flex items-center gap-2 rounded-lg border border-[#5b7f3b] px-4 py-2 text-[#2e4a1f] font-semibold hover:bg-[#dff0d0]"
                title="View audit trail of all platform activity"
              >
                Activity Log
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-[#a94747] px-4 py-2 text-[#8d2626] font-semibold hover:bg-[#fff0f0]"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Users</p>
              <p className="text-2xl font-bold text-[#4f2d14]">{overview.summary.totalUsers}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">In Game</p>
              <p className="text-2xl font-bold text-[#18613f]">{overview.summary.inGame}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Waiting</p>
              <p className="text-2xl font-bold text-[#8a6f13]">{overview.summary.waitingRoom}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Role Select</p>
              <p className="text-2xl font-bold text-[#2c5b8e]">{overview.summary.roleSelection}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Pairing</p>
              <p className="text-2xl font-bold text-[#6b3da3]">{overview.summary.pairing}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Offline</p>
              <p className="text-2xl font-bold text-[#505863]">{overview.summary.offline}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Lobbies</p>
              <p className="text-2xl font-bold text-[#4f2d14]">{overview.summary.activeLobbies}</p>
            </div>
            <div className={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-[#7a5f41]">Pairs</p>
              <p className="text-2xl font-bold text-[#4f2d14]">{overview.summary.activePairs}</p>
            </div>
          </section>

          {/* Players Table */}
          <section className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by player, email, session ID, pair ID"
                className="min-w-[260px] flex-1 rounded-lg border border-[#ccb99b] px-3 py-2 text-[#4f2d14] focus:outline-none focus:ring-2 focus:ring-[#84a95b]"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | AdminPlayerStatus)}
                className="rounded-lg border border-[#ccb99b] px-3 py-2 text-[#4f2d14] focus:outline-none focus:ring-2 focus:ring-[#84a95b]"
              >
                <option value="all">All Status</option>
                <option value="in-game">In Game</option>
                <option value="waiting-room">Waiting Room</option>
                <option value="role-selection">Role Selection</option>
                <option value="pairing">Pairing</option>
                <option value="completed">Completed</option>
                <option value="offline">Offline</option>
                <option value="session-unknown">Session Unknown</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
                    <th className="px-3 py-2">Player</th>
                    <th className="px-3 py-2">Account Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Game Role</th>
                    <th className="px-3 py-2">Session</th>
                    <th className="px-3 py-2">Leader</th>
                    <th className="px-3 py-2">Match Info</th>
                    <th className="px-3 py-2">Runtime</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <Fragment key={player.userId}>
                      <tr className="rounded-lg bg-white shadow-[0_1px_6px_rgba(52,37,12,0.08)]">
                        <td className="px-3 py-3 align-top">
                          <p className="font-semibold text-[#4f2d14]">{player.name}</p>
                          <p className="text-xs text-[#6d4b2a]">{player.email}</p>
                          {player.status === 'pairing' && (
                            <button
                              onClick={() => player.currentSession && handleStartGameForTeam(player.currentSession, player.name)}
                              className="mt-1 text-xs bg-[#3A7D2C] text-white px-2 py-0.5 rounded hover:bg-[#2d6322]"
                            >
                              Start Game for Team
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            player.accountType === 'admin' ? 'bg-red-100 text-red-800' :
                            player.accountType === 'educator' ? 'bg-purple-100 text-purple-800' :
                            player.accountType === 'spectator' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {player.accountType || 'student'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[player.status]}`}>
                            {statusLabel[player.status]}
                          </span>
                          <p className="text-xs mt-2 text-[#6d4b2a]">
                            Socket: {player.hasActiveSocketConnections ? '🟢 Connected' : '🔴 No live socket'}
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          {player.roleInSession ? (
                            <span className="capitalize font-semibold text-[#33552C]">{player.roleInSession}</span>
                          ) : (
                            <span className="text-gray-400">Not selected</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          <p>{player.currentSession || '-'}</p>
                          <p className="text-xs text-[#6d4b2a] mt-1">Pair: {player.pairId || '-'}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          {player.isLobbyLeader ? 'Yes' : 'No'}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          <p className="text-xs text-[#6d4b2a]">Teammates:</p>
                          <p>{player.teammateNames.join(', ') || '-'}</p>
                          <p className="text-xs text-[#6d4b2a] mt-2">Competitors:</p>
                          <p>{player.competitorNames.join(', ') || '-'}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-[#4f2d14]">
                          <p>Game: {player.gameStatus || '-'}</p>
                          <p>Day: {player.gameDay ?? '-'}</p>
                          <p>Health: {player.cityHealth ?? '-'}</p>
                        </td>
                        <td className="px-3 py-3 align-top space-y-2">
                          <button
                            onClick={() => handleForceExit(player)}
                            disabled={!isAdminAuthenticated || !player.currentSession || actionLoadingUserId === player.userId}
                            className="rounded-md bg-[#9e3f2e] px-3 py-2 text-xs text-white font-semibold disabled:cursor-not-allowed disabled:opacity-40 w-full"
                          >
                            {actionLoadingUserId === player.userId ? 'Resetting...' : 'Force Out'}
                          </button>
                          <button
                            onClick={() => handleToggleHistory(player)}
                            className="rounded-md border border-[#5b7f3b] px-3 py-2 text-xs font-semibold text-[#2e4a1f] hover:bg-[#eef8e4] w-full"
                          >
                            {expandedHistoryUserId === player.userId ? 'Hide History' : 'History'}
                          </button>
                        </td>
                      </tr>
                      {expandedHistoryUserId === player.userId && (
                        <tr className="bg-[#f8f3ea]">
                          <td colSpan={9} className="px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#7a5f41] mb-2">
                              Game History — {player.name}
                            </p>
                            {historyLoading === player.userId ? (
                              <p className="text-sm text-[#6d4b2a]">Loading history...</p>
                            ) : !historyRecords[player.userId] || historyRecords[player.userId].length === 0 ? (
                              <p className="text-sm text-[#6d4b2a]">No past game records found.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border-separate border-spacing-y-1">
                                  <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
                                      <th className="px-2 py-1">Date</th>
                                      <th className="px-2 py-1">Session</th>
                                      <th className="px-2 py-1">Role Played</th>
                                      <th className="px-2 py-1">Result</th>
                                      <th className="px-2 py-1">Day</th>
                                      <th className="px-2 py-1">City Health</th>
                                      <th className="px-2 py-1">Budget</th>
                                      <th className="px-2 py-1">CO₂</th>
                                      <th className="px-2 py-1">Teammates</th>
                                      <th className="px-2 py-1">Competitors</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {historyRecords[player.userId].map((record) => (
                                      <tr key={record.sessionId} className="bg-white rounded">
                                        <td className="px-2 py-1 text-[#4f2d14]">
                                          {new Date(record.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-2 py-1 text-[#4f2d14] font-mono text-xs">
                                          {record.sessionId}
                                        </td>
                                        <td className="px-2 py-1 text-[#4f2d14] capitalize">
                                          {record.roleInGame || '-'}
                                        </td>
                                        <td className="px-2 py-1">
                                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                            record.gameStatus === 'won' ? 'bg-emerald-100 text-emerald-900' :
                                            record.gameStatus === 'lost' ? 'bg-red-100 text-red-900' :
                                            record.gameStatus === 'complete' ? 'bg-orange-100 text-orange-900' :
                                            record.gameStatus === 'active' ? 'bg-blue-100 text-blue-900' :
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            {record.gameStatus || 'unknown'}
                                          </span>
                                        </td>
                                        <td className="px-2 py-1 text-[#4f2d14]">{record.currentGameDay ?? '-'}</td>
                                        <td className="px-2 py-1 text-[#4f2d14]">{record.cityHealth ?? '-'}</td>
                                        <td className="px-2 py-1 text-[#4f2d14]">{record.budget ?? '-'}</td>
                                        <td className="px-2 py-1 text-[#4f2d14]">{record.totalCO2 ?? '-'}</td>
                                        <td className="px-2 py-1 text-[#4f2d14] text-xs">
                                          {[
                                            record.playerNames.municipality,
                                            record.playerNames.mrf,
                                            record.playerNames.broker,
                                          ].filter(n => n !== player.name).join(', ') || '-'}
                                        </td>
                                        <td className="px-2 py-1 text-[#4f2d14] text-xs">
                                          {record.competitorNames.length > 0 ? record.competitorNames.join(', ') : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Active Match Groups */} 
          {/* <section className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#4f2d14] mb-4">Active Match Groups</h2>
            {overview.matchGroups.length === 0 ? (
              <p className="text-[#6d4b2a]">No pair groups found.</p>
            ) : (
              <div className="space-y-4">
                {overview.matchGroups.map((group) => (
                  <div key={group.pairId} className="rounded-xl border border-[#ccb99b] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p className="text-sm text-[#6d4b2a]">
                        Pair ID: <span className="font-semibold text-[#4f2d14]">{group.pairId}</span>
                      </p>
                      <p className="text-sm text-[#6d4b2a]">
                        Pair Status: <span className="font-semibold text-[#4f2d14]">{group.pairStatus || '-'}</span>
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {group.teams.map((team) => (
                        <div key={team.sessionId} className="rounded-lg border border-[#ddd0bc] bg-[#fff9ef] p-3">
                          <p className="text-sm font-semibold text-[#4f2d14]">
                            {team.teamRole || 'Unassigned Team'} | Session {team.sessionId}
                          </p>
                          <p className="text-xs text-[#6d4b2a] mt-1">
                            Leader: {team.leaderName} | Lobby Code: {team.lobbyCode} | Mode: {team.gameMode ? team.gameMode.charAt(0).toUpperCase() + team.gameMode.slice(1) : '-'}
                          </p>
                          <p className="text-xs text-[#6d4b2a]">
                            Stage: {team.stage} | Status: {team.status}
                          </p>
                          <div className="mt-2 space-y-1">
                            {team.players.map((player) => (
                              <p key={player.userId} className="text-sm text-[#4f2d14]">
                                {player.name} ({player.selectedRole || 'unassigned role'})
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => handleStartGameForTeam(team.sessionId, team.leaderName)}
                            className={`mt-2 w-full rounded-md px-3 py-1 text-xs font-semibold text-white ${
                              team.status === 'ready'
                                ? 'bg-[#3A7D2C] hover:bg-[#2d6322]'
                                : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Start Game for {team.leaderName}'s Team
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section> */}

          {/* ✅ Created Game Rooms - Admin Rooms */}
          <section className="rounded-2xl border border-[#d3c4ad] bg-[#fff9ef] p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#4f2d14] mb-4">Created Game Rooms</h2>
            
            {rooms.length === 0 ? (
              <p className="text-[#6d4b2a]">No rooms created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
                      <th className="px-4 py-2">Room Code</th>
                      <th className="px-4 py-2">Room Name</th>
                      <th className="px-4 py-2">Teams</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => {
                      const teamCount = room.teams?.length || 0;
                      const canStart = teamCount >= 2 && (room.status === 'waiting' || room.status === 'ready');
                      
                      return (
                        <tr
                          key={room.roomCode}
                          className="bg-white rounded-lg shadow-[0_1px_6px_rgba(52,37,12,0.08)] hover:shadow-md transition-shadow"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-[#33552C] text-lg">
                              {room.roomCode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#4f2d14]">
                            {room.roomName}
                            {room.isAdminRoom && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                Admin
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-[#33552C]">
                              {teamCount}/{room.maxTeams || 30}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              room.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                              room.status === 'ready' ? 'bg-green-100 text-green-700' :
                              room.status === 'started' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {room.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                                                            <button
                                onClick={() => router.push(`/dashboard/admin-game-room/${room.roomCode}`)}
                                className="px-3 py-1 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors text-xs font-semibold"
                              >
                                View Room
                              </button>
                              {canStart && (
                                <button
                                  onClick={() => handleStartGameFromAdmin(room.roomCode)}
                                  className="px-3 py-1 bg-[#3A7D2C] text-white rounded-md hover:bg-[#2d6322] transition-colors text-xs font-semibold"
                                >
                                  Start Game
                                </button>
                              )}
                              {room.status === 'started' && (
                                <button
                                  onClick={() => router.push(`/dashboard/admin-game-room/${room.roomCode}/live`)}
                                  className="px-3 py-1 bg-[#2c5b8e] text-white rounded-md hover:bg-[#224a73] transition-colors text-xs font-semibold"
                                >
                                  Live Monitor
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Registration Modal */}
      <StudentRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => {
          addNotification({
            message: 'Student registration completed!',
            type: 'success',
          });
          loadOverview(true);
        }}
      />

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={showActivityLogModal}
        onClose={() => setShowActivityLogModal(false)}
      />
    </>
  );
}