'use client';

import { useAuthStore } from '@/stores/authStore';
import { CircleUserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

export const UserLogoutButton: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="group fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-md border border-[#d9d9d9] hover:bg-[#f7f7f7] transition-colors"
      title="Logout"
      aria-label="Logout"
      type="button"
    >
      <CircleUserRound className="w-5 h-5 text-[#33552C]" />
      <span className="max-w-[160px] truncate text-[14px] font-roboto font-semibold text-[#33552C]">
        {user.name}
      </span>
      <span className="pointer-events-none absolute -bottom-8 right-0 rounded bg-black px-2 py-1 text-[12px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
        Logout
      </span>
    </button>
  );
};