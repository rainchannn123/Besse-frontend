'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import lCo2 from '@/public/assets/images/lCo2.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import smallBox from '@/public/assets/images/smallBox.png';
import littleTrack from '@/public/assets/images/littleTrack.png';
import { WasteBatch } from '@/types/besse';
import Image from 'next/image';
import React, { useState } from 'react';

interface WasteCollectActionProps {
  budget?: number;
  totalCO2?: number;
  wasteInventory?: number;
  maxCapacity?: number;
  selectedBatch?: WasteBatch | null;
  handleCollectWaste?: () => void;
}

export const WasteCollectAction: React.FC<WasteCollectActionProps> = ({
  budget = 0,
  totalCO2 = 0,
  wasteInventory = 0,
  maxCapacity = 0,
  selectedBatch,
  handleCollectWaste,
}) => {
  const [actionSelected, setActionSelected] = useState(false);

  return (
    <div className="">
      <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
        <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
          Waste Collection
        </h3>
        <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

        <div className="flex justify-center gap-4 mt-6">
          <Image src={paper} alt="paper" />
          <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
            Waste Batch
          </h4>
        </div>
        <div className="my-4 flex justify-center items-center">
          <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
            Mass: {selectedBatch ? `${Number(selectedBatch.mass).toFixed(2)}t` : '0.00t'}
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="collect"
              name="action"
              value="collect"
              className="form-radio w-5 h-5  accent-[#3A7D2C] cursor-pointer"
              checked={actionSelected}
              onChange={() => setActionSelected(true)}
            />
            <label
              htmlFor="collect"
              className="ml-2 2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto"
            >
              Send to MRF
            </label>
          </div>
        </div>

        

        <button
          onClick={handleCollectWaste}
          className="w-full bg-[#6D974D] hover:bg-[#5a8a42] flex justify-around rounded-[5px] disabled:opacity-50"
          disabled={!selectedBatch || selectedBatch.status !== 'PENDING' || !actionSelected}
        >
          <p></p>
          <p className="text-white py-2 rounded-[5px] font-bold 2xl:text-[24px] xl:text-[16px] lg:text-[24px] text-[24px]">
            Confirm
          </p>
          <div className="flex items-center">
            <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
              <Image src={sideArrow} alt="sideArrow" />
            </div>
          </div>
        </button>

        {/* Truck Fleet Section */}
        <div className="mt-6">
          <h2 className="text-center mb-2 font-roboto font-bold 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px] text-black">
            Truck Fleet
          </h2>
          <div className="flex justify-center gap-2 mb-2">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};