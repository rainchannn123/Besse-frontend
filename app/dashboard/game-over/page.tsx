'use client';

import { useGameWebSocket } from '@/hooks/useWebSocket';
import blueNote from '@/public/assets/images/blueNote.png';
import cross from '@/public/assets/images/cross.png';
import dollar from '@/public/assets/images/dollar.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
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
  const [lobbyState, setLobbyState] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Use WebSocket for real-time updates
  const { subscribe, joinGame } = useGameWebSocket(user?.currentSession || undefined);

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

  const fetchPairDetails = async (pairId: string) => {
    try {
      const response = await gameService.getPairDetails(pairId);
      if (response.success && response.data) {
        console.log('Pair Details:', response.data);
        setPairDetails(response.data.pairDetails);
      }
    } catch (err: any) {
      console.error('Failed to fetch pair details:', err);
    }
  };

  const fetchLobbyState = async (sessionId: string) => {
    try {
      const response = await lobbyService.getLobbyState(sessionId);
      if (response.success && response.data) {
        setLobbyState(response.data.lobbyState);
        setIsOwner(response.data.lobbyState.leader === user?._id);
      }
    } catch (err: any) {
      console.error('Failed to fetch lobby state:', err);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, [user?.currentSession]);

  useEffect(() => {
    if (user?.currentSession) {
      fetchLobbyState(user.currentSession);
    }
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
    if (!user?.currentSession) return;
    try {
      const response = await lobbyService.startNewGame(user.currentSession);
      if (response.success) {
        // Clear game-related local storage
        secureStorage.removeItem('pairing_session_id');
        secureStorage.removeItem('current_game_session');
        secureStorage.removeItem('init_state');

        // Update user's current session to new session
        const updatedUser = { ...user, currentSession: response.data.lobby.sessionId };
        updateUser(updatedUser);

        router.push('/dashboard/team-members');
      } else {
        console.error({
          message: response.message || 'Failed to start new game',
          type: 'error',
        });
      }
    } catch (err: any) {
      console.error({
        message: err.message || 'Failed to start new game',
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
        title: 'Game Complete!',

        isWin: true,
      };
    }
    const isWin = gameState?.gameStatus === 'won';
    return {
      title: isWin ? 'Congratulations! You Won!' : 'You are bankrupt!',
      subtitle: '',
      isWin,
    };
  };

  const gameStatus = getGameStatus();

  return (
    <div className="min-h-screen flex flex-col bgColor h-full">
      <div className="container mx-auto">
        <main className={` lg:p-4 p-0  `}>
          <div>
            <div className="mb-8 mt-8 flex justify-center">
              <h1 className="lg:text-[45px] md:text-[30px] text-[20px] font-bold py-1 md:px-16 px-4 m-0 border-6 border-dashed border-[#A99065] text-[#7C4E2A] bg-white rounded-lg tracking-wider">
                {gameStatus.title}
              </h1>
            </div>
            {gameStatus.subtitle && (
              <div className="mb-4 flex justify-center">
                <h2 className="lg:text-[30px] md:text-[24px] text-[18px] font-semibold text-white">
                  {gameStatus.subtitle}
                </h2>
              </div>
            )}
            <div
              className="bg-cover bg-center md:p-20 p-6   w-full   mx-auto rounded-[20px] "
              style={{
                backgroundImage: `url(${woodenBg.src})`,
              }}
            >
              <div className="flex justify-center items-center h-full relative">
                <div>
                  {' '}
                  <div className="flex justify-center absolute  left-44 -top-11">
                    <div className="bg-[rgba(167,127,70,0.7)] h-[81px] w-[47px]  "></div>
                  </div>
                  <div className="flex justify-center absolute  right-44 -top-11">
                    <div className="bg-[rgba(167,127,70,0.7)] h-[81px] w-[47px]  "></div>
                  </div>
                </div>

                <div className="bg-white h-full w-full md:p-18 sm:p-10 p-6">
                  <div className="border border-black rounded-[10px]">
                    <div className="flex gap-8 justify-center border-b border-black py-2">
                      <Image src={blueNote} alt="blueNote" />
                      <p className="flex items-center  font-bold font-roboto md:text-[28px] text-[22px] text-black ">
                        Outcome
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 grid-cols-1 ">
                      <div className="px-4  py-4">
                        <h4 className="font-roboto font-bold md:text-[28px] text-[22px] text-black">
                          Your Metric
                        </h4>
                        <div className="px-6 py-4">
                          <div className="flex gap-3 pb-4">
                            <div className="flex items-center">
                              <Image src={dollar} alt="dollar" />
                            </div>
                            <p className="flex items-center  font-bold font-roboto md:text-[25px]  text-[20px] text-black ">
                              Cash
                            </p>
                          </div>
                          <div className="flex gap-3 pb-4">
                            <div className="flex items-center">
                              <Image src={cross} alt="cross" />
                            </div>
                            <p className="flex items-center  font-bold font-roboto md:text-[25px]  text-[20px] text-black ">
                              CO2
                            </p>
                          </div>
                          <div className="flex gap-3 pb-4">
                            <div className="flex items-center">
                              <Image src={cross} alt="cross" />
                            </div>
                            <p className="flex items-center  font-bold font-roboto md:text-[25px]  text-[20px] text-black ">
                              Health
                            </p>
                          </div>
                          <div className="flex gap-3 pb-4">
                            <div className="flex items-center">
                              <Image src={cross} alt="cross" />
                            </div>
                            <p className="flex items-center  font-bold font-roboto md:text-[25px]  text-[20px] text-black ">
                              Trips
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-4 md:px-0 px-6">
                        <h4 className="font-roboto font-bold md:text-[28px] text-[22px] text-black">
                          Result
                        </h4>
                        <div className="py-4">
                          <p className="flex items-center  font-bold font-roboto lg:text-[36px] md:text-[28px] text-[20px] text-black m-0 ">
                            ${(gameState?.budget || 0).toFixed(2)}
                          </p>
                          <p className="flex items-center  font-bold font-roboto lg:text-[36px] md:text-[28px] text-[20px] text-black  m-0">
                            {(gameState?.totalCO2 || 0).toFixed(2)}
                          </p>
                          <p className="flex items-center  font-bold font-roboto lg:text-[36px] md:text-[28px] text-[20px] text-black  m-0">
                            {(gameState?.cityHealth || 0).toFixed(2)}%
                          </p>
                          <p className="flex items-center  font-bold font-roboto lg:text-[36px] md:text-[28px] text-[20px] text-black m-0 ">
                            {gameState?.totalTransportTrips || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pair Results Section - Only show for complete games */}
                    {(gameCompleteResults || pairDetails) && (
                      <div className="mt-6">
                        <div className="flex gap-8 justify-center border-b border-black py-2">
                          <Image src={blueNote} alt="blueNote" />
                          <p className="flex items-center font-bold font-roboto md:text-[28px] text-[22px] text-black">
                            Pair Results
                          </p>
                        </div>

                        {/* Pair Data Table */}
                        {pairDetails && (
                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full border-collapse border border-black">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border border-black px-4 py-2 text-left font-bold font-roboto md:text-[18px] text-[14px] text-black">
                                    Metric
                                  </th>
                                  <th className="border border-black px-4 py-2 text-center font-bold font-roboto md:text-[18px] text-[14px] text-black">
                                    Team A
                                  </th>
                                  <th className="border border-black px-4 py-2 text-center font-bold font-roboto md:text-[18px] text-[14px] text-black">
                                    Team B
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    Session ID
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamASessionId}
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamBSessionId}
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    Health
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamAHealth?.toFixed(1) || 'N/A'}%
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamBHealth?.toFixed(1) || 'N/A'}%
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    Budget
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    ${pairDetails.teamABudget.toFixed(0)}
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    ${pairDetails.teamBBudget.toFixed(0)}
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    CO2 Emissions
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamACO2.toFixed(1)} tons
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamBCO2.toFixed(1)} tons
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    Game Status
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamAGameStatus}
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamBGameStatus}
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="border border-black px-4 py-2 font-medium font-roboto md:text-[16px] text-[12px] text-black">
                                    Pair Status
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamAPairStatus}
                                  </td>
                                  <td className="border border-black px-4 py-2 text-center font-roboto md:text-[16px] text-[12px] text-black">
                                    {pairDetails.teamBPairStatus}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Fallback to old format if no detailed pair data */}
                        {!pairDetails && gameCompleteResults && (
                          <div className="grid sm:grid-cols-2 grid-cols-1 mt-4">
                            <div className="px-4 py-4">
                              <h4 className="font-roboto font-bold md:text-[24px] text-[20px] text-black">
                                Team A
                              </h4>
                              <div className="px-6 py-4 space-y-2">
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  Health: {gameCompleteResults.teamAHealth?.toFixed(1) || 'N/A'}%
                                </p>
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  Budget: ${gameCompleteResults.teamABudget?.toFixed(0) || 'N/A'}
                                </p>
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  CO2: {gameCompleteResults.teamACO2?.toFixed(1) || 'N/A'} tons
                                </p>
                              </div>
                            </div>
                            <div className="px-4 py-4">
                              <h4 className="font-roboto font-bold md:text-[24px] text-[20px] text-black">
                                Team B
                              </h4>
                              <div className="px-6 py-4 space-y-2">
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  Health: {gameCompleteResults.teamBHealth?.toFixed(1) || 'N/A'}%
                                </p>
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  Budget: ${gameCompleteResults.teamBBudget?.toFixed(0) || 'N/A'}
                                </p>
                                <p className="font-bold font-roboto md:text-[20px] text-[16px] text-black">
                                  CO2: {gameCompleteResults.teamBCO2?.toFixed(1) || 'N/A'} tons
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="px-4 py-4 text-center border-t border-black">
                          <p className="font-bold font-roboto md:text-[24px] text-[20px] text-black">
                            Final Pair Score:{' '}
                            {(
                              pairDetails?.averagePairHealth ??
                              gameCompleteResults?.pairAverageHealth
                            )?.toFixed(1) || 'N/A'}
                            %
                          </p>
                          {pairDetails && (
                            <p className="font-medium font-roboto md:text-[18px] text-[14px] text-gray-600 mt-2">
                              Overall Status: {pairDetails.status}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pb-3 pt-6">
              {isOwner ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleStartNewGame}
                    className="flex justify-center items-center gap-10 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"
                    style={{ boxShadow: '0 3px 7px #AD8E53' }}
                  >
                    <p className="text-[#6D924B] font-bold text-[27px] font-roboto">
                      Start New Game
                    </p>
                    <div className="bg-[#C0D066] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                      <Image src={sideArrow} alt="sideArrow" />
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex justify-center items-center gap-10 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"
                    style={{ boxShadow: '0 3px 7px #AD8E53' }}
                  >
                    <p className="text-[#6D924B] font-bold text-[27px] font-roboto">Log out</p>
                    <div className="bg-[#C0D066] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                      <Image src={sideArrow} alt="sideArrow" />
                    </div>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex justify-center items-center gap-10 bg-[#FFFFFF] px-3 py-2 rounded-[5px]"
                  style={{ boxShadow: '0 3px 7px #AD8E53' }}
                >
                  <p className="text-[#6D924B] font-bold text-[27px] font-roboto">Log out</p>
                  <div className="bg-[#C0D066] w-[38px] h-[38px] flex justify-center items-center rounded-[50%]">
                    <Image src={sideArrow} alt="sideArrow" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
