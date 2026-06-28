'use client';

import CustomInput from '@/customHooks/component/customInput/CustomInput';
import { WelcomeBesse } from '@/customHooks/component/welcomeBesse/WelcomeBesse';
import loginBackground from '@/public/assets/images/login-background.png';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import { adminService } from '@/services/adminService';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { getLobbyRoute } from '@/utils/lobbyStage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function Page() {
  const router = useRouter();
  // Temporarily disabled for the new login page flow.
  // const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleSubmit, control } = useForm<FormData>();

  const { login, isAuthenticated, user, initializeAuth } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const getLobbyState = async (sessionId: string) => {
    try {
      const response = await lobbyService.getLobbyState(sessionId);

      if (response.data?.lobbyState) {
        router.push(getLobbyRoute(response.data.lobbyState, user?._id));
      }
    } catch {
      router.push('/dashboard/besse-group');
    }
  };

  useEffect(() => {
    const redirectUser = async () => {
      if (isAuthenticated && !user?.currentSession) {
        router.push('/dashboard/besse-group');
      } else if (isAuthenticated && user?.currentSession) {
        await getLobbyState(user.currentSession);
      }
    };
    redirectUser();
  }, [isAuthenticated, user, router]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Temporarily disabled for the new login page flow.
    // if (!agreeTerms) {
    //   addNotification({
    //     message: 'Please agree to the Terms and Conditions',
    //     type: 'error',
    //   });
    //   return;
    // }

    setLoading(true);

    try {
      const identity = (data.email || data.name || '').trim();

      // ✅ Try admin login first (admin username is 'admin')
      try {
        console.log('🔐 Attempting admin login with:', identity);
        const adminResponse = await adminService.login(identity, data.password);
        
        if (adminResponse.success) {
          // addNotification({
          //   message: 'Admin monitor access granted',
          //   type: 'success',
          // });
          router.push('/admin');
          return;
        }
      } catch (adminError: any) {
        // If it's a 400, the user is not admin - continue to regular login
        if (adminError.response?.status === 400) {
          console.log('Not admin, trying regular login...');
        } else {
          console.log('Admin login failed:', adminError.message);
        }
        // Fall through to standard player login
      }

      // ✅ Regular user login
      console.log('👤 Attempting regular login with:', identity);
      await login({
        email: identity,
        password: data.password,
      });
      
      console.log('✅ Regular login successful!');

    } catch (error: any) {
      console.error('❌ Login error:', error);

      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid input data';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message === 'Invalid credentials') {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('email')) {
        errorMessage = 'Invalid email address';
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

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground.src})` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(22,46,34,0.38),rgba(0,0,0,0.72)_48%,rgba(0,0,0,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(62,107,84,0.12)_0%,rgba(0,0,0,0)_45%,rgba(158,215,180,0.08)_100%)]" />
      <div className="relative z-10 container mx-auto min-h-screen">
        <main className={`flex items-center justify-center p-4 md:p-8 min-h-screen`}>
          <div className="w-full max-w-[1080px]">
            <WelcomeBesse></WelcomeBesse>

              <div className="flex justify-center items-center h-full">
                <div className="relative w-full max-w-[780px] rounded-3xl border border-emerald-100/20 bg-[#1a281f]/72 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.58)] px-6 py-8 md:px-12 md:py-12 overflow-hidden">
                  <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-emerald-300/15 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-28 -right-24 h-64 w-64 rounded-full bg-lime-200/10 blur-3xl" />

                  <div className="relative z-10 mb-8 md:mb-10 text-center">
                    <h2 className="mt-2 text-white text-2xl md:text-4xl font-extrabold">
                      Login to Start Your Game
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-7 w-full min-w-0">
                    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 md:px-5 md:py-4 overflow-hidden">
                      <CustomInput
                        name="name"
                        control={control}
                        label="Email"
                      />
                    </div>

                    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 md:px-5 md:py-4 overflow-hidden">
                      <div className="relative w-full min-w-0">
                        <CustomInput
                          name="password"
                          control={control}
                          label="Password"
                          type="password"
                        />
                      </div>
                    </div>
                    {/*
                    <div className="flex items-center">
                      <input
                        id="agreeTerms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="h-5 w-5 pb-[18px] text-sm border-2  border-[#33552C] bg-transparent rounded-none focus:ring-2 focus:ring-[#33552C] appearance-none  checked:bg-[#33552C] checked:border-[#33552C]  checked:after:content-['✔'] checked:after:text-white checked:after:block68 checked:after:text-center"
                      />
                      <label
                        htmlFor="agreeTerms"
                        className="ml-2 block md:text-[20px] text-[13px] font-medium  greenTextColor"
                      >
                        I agree to the Terms and Conditions
                      </label>
                    </div>
                    */}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-10 w-full py-3.5 md:py-4 flex justify-center items-center font-extrabold px-4 border border-emerald-100/25 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.35)] md:text-[30px] text-[22px] text-white bg-gradient-to-r from-[#3f7b5d] via-[#3a6f55] to-[#2f5644] hover:from-[#4a8a69] hover:via-[#437f61] hover:to-[#396851] focus:outline-none focus:ring-2 focus:ring-[#b8e7cb] focus:ring-offset-0 transition-all duration-200 ease-in-out active:scale-[0.99] ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <p>Logging In...</p>
                        </>
                      ) : (
                        'Login'
                      )}
                    </button>

                  </form>

                  {/* Register link - HIDDEN with CSS but code remains intact */}
                  <div className="hidden mt-4 text-center mb-10">
                    <span className="greenTextColor font-regular md:text-[20px] text-[16px]">
                      Don't have an account?
                    </span>
                    <Link
                      href="/auth/register"
                      className="font-bold ml-1 greenTextColor md:text-[20px] text-[14px] hover:underline"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}