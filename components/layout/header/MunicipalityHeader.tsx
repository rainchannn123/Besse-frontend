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
    <div className="bg-[#6D974D] py-3 sm:py-4">
      <div className="container mx-auto px-3 sm:px-4 md:px-0">
        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden space-y-3">
          {/* Top Row: User Info & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center justify-center flex-shrink-0">
                <Image src={userInfo} alt="userInfo" className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div>
                <p className="text-white text-[14px] sm:text-[18px] font-roboto font-normal">
                  @{playerName}
                </p>
                <p className="text-white text-[14px] sm:text-[18px] font-roboto font-normal">
                  {role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F1BD45] flex items-center justify-center rounded-full flex-shrink-0">
                <Image src={closeBox} alt="notification" className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#F1BD45] flex items-center justify-center rounded-full cursor-pointer flex-shrink-0"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>

          {/* City Name - Mobile */}
          {cityName && (
            <div className="flex justify-center">
              <h1 className="font-bold text-[20px] sm:text-[24px] font-roboto text-white text-center">
                {cityName}
              </h1>
            </div>
          )}

          {/* Waste Inventory - Mobile */}
          <div className="flex justify-center">
            <div className="bg-white flex gap-2 rounded-[10px] px-3 py-2 w-full max-w-md">
              <div className="flex-shrink-0">
                <Image src={closeBox} alt="closeBox" className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] sm:text-[18px] font-roboto text-[#000000] truncate">
                  Waste {Number(wasteInventory).toFixed(1)}/{Number(maxCapacity)} tons
                </p>
                <div className="w-full bg-[#D9D9D9] rounded-full h-3 sm:h-4 mt-1">
                  <div
                    className="bg-[#54AA4D] h-3 sm:h-4 rounded-full transition-all duration-300"
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
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <Image src={userInfo} alt="userInfo" />
            </div>
            <div>
              <p className="text-white text-[22px] lg:text-[25px] font-roboto font-normal">
                @{playerName}
              </p>
              <p className="text-white text-[22px] lg:text-[25px] font-roboto font-normal">
                {role}
              </p>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex items-center">
            <h1 className="font-bold text-[28px] lg:text-[40px] font-roboto text-white">
              {cityName}
            </h1>
          </div>

          {/* Waste Inventory & Actions */}
          <div className="flex items-center gap-8">
            <div className="bg-white flex gap-2 rounded-[10px] px-3 py-2">
              <div>
                <Image src={closeBox} alt="closeBox" />
              </div>
              <div>
                <p className="text-[20px] lg:text-[24px] font-roboto text-[#000000]">
                  Waste {Number(wasteInventory).toFixed(1)}/{Number(maxCapacity)} tons
                </p>
                <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                  <div
                    className="bg-[#54AA4D] h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((wasteInventory / maxCapacity) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="w-[54px] h-[54px] bg-[#F1BD45] flex items-center justify-center rounded-full">
              <Image src={closeBox} alt="notification" />
            </div>
            <div
              className="w-[54px] h-[54px] bg-[#F1BD45] flex items-center justify-center rounded-full cursor-pointer hover:bg-[#e0ab35] transition-colors"
              onClick={handleLogout}
            >
              <LogOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
