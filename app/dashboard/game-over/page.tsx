'use client';

import { useGameWebSocket } from '@/hooks/useWebSocket';
import trophy from '@/public/assets/images/trophy.png';

import dollar from '@/public/assets/images/dollar.png';
import health from '@/public/assets/images/health.png';
import co2e from '@/public/assets/images/co2e.png';
import transport from '@/public/assets/images/transport.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import buildingIcon from '@/public/assets/images/buildingColor.png';
import { gameService } from '@/services/gameService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { GameState, TeamData } from '@/types/besse';
import { secureStorage } from '@/utils/secureStorage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';



export default function GameOverPage() {
  const { user, logout, updateUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<TeamData[]>([]);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const { subscribe, joinGame, leaveGame } = useGameWebSocket(user?.currentSession || undefined);

  const fetchGameState = async () => {
    if (!user?.currentSession) {
      setLoading(false);
      return;
    }

    try {
      const response = await gameService.getGameState(user.currentSession);
      if (response.success && response.data) {
        const gameState = response.data.gameState;
        setGameState(gameState);
        
        // ✅ Find current team
        const currentTeam = gameState.teams?.find(
          (team: TeamData) => team.sessionId === user.currentSession
        );
        if (currentTeam) {
          setMyTeam(currentTeam);
        }

        // ✅ Get rankings
        if (gameState.teams && gameState.teams.length > 0) {
          const sortedTeams = [...gameState.teams].sort(
            (a, b) => (b.totalProjectScore || 0) - (a.totalProjectScore || 0)
          );
          setRankings(sortedTeams);
        }

        // ✅ Get room code
        if (gameState.roomCode) {
          setRoomCode(gameState.roomCode);
        }

        // ✅ Fetch lobby code
        fetchLobbyCode(user.currentSession!);
      } else {
        console.warn('Failed to fetch game state:', response.message);
      }
    } catch (err: any) {
      console.debug('No active game session:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLobbyCode = async (sessionId: string) => {
    try {
      const response = await lobbyService.getLobbyState(sessionId);
      if (response.success && response.data) {
        setLobbyCode(response.data.lobbyState.lobbyCode);
      }
    } catch (err: any) {
      console.warn('Failed to fetch lobby code:', err?.message);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, [user?.currentSession]);

  useEffect(() => {
    if (user?.currentSession) {
      joinGame(user.currentSession);
    }
  }, [user?.currentSession, joinGame]);

  useEffect(() => {
    if (!user?.currentSession) return;

    const unsubGameComplete = subscribe('game-complete', (data: any) => {
      if (data?.rankings) {
        setRankings(data.rankings);
      }
      fetchGameState();
    });

    const unsubRankingUpdate = subscribe('room:ranking:updated', (data: any) => {
      if (data?.rankings) {
        setRankings(data.rankings);
      }
    });

    return () => {
      unsubGameComplete && unsubGameComplete();
      unsubRankingUpdate && unsubRankingUpdate();
    };
  }, [user?.currentSession, subscribe]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleStartNewGame = async () => {
    if (!user) return;

    const activeSessionId = user.currentSession;

    try {
      if (activeSessionId) {
        await lobbyService.leaveLobby({ sessionId: activeSessionId });
        leaveGame(activeSessionId);
      }

      secureStorage.removeItem('pairing_session_id');
      secureStorage.removeItem('current_game_session');
      secureStorage.removeItem('init_state');

      updateUser({
        ...user,
        currentSession: null,
      });

      addNotification({
        message: 'You have exited the previous game. Create or join your next game.',
        type: 'success',
      });

      router.push('/dashboard/besse-group');
    } catch (err: any) {
      console.error('Failed to exit current game session:', err);
      addNotification({
        message: err.response?.data?.message || 'Failed to exit current game. Please try again.',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bgColor p-6">
        <div className="text-white text-xl">Loading game results...</div>
      </div>
    );
  }

  const getTeamStatus = () => {
    if (!myTeam) return { title: 'Game Complete!', isWin: false };
    
    if (myTeam.isEliminated) {
      return {
        title: '💀 Eliminated',
        subtitle: `Eliminated due to ${myTeam.eliminationReason || 'unknown reason'}`,
        isWin: false,
      };
    }
    
    if (myTeam.gameStatus === 'completed') {
      const isWin = rankings.length > 0 && rankings[0]?.teamId === myTeam.teamId;
      return {
        title: isWin ? '🏆 Congratulations! You Won!' : 'Game Complete!',
        subtitle: isWin ? 'Highest Project Score!' : `Ranked #${rankings.findIndex(t => t.teamId === myTeam.teamId) + 1} of ${rankings.length}`,
        isWin,
      };
    }
    
    return {
      title: 'Game Complete!',
      subtitle: '',
      isWin: false,
    };
  };

  const gameStatus = getTeamStatus();

  // ✅ Calculate total project score for current team
    const totalProjectScore =
    myTeam?.totalProjectScore ||
    myTeam?.cityProjects
      ?.filter((project: TeamData['cityProjects'][number]) => project.completed)
      ?.reduce(
        (sum: number, project: TeamData['cityProjects'][number]) => sum + (project.score || 0),
        0
      ) ||
    0;

    return (
    <div className="h-screen flex flex-col bgColor">
      <div className="container mx-auto px-2 lg:px-4 flex-1 min-h-0 flex flex-col">
        <main className="py-2 lg:py-3 flex-1 min-h-0 flex flex-col">

          <div className="flex flex-col flex-1">
            {/* Title */}
                        <div className="mb-2 mt-1 lg:mt-0 flex justify-center flex-shrink-0">
              <h1 className="lg:text-[26px] md:text-[24px] text-[18px] font-bold py-1 lg:px-10 md:px-12 px-4 m-0 border-4 border-dashed border-[#A99065] text-[#7C4E2A] bg-white rounded-lg tracking-wide text-center">

                {gameStatus.title}
              </h1>
            </div>

            {/* Subtitle */}
            {gameStatus.subtitle && (
                            <div className="flex justify-center mb-2 flex-shrink-0">
                <h2 className="lg:text-[20px] md:text-[20px] text-[16px] font-semibold text-[#4f2d14] text-center">

                  {gameStatus.subtitle}
                </h2>
              </div>
            )}

                        <div className="flex-1 min-h-0 grid lg:grid-cols-12 gap-3">
              {/* Main Content */}
              <div
              className="bg-cover bg-center lg:p-4 md:p-8 p-4 w-full mx-auto rounded-[20px] flex-1 min-h-0 lg:col-span-5"

              style={{
                backgroundImage: `url(${woodenBg.src})`,
              }}
            >
              <div className="flex justify-center items-center h-full relative">
                                <div className="bg-white h-full w-full lg:p-4 md:p-6 sm:p-6 p-4 flex flex-col">

                  {/* Team Summary */}
                  <div className="rounded-[10px]">
                    <div className="flex gap-8 justify-center border-b border-gray-300 lg:py-1 py-2">
                                            <p className="flex items-center font-bold font-roboto lg:text-[18px] md:text-[22px] text-[18px] text-black">

                        Your Team Summary
                      </p>
                    </div>
                    <div className="lg:px-3 lg:py-2 px-4 py-4">
                                            <div className="lg:px-2 lg:py-1 px-2 py-2 lg:space-y-1.5 space-y-2.5">

                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={dollar} alt="dollar" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Budget
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            ${(myTeam?.budget || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={co2e} alt="co2e" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              CO2 (tCO2e)
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            {(myTeam?.totalCO2 || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={health} alt="health" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Health (%)
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            {(myTeam?.cityHealth || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={transport} alt="transport" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Shipment Count
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            {myTeam?.totalTransportTrips || 0}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={buildingIcon} alt="projects" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Projects Completed
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            {myTeam?.cityProjects?.filter((project: TeamData['cityProjects'][number]) => project.completed).length || 0} / {myTeam?.cityProjects?.length || 0}
                          </p>
                        </div>
                        {/* ✅ Project Score */}
                        {/* <div className="flex items-center justify-between border-t pt-2 mt-2">
                          <div className="flex gap-3 items-center">
                            <span className="text-xl">🏆</span>
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Total Project Score
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-[#50704C]">
                            {totalProjectScore}
                          </p>
                        </div> */}
                        {/* ✅ Team Status */}
                        {/* <div className="flex items-center justify-between border-t pt-2 mt-2">
                          <div className="flex gap-3 items-center">
                            <span className="text-xl">📊</span>
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Status
                            </p>
                          </div>
                          <p className={`font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] ${
                            myTeam?.isEliminated ? 'text-red-600' :
                            myTeam?.gameStatus === 'completed' ? 'text-green-600' :
                            'text-yellow-600'
                          }`}>
                            {myTeam?.isEliminated ? 'Eliminated' :
                             myTeam?.gameStatus === 'completed' ? 'Completed' :
                             'Active'}
                          </p>
                        </div> */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={trophy} alt="score" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Total Score
                            </p>
                          </div>
                                                    <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            {totalProjectScore}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Room Info */}
                                    <div className="flex justify-end mt-auto">
                    <div>
                      <p className="font-roboto lg:text-[12px] md:text-[14px] text-[11px] text-black-500">
                        Room Code: {roomCode || lobbyCode || '-'}
                      </p>
                      <p className="font-roboto lg:text-[12px] md:text-[14px] text-[11px] text-black-500 mt-1">
                        City: {myTeam?.citySlot || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* ✅ Room Rankings Section */}

              {rankings.length > 1 && (
                <div className="bg-white rounded-lg shadow-lg p-3 border-2 border-[#A99065] lg:col-span-7 min-h-0 flex flex-col">
                  <h2 className="text-lg font-bold text-[#4f2d14] mb-2 text-center flex-shrink-0">

                  🏆 Final Rankings
                </h2>
                                  <div className="overflow-auto min-h-0">
                    <table className="w-full text-xs lg:text-sm">

                    <thead>
                      <tr className="bg-[#f5efe2]">
                                                <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Rank</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">City</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Team Name</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Score</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Budget</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Health</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-[#4f2d14]">Status</th>

                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((team, index) => {
                        const isMyTeam = team.teamId === myTeam?.teamId;
                        return (
                          <tr 
                            key={team.teamId} 
                            className={`border-t ${isMyTeam ? 'bg-yellow-50' : ''} ${index === 0 ? 'border-green-400' : ''}`}
                          >
                                                        <td className="px-2 py-1.5 font-bold whitespace-nowrap">

                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </td>
                                                        <td className={`px-2 py-1.5 whitespace-nowrap ${isMyTeam ? 'font-bold text-[#33552C]' : ''}`}>

                              City {team.citySlot || index + 1}
                              {isMyTeam && ' 👈 You'}
                            </td>
                                                        <td className={`px-2 py-1.5 ${isMyTeam ? 'font-bold' : ''}`}>

                              {team.teamName || `Team ${index + 1}`}
                            </td>
                                                        <td className={`px-2 py-1.5 font-bold text-[#50704C] ${isMyTeam ? 'text-[#33552C]' : ''}`}>

                              {team.totalProjectScore || 0}
                            </td>
                                                        <td className="px-2 py-1.5 whitespace-nowrap">${(team.budget || 0).toFixed(0)}</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">{(team.cityHealth || 0).toFixed(1)}%</td>
                            <td className="px-2 py-1.5 whitespace-nowrap">

                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${

                                                                team.gameStatus === 'eliminated' ? 'bg-red-100 text-red-700' :
                                team.gameStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                                                {team.gameStatus === 'eliminated' ? '💀 Eliminated' :
                                 team.gameStatus === 'completed' ? '✅ Completed' :
                                 '▶️ Active'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>

            {/* Buttons */}
                        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">

                            <div className="flex gap-3">

                <button
                  onClick={handleStartNewGame}
                                    className="flex justify-center items-center gap-4 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"

                  style={{ boxShadow: '0 3px 7px #AD8E53' }}
                >
                                    <p className="text-[#6D924B] font-bold lg:text-[16px] text-[16px] font-roboto whitespace-nowrap">

                    Start New Game
                  </p>
                                    <div className="bg-[#C0D066] w-[28px] h-[28px] flex justify-center items-center rounded-[50%]">

                    <Image src={sideArrow} alt="sideArrow" />
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                                    className="flex justify-center items-center gap-4 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"

                  style={{ boxShadow: '0 3px 7px #AD8E53' }}
                >
                                    <p className="text-[#6D924B] font-bold lg:text-[16px] text-[16px] font-roboto whitespace-nowrap">
Log out</p>
                                    <div className="bg-[#C0D066] w-[28px] h-[28px] flex justify-center items-center rounded-[50%]">

                    <Image src={sideArrow} alt="sideArrow" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}