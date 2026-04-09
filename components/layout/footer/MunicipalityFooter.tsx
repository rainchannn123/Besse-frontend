'use client';

import co2 from '@/public/assets/images/co2.png';
import dollar from '@/public/assets/images/dollar.png';
import heart from '@/public/assets/images/heart.png';
import littleBag from '@/public/assets/images/little_bag.png';
import Image from 'next/image';
import React from 'react';

interface MunicipalityFooterProps {
  budget?: number;
  cityHealth?: number;
  wasteInventory?: number;
  maxCapacity?: number;
  totalCO2?: number;
}

export const MunicipalityFooter: React.FC<MunicipalityFooterProps> = ({
  budget = 10000,
  cityHealth = 100,
  wasteInventory = 0,
  maxCapacity = 150,
  totalCO2 = 0,
}) => {
  return (
    <div className="bg-[#50704C] py-4 flex items-center flex-shrink-0">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-2.5">
          <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1 items-center">
            <div className="flex items-center flex-shrink-0">
              <Image src={dollar} alt="dollar" className="w-6 h-6" />
            </div>
            <div className="flex items-center">
              <p className="text-regular text-[15px] font-roboto text-[#000000]">
                Budget ${Number(budget).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1 items-center">
            <div className="flex-shrink-0">
              <Image src={heart} alt="heart" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-regular text-[15px] font-roboto text-[#000000]">
                City Health {Math.round(cityHealth)}%
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-2.5">
                <div
                  className="bg-[#F1BD45] h-2.5 rounded-full"
                  style={{ width: `${Math.min(cityHealth, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1 items-center">
            <div className="flex items-center flex-shrink-0">
              <Image src={littleBag} alt="littleBag" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-regular text-[15px] font-roboto text-[#000000]">
                Waste {Number(wasteInventory).toFixed(1)} (tons)
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-2.5">
                <div
                  className="bg-[#54AA4D] h-2.5 rounded-full"
                  style={{ width: `${Math.min((wasteInventory / maxCapacity) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-2 py-1 items-center">
            <div className="flex-shrink-0">
              <Image src={co2} alt="co2" className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-regular text-[15px] font-roboto text-[#000000]">
                Carbon Emissions {Number(totalCO2).toFixed(2)} (tCO2e)
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-2.5">
                <div
                  className="bg-[#EB5353] h-2.5 rounded-full"
                  style={{ width: `${Math.min((totalCO2 / 200) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
