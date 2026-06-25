'use client';

import closeBox from '@/public/assets/images/closeBoxed.png';
import userInfo from '@/public/assets/images/userInfo.png';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useAuthStore } from '../../../stores/authStore';
interface MunicipalityHeaderProps {
  playerName?: string;
  cityName?: string;
  wasteInventory?: number;
  maxCapacity?: number;
  role?: string;
}

export const MunicipalityHeader: React.FC<MunicipalityHeaderProps> = ({
  playerName = 'Player',
  cityName = '',
  wasteInventory = 0,
  maxCapacity = 150,
  role = '',
}) => {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };
  return (
    <div className="bg-[#50704C] py-4 sm:py-5 flex-shrink-0">
      <div className="container mx-auto px-3 sm:px-4 md:px-0">
        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden space-y-2">
          {/* Top Row: User Info & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center flex-shrink-0">
                <Image src={userInfo} alt="userInfo" className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div>
                <p className="text-white text-[12px] sm:text-[14px] font-roboto font-normal">
                  @{playerName}
                </p>
                <p className="text-white text-[12px] sm:text-[14px] font-roboto font-normal">
                  {role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F1BD45] flex items-center justify-center rounded-full flex-shrink-0">
                <Image src={closeBox} alt="notification" className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F1BD45] flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* City Name - Mobile */}
          {cityName && (
            <div className="flex justify-center">
              <h1 className="font-bold text-[16px] sm:text-[20px] font-roboto text-white text-center">
                {cityName}
              </h1>
            </div>
          )}

          {/* Waste Inventory - Mobile */}
          <div className="flex justify-center">
            <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1 w-full max-w-md">
              <div className="flex-shrink-0">
                <Image src={closeBox} alt="closeBox" className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] sm:text-[14px] font-roboto text-[#000000] truncate">
                  Waste {Number(wasteInventory).toFixed(1)}/{Number(maxCapacity)} tons
                </p>
                <div className="w-full bg-[#D9D9D9] rounded-full h-2 sm:h-3 mt-0.5">
                  <div
                    className="bg-[#54AA4D] h-2 sm:h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((wasteInventory / maxCapacity) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <Image src={userInfo} alt="userInfo" className="w-10 h-10" />
            </div>
            <div>
              <p className="text-white text-[16px] lg:text-[18px] font-roboto font-normal leading-tight">
                @{playerName}
              </p>
              <p className="text-white text-[16px] lg:text-[18px] font-roboto font-normal leading-tight">
                {role}
              </p>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex items-center">
            <h1 className="font-bold text-[22px] lg:text-[28px] font-roboto text-white">
              {cityName}
            </h1>
          </div>

          {/* Waste Inventory & Actions */}
          <div className="flex items-center gap-4">
            <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1">
              <div className="flex items-center">
                <Image src={closeBox} alt="closeBox" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[14px] lg:text-[16px] font-roboto text-[#000000]">
                  Waste {Number(wasteInventory).toFixed(1)}/{Number(maxCapacity)} tons
                </p>
                <div className="w-full bg-[#D9D9D9] rounded-full h-3">
                  <div
                    className="bg-[#54AA4D] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((wasteInventory / maxCapacity) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {/* <div className="w-[40px] h-[40px] bg-[#F1BD45] flex items-center justify-center rounded-full">
              <Image src={closeBox} alt="notification" className="w-5 h-5" />
            </div> */}
            {/* <div
              className="w-[40px] h-[40px] bg-[#F1BD45] flex items-center justify-center rounded-full cursor-pointer hover:bg-[#e0ab35] transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};
