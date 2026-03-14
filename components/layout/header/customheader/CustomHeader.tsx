'use client';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface CustomHeaderProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  lobbyCode?: string;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  backgroundImage,
  title,
  subtitle,
  lobbyCode,
}) => {
  const { logout } = useAuthStore();
  const router = useRouter();
  console.log('');
  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div
      className="p-3 text-center h-[117px] rounded-t-[20px] relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {lobbyCode && (
        <div className="absolute top-10 left-4">
          <p className="text-white font-bold md:text-[24px] text-[18px] font-roboto">
            Code: {lobbyCode}
          </p>
        </div>
      )}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="w-[40px] h-[40px] bg-[#F1BD45] flex items-center justify-center rounded-[50%] cursor-pointer hover:bg-[#e0a93d] transition-colors"
          title="Logout"
        >
          <LogOut size={20} color="white" />
        </button>
      </div>
      <h1 className="md:text-[36px] sm:tex-[28px] text-[20px] text-white font-bold tracking-wide font-roboto">
        {title}
      </h1>
      <p className="md:text-[20px] sm:text-[18px] text-[14px]  text-white font-medium font-roboto">
        {subtitle}
      </p>
    </div>
  );
};

export default CustomHeader;
