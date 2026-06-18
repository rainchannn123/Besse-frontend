'use client';

import { useGameWebSocket } from '@/hooks/useWebSocket';
import blueNote from '@/public/assets/images/blueNote.png';
import cross from '@/public/assets/images/cross.png';
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
import { GameState } from '@/types/besse';
import { secureStorage } from '@/utils/secureStorage';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function page() {
  const { user, logout, updateUser } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameCompleteResults, setGameCompleteResults] = useState<any>(null);
  const [pairDetails, setPairDetails] = useState<any>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);

  // Use WebSocket for real-time updates
  const { subscribe, joinGame, leaveGame } = useGameWebSocket(user?.currentSession || undefined);

  const fetchGameState = async () => {
    if (!user?.currentSession) {
      console.error({
        message: 'No active session found',
        type: 'error',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await gameService.getGameState(user.currentSession);
      if (response.success && response.data) {
        setGameState(response.data.gameState);
        // Fetch lobby code for room code display
        fetchLobbyCode(user.currentSession!);
        // Fetch pair details if game has pairId
        if (response.data.gameState.pairId) {
          fetchPairDetails(response.data.gameState.pairId);
        }
      } else {
        console.error({
          message: response.message || 'Failed to fetch game state',
          type: 'error',
        });
      }
    } catch (err: any) {
      console.error({
        message: err.message || 'Failed to fetch game state',
        type: 'error',
      });
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
      console.error('Failed to fetch lobby code:', err);
    }
  };

  const fetchPairDetails = async (pairId: string) => {
    try {
      const response = await gameService.getPairDetails(pairId);
      if (response.success && response.data) {
        // console.log('Pair Details:', response.data);
        setPairDetails(response.data.pairDetails);
      }
    } catch (err: any) {
      console.error('Failed to fetch pair details:', err);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, [user?.currentSession]);

  // Join game session for real-time updates
  useEffect(() => {
    if (user?.currentSession) {
      joinGame(user.currentSession);
    }
  }, [user?.currentSession, joinGame]);

  // Subscribe to game-complete and pair-score-updated events
  useEffect(() => {
    if (!user?.currentSession) return;

    const unsubGameComplete = subscribe('game-complete', (data: any) => {
      setGameCompleteResults(data);
      // Refresh game state to get latest data
      fetchGameState();
    });

    const unsubPairScoreUpdated = subscribe('pair-score-updated', (data: any) => {
      // Refresh pair details when pair score is updated
      if (gameState?.pairId) {
        fetchPairDetails(gameState.pairId);
      }
    });

    return () => {
      unsubGameComplete && unsubGameComplete();
      unsubPairScoreUpdated && unsubPairScoreUpdated();
    };
  }, [user?.currentSession, subscribe, gameState?.pairId]);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleStartNewGame = async () => {
    if (!user) return;

    const activeSessionId = user.currentSession;

    try {
      // Exit only this player from the finished lobby so each player can decide independently.
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

      // Route to create/join game page
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

  const getGameStatus = () => {
    if (gameState?.gameStatus === 'complete') {
      return {
        title: 'Congratulations! You Survive!',

        isWin: true,
      };
    }
    const isWin = gameState?.gameStatus === 'won';
    return {
      title: isWin ? 'Congratulations! You Won!' : 'You Lost',
      subtitle: '',
      isWin,
    };
  };

  const gameStatus = getGameStatus();

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bgColor lg:overflow-hidden">
      <div className="container mx-auto flex-1 lg:min-h-0 flex flex-col lg:overflow-hidden">
        <main className="lg:p-4 p-0 flex-1 lg:min-h-0 flex flex-col lg:overflow-y-auto">
          <div className="flex flex-col flex-1">
            <div className="lg:mb-3 lg:mt-3 mb-8 mt-8 flex justify-center flex-shrink-0">
              <h1 className="lg:text-[36px] md:text-[30px] text-[20px] font-bold py-1 md:px-16 px-4 m-0 border-6 border-dashed border-[#A99065] text-[#7C4E2A] bg-white rounded-lg tracking-wider">
                {gameStatus.title}
              </h1>
            </div>
            {gameStatus.subtitle && (
              <div className="mb-4 flex justify-center flex-shrink-0">
                <h2 className="lg:text-[30px] md:text-[24px] text-[18px] font-semibold text-white">
                  {gameStatus.subtitle}
                </h2>
              </div>
            )}
            <div
              className="bg-cover bg-center lg:p-8 md:p-20 p-6 w-full mx-auto rounded-[20px] flex-1 lg:min-h-0"
              style={{
                backgroundImage: `url(${woodenBg.src})`,
              }}
            >
              <div className="flex justify-center items-center h-full relative">
                <div>
                  {' '}
                  <div className="flex justify-center absolute left-44 -top-11 hidden lg:flex">
                    <div className="bg-[rgba(167,127,70,0.7)] h-[81px] w-[47px]"></div>
                  </div>
                  <div className="flex justify-center absolute right-44 -top-11 hidden lg:flex">
                    <div className="bg-[rgba(167,127,70,0.7)] h-[81px] w-[47px]"></div>
                  </div>
                </div>

                <div className="bg-white h-full w-full lg:p-6 md:p-18 sm:p-10 p-6 flex flex-col">
                  <div className="rounded-[10px]">
                    <div className="flex gap-8 justify-center border-b border-gray-300 lg:py-1 py-2">
                      <p className="flex items-center font-bold font-roboto lg:text-[22px] md:text-[28px] text-[22px] text-black">
                        Game Summary
                      </p>
                    </div>
                    <div className="lg:px-3 lg:py-2 px-4 py-4">
                      <div className="lg:px-4 lg:py-2 px-6 py-4 lg:space-y-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 items-center">
                            <Image src={dollar} alt="dollar" width={28} height={28} className="lg:w-5 lg:h-5 w-7 h-7 object-contain" />
                            <p className="font-bold font-roboto lg:text-[18px] md:text-[25px] text-[15px] text-black">
                              Cash
                            </p>
                          </div>
                          <p className="font-bold font-roboto lg:text-[22px] md:text-[25px] text-[15px] text-black">
                            ${(gameState?.budget || 0).toFixed(2)}
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
                            {(gameState?.totalCO2 || 0).toFixed(2)}
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
                            {(gameState?.cityHealth || 0).toFixed(2)}
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
                            {gameState?.totalTransportTrips || 0}
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
                            {gameState?.cityProjects?.filter(p => p.completed).length || 0} / {gameState?.cityProjects?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-auto">
                    <div>
                      <p className="font-roboto lg:text-[14px] md:text-[18px] text-[12px] text-black-500">
                        Room Code: {lobbyCode || '-'}
                      </p>
                      <p className="font-roboto lg:text-[14px] md:text-[18px] text-[12px] text-black-500 mt-1">
                        Course Code: SEE1003
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:pb-2 lg:pt-3 pb-3 pt-6 flex-shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={handleStartNewGame}
                  className="flex justify-center items-center gap-10 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"
                  style={{ boxShadow: '0 3px 7px #AD8E53' }}
                >
                  <p className="text-[#6D924B] font-bold lg:text-[20px] text-[27px] font-roboto">
                    Start New Game
                  </p>
                  <div className="bg-[#C0D066] lg:w-[32px] lg:h-[32px] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                    <Image src={sideArrow} alt="sideArrow" />
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex justify-center items-center gap-10 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"
                  style={{ boxShadow: '0 3px 7px #AD8E53' }}
                >
                  <p className="text-[#6D924B] font-bold lg:text-[20px] text-[27px] font-roboto">Log out</p>
                  <div className="bg-[#C0D066] lg:w-[32px] lg:h-[32px] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
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
