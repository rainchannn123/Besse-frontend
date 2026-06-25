'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { authService } from '@/services/authService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GameModeSelectionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const handleSelectMode = async (mode: 'waste' | 'energy') => {
    if (mode === 'energy') return; // Energy mode is disabled

    setLoading(true);

    try {
      const response = await lobbyService.createLobby(mode);

      if (response.success) {
        addNotification({
          message: 'City created successfully!',
          type: 'success',
        });

        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          updateUser(profileResponse.data.user);
          localStorage.setItem('game_mode', mode);
          router.push('/dashboard/team-members');
        } else {
          addNotification({
            message: 'Failed to update profile. Please refresh the page.',
            type: 'error',
          });
        }
      } else {
        addNotification({
          message: response.message || 'Failed to create city',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Create lobby error:', error);
      addNotification({
        message:
          error.response?.data?.message ||
          'Failed to create city. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bgColor">
      <div
        className="bg-cover bg-center w-[1200] mx-auto rounded-[20px]"
        style={{
          backgroundImage: `url(${woodenBg.src})`,
        }}
      >
        <CustomHeader
          backgroundImage={woodenHeading.src}
          title="Select Game Mode"
          subtitle="Choose a game mode to play"
        />

        <div className="flex flex-col items-center justify-center py-16 px-4 gap-8">
          <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center">
            {/* Waste Mode Button */}
            <button
              onClick={() => handleSelectMode('waste')}
              disabled={loading}
              className="flex-1 py-10 px-6 border-2 border-[#000000] bg-[#50704C] text-white font-roboto font-bold text-[28px] md:text-[32px] rounded-[10px] shadow-lg transition duration-300 hover:shadow-xl hover:brightness-110 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : '♻️ Waste'}
            </button>

            {/* Energy Mode Button (Disabled) */}
            <button
              disabled
              className="flex-1 py-10 px-6 border-2 border-[#999] bg-[#d5d5d5] text-[#888] font-roboto font-bold text-[28px] md:text-[32px] rounded-[10px] shadow-md cursor-not-allowed relative"
            >
              ⚡ Energy
              <span className="block text-[14px] md:text-[16px] font-medium mt-2 text-[#aaa]">
                (Coming Soon)
              </span>
            </button>
          </div>

          <button
            onClick={() => router.push('/dashboard/besse-group')}
            disabled={loading}
            className="font-roboto text-[18px] text-[#33552C] font-bold underline hover:text-[#50704C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
