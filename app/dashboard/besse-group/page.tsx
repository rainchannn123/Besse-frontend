'use client';

import CustomHeader from '@/components/layout/header/customheader/CustomHeader';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import woodenHeading from '@/public/assets/images/woodenHeading.png';
import { authService } from '@/services/authService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { secureStorage } from '@/utils/secureStorage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JoinGroupPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const handleJoinCity = async () => {
    if (!code.trim()) {
      addNotification({
        message: 'Please enter a code',
        type: 'error',
      });
      return;
    }

    if (code.length !== 6) {
      addNotification({
        message: 'Code must be 6 digits',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await lobbyService.joinLobby({
        lobbyCode: code.trim(),
      });

      if (response.success) {
        addNotification({
          message: 'Successfully joined the city!',
          type: 'success',
        });

        const response1 = await authService.getProfile();
        if (response1.success && response1.data) {
          const user = response1.data.user;
          updateUser(user);
          router.push('/dashboard/team-members');
        } else {
          addNotification({
            message: 'Failed to update profile. Please refresh the page.',
            type: 'error',
          });
        }
      } else {
        addNotification({
          message: response.message || 'Failed to join city',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Join lobby error:', error);

      let errorMessage = 'Failed to join city. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'City not found. Please check the code.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid code format.';
      } else if (error.response?.status === 403) {
        errorMessage = "City is full or you don't have permission to join.";
      } else if (error.response?.status === 409) {
        errorMessage = "You're already in a city. Leave current city first.";
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      addNotification({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async () => {
    router.push('/dashboard/game-mode');
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
          title="Join a Group"
          subtitle="Enter your leader code to join their city"
        />

        <div className="space-y-6 bg-cover bg-center sm:mx-0 mx-2">
          <div className="flex justify-center pt-20 items-center">
            <div className="w-full max-w-2xl">
              <input
                type="text"
                placeholder="Enter Code"
                value={code}
                onChange={(e) => {
                  // Allow only alphanumeric input
                  const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                  setCode(value);
                }}
                maxLength={6}
                className="font-roboto w-full text-center text-[30px] p-4 placeholder:text-[#33552C] placeholder:text-[30px] font-normal focus:outline-none focus:ring-0 lg:w-[682px] flex items-center h-20 border-2 borderColor bg-[#F8F0DD]"
              />

              <div className="lg:flex block gap-4 pt-6">
                <button
                  onClick={handleJoinCity}
                  disabled={loading}
                  className={`w-full font-roboto flex-1 py-4 border-2 border-[#000000] bg-[#50704C] lg:text-[30px] md:text-[30px] text-[20px] font-bold text-white shadow-lg transition duration-300 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  {loading ? 'Processing...' : 'Join City'}
                </button>

                <button
                  onClick={handleCreateCity}
                  disabled={loading}
                  className={`lg:mt-0 mt-3 w-full font-roboto flex-1 py-4 border-2 border-[#000000] lg:text-[30px] md:text-[30px] text-[20px] text-[#33552C] font-bold bg-white transition duration-300 shadow-md hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed ${
                    loading ? 'opacity-70' : ''
                  }`}
                >
                  {loading ? 'Creating...' : 'Create City'}
                </button>
              </div>
            </div>
          </div>
          <p className="font-roboto text-center md:text-[20px] text-[16px] font-normal py-8 blackTextColor">
            Want to Create your own City?
            <button
              onClick={handleCreateCity}
              className="font-roboto font-bold ml-1 underline-none hover:text-[#33552C] focus:outline-none"
            >
              Become a Leader
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
