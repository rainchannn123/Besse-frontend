'use client';

import CustomInput from '@/customHooks/component/customInput/CustomInput';
import { WelcomeBesse } from '@/customHooks/component/welcomeBesse/WelcomeBesse';
import woodenBg from '@/public/assets/images/wooden_bg.png';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

type FormData = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const { handleSubmit, control } = useForm<FormData>();

  const { register, isAuthenticated } = useAuthStore();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!agreeTerms) {
      setMessage('Please agree to the Terms and Conditions');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Call register API
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Show success message
      // setMessage('Registration successful! Redirecting...');

      // Navigate to /dashboard/besse-group after successful registration
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bgColor min-h-screen ">
      <div className="container mx-auto">
        <main className={`flex items-center justify-center lg:p-0 p-4`}>
          <div className="mt-4">
            <WelcomeBesse />
            <div
              className="bg-cover bg-center pt-8 xl:w-[1289px] lg:w-[1000px] md:w-[800px] sm:w-[600px] w-full h-[660px] mx-auto rounded-[20px] md:px-8 px-4"
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
                        label="Name"
                        rules={{
                          required: 'Name is required',
                          minLength: {
                            value: 2,
                            message: 'Name must be at least 2 characters',
                          },
                        }}
                      />
                    </div>

                    <div>
                      <CustomInput
                        name="email"
                        control={control}
                        label="Email"
                        rules={{
                          required: 'Email is required',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Invalid email address',
                          },
                        }}
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <CustomInput
                          name="password"
                          control={control}
                          label="Password"
                          type="password"
                          rules={{
                            required: 'Password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters',
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="agreeTerms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (message.includes('Terms')) {
                            setMessage('');
                          }
                        }}
                        className="h-5 w-5 pb-[18px] text-sm border-2 border-[#33552C] bg-transparent rounded-none focus:ring-0 focus:ring-none appearance-none checked:bg-[#33552C] checked:border-[#33552C] checked:after:content-['✔'] checked:after:text-white checked:after:block checked:after:text-center"
                      />
                      <label
                        htmlFor="agreeTerms"
                        className="ml-2 block md:text-[20px] text-[13px] font-medium greenTextColor"
                      >
                        I agree to the Terms and Conditions
                      </label>
                    </div>

                    {message && (
                      <div
                        className={`p-3 text-center rounded-lg text-sm ${
                          message.includes('success')
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-10 w-full lg:w-[682px] py-3 flex justify-center items-center font-bold px-4 border border-[#000000] shadow-md md:text-[30px] text-[24px] text-white buttonColor focus:outline-none focus:ring-0 focus:ring-offset-0 focus:ring-green-500 transition duration-150 ease-in-out ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <p>Registering...</p>
                        </>
                      ) : (
                        'Register'
                      )}
                    </button>
                  </form>

                  <div className="mt-4 text-center text-sm">
                    <span className="greenTextColor font-regular md:text-[20px] text-[16px]">
                      Already have an account?
                    </span>
                    <Link
                      href="/auth/login"
                      className="font-bold ml-1 greenTextColor md:text-[20px] text-[14px] hover:underline"
                    >
                      Login
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
