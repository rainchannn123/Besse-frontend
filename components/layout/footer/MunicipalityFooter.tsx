'use client';

import building from '@/public/assets/images/building.png';
import closeBox from '@/public/assets/images/closeBoxed.png';
import co2 from '@/public/assets/images/co2.png';
import dollar from '@/public/assets/images/dollar.png';
import hammer from '@/public/assets/images/hammerImg.png';
import heart from '@/public/assets/images/heart.png';
import littleBag from '@/public/assets/images/little_bag.png';
import openBox from '@/public/assets/images/openBoxed.png';
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
    <div className="bg-[#50704C]  lg:pt-2 pt-12  pb-3 flex items-center relative">
      <div className="container mx-auto">
        <div>
          <h1 className="text-center font-roboto text-[24px] text-white font-bold pb-3 pt-1">
            Collection
          </h1>
        </div>
        <div className="absolute -top-10 ">
          <div className="flex gap-2">
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={openBox} alt="openBox" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={closeBox} alt="closeBox" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={hammer} alt="hammer" />
            </div>
            <div className="w-[86px] h-[86px] bg-white rounded-[50%] flex justify-center items-center">
              <Image src={building} alt="building" />
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-2">
          <div className="bg-white flex gap-2 rounded-[10px] px-3 py-1">
            <div className="flex items-center">
              <Image src={dollar} alt="dollar" />
            </div>
            <div className="flex items-center">
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Budget ${Number(budget).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white flex gap-2 rounded-[10px] px-3 py-1">
            <div>
              <Image src={heart} alt="heart" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                City Health {Math.round(cityHealth)}%
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#F1BD45] h-4 rounded-full"
                  style={{ width: `${Math.min(cityHealth, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-3 py-1">
            <div className="flex items-center">
              <Image src={littleBag} alt="littleBag" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Waste {Number(wasteInventory).toFixed(1)}/{Number(maxCapacity)} tons
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#54AA4D] h-4 rounded-full"
                  style={{ width: `${Math.min((wasteInventory / maxCapacity) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="bg-white flex gap-2 rounded-[10px] px-3 py-1">
            <div>
              <Image src={co2} alt="co2" />
            </div>
            <div>
              <p className="text-regular text-[24px] font-roboto text-[#000000]">
                Carbon Emissions
              </p>
              <div className="w-full bg-[#D9D9D9] rounded-full h-4">
                <div
                  className="bg-[#EB5353] h-4 rounded-full"
                  style={{ width: `${Math.min((totalCO2 / 200) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ;
    </div>
  );
};
