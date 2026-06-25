'use client';

import paper from '@/public/assets/images/paper.png';
import Image from 'next/image';
import React from 'react';

interface MRFCollectProps {
  budget?: number;
  totalCO2?: number;
  selectedItem?: any;
  handleProcessWaste?: () => void;
  handleSendToLandfill?: () => void;
  isSubmitting?: boolean;
}

export const MRFCollect: React.FC<MRFCollectProps> = ({
  budget,
  totalCO2,
  selectedItem,
  handleProcessWaste,
  handleSendToLandfill,
  isSubmitting,
}) => {

  return (
    <div className="">
      <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
        <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
          Processing Action
        </h3>
        <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

        <div className="flex justify-center gap-4 mt-6">
          <Image src={paper} alt="paper" />
          <h4 className="2xl:text-[32px] xl:text-[25px] lg:text-[32px] text-[32px] font-bold text-black mb-1 font-roboto">
            Waste Batch
          </h4>
        </div>
        <div className="my-4 flex justify-center items-center">
          <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
            Status:
          </p>
          <p className="text-[15px] font-bold text-black  font-roboto border-2 border-[#6D974D] px-2 rounded-[25px] ml-2">
            {selectedItem ? (selectedItem.processed ? 'Processed' : 'Pending') : 'None'}
          </p>
        </div>

                <div className="grid grid-cols-2 gap-2 my-4">
          <button
            onClick={handleProcessWaste}
            className="bg-[#50704C] hover:bg-[#5a8a42] text-white py-2 rounded-[5px] font-bold disabled:opacity-50"
            disabled={!selectedItem || selectedItem.processed || isSubmitting}
          >
            Recycle
          </button>
          <button
            onClick={handleSendToLandfill}
            className="bg-[#A65A3A] hover:bg-[#8f4d32] text-white py-2 rounded-[5px] font-bold disabled:opacity-50"
            disabled={!selectedItem || selectedItem.processed || isSubmitting}
          >
            To Landfill
          </button>
        </div>

        <div className="mb-5 mt-5 space-y-2">
          {/* Budget */}
          {/* <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Budget
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              ${Number(budget || 0).toFixed(2)}
            </p>
          </div> */}

          {/* CO2 */}
          {/* <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                CO₂
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              {totalCO2 ? `+ ${Number(totalCO2).toFixed(2)}t` : '+ 0.00t'}
            </p>
          </div> */}

          {/* Material Quality */}
          {/* <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={stars} alt="stars" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Material Quality
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              +/- 0%
            </p>
          </div> */}
        </div>

        
      </div>
    </div>
  );
};
