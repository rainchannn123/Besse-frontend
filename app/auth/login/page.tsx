'use client';

import CustomInput from '@/customHooks/component/customInput/CustomInput';
import { WelcomeBesse } from '@/customHooks/component/welcomeBesse/WelcomeBesse';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import { lobbyService } from '@/services/lobbyService';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { handleSubmit, control } = useForm<FormData>();

  const { login, isAuthenticated, user, initializeAuth } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Initialize auth and check if user is already logged in
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const getLobbyState = async (sessionId: string) => {
    let response = await lobbyService.getLobbyState(sessionId);
    console.log('Lobby State Response:', response);
    if (
      response.data?.lobbyState.status === 'ready' ||
      response.data?.lobbyState.status === 'waiting'
    ) {
      router.push('/dashboard/team-members');
    } else {
      const userRole = response.data?.lobbyState.players.find(
        (player: any) => player.userId === user?._id
      )?.selectedRole;
      console.log(
        'User role:',
        userRole,
        'lobbyState:',
        response.data?.lobbyState.players,
        'user:',
        (user as any)._id
      );
      if (userRole === 'broker') {
        router.push('/dashboard/broker-inventory');
      } else if (userRole === 'mrf') {
        router.push('/dashboard/mrf-collection');
      } else {
        router.push('/dashboard/municipality');
      }
    }
  };

  // Redirect if already authenticated
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
    if (!agreeTerms) {
      addNotification({
        message: 'Please agree to the Terms and Conditions',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      await login({
        email: data.email || data.name,
        password: data.password,
      });

      // addNotification({
      //   message: 'Login successful! Redirecting...',
      //   type: 'success',
      // });
    } catch (error: any) {
      console.error('Login error:', error);

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
    <div className="h-full ">
      <div className="container mx-auto h-full">
        <main className={`flex items-center justify-center lg:p-0 p-4 h-full`}>
          <div>
            <WelcomeBesse></WelcomeBesse>
            <div
              className="bg-cover bg-center pt-14  xl:w-[1289px]  lg:w-[1000px] md:w-[800px]  sm:w-[600px] w-full  mx-auto rounded-[20px] sm:px-0 px-8 sm:mx-0 "
              style={{
                backgroundImage: `url(${woodenBg.src})`,
              }}
            >
              <div className="flex justify-center items-center h-full">
                <div>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <CustomInput
                        name="name"
                        control={control}
                        label="Email"
                        placeholder="johnjacob@mail.com"
                        // rules={{ required: "Name is required" }}
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <CustomInput
                          name="password"
                          control={control}
                          label="Password"
                          placeholder="********"
                          type="password"
                        />
                      </div>
                    </div>
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

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-16 w-full lg:w-[682px] py-3 flex justify-center items-center font-bold  px-4 border border-[#000000] shadow-md md:text-[30px] text-[24px]  text-white buttonColor focus:outline-none focus:ring-0 focus:ring-offset-0\ focus:ring-green-500 transition duration-150 ease-in-out ${
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

                  <div className="mt-4 text-center mb-10">
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
          </div>
        </main>
      </div>
    </div>
  );
}
