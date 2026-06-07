'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import Image from 'next/image';
import React, { useState } from 'react';

interface PendingAuction {
  id: string;
  materialType: string;
  mass: number;
  createdAt: string;
}

interface PendingAuctionActionProps {
  selectedAuction?: PendingAuction | null;
  handleAssignGradeAndPrice?: (grade: string, entryPrice: number) => void;
}

export const PendingAuctionAction: React.FC<PendingAuctionActionProps> = ({
  selectedAuction,
  handleAssignGradeAndPrice,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('B');
  const [entryPrice, setEntryPrice] = useState<string>('');

  const gradeOrder = ['A', 'B', 'C', 'F'];

  const currentGrade = (selectedAuction as any)?.grade || 'B';
  const currentIndex = gradeOrder.indexOf(currentGrade);
  const allowedGrades = gradeOrder.slice(0, currentIndex + 1);

  const handleConfirm = () => {
    const price = parseFloat(entryPrice);
    if (selectedGrade && price > 0 && handleAssignGradeAndPrice) {
      handleAssignGradeAndPrice(selectedGrade, price);
    }
  };

  return (
    <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-2">
      <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
        Activate Auction
      </h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      {selectedAuction ? (
        <>
          <div className="flex justify-center gap-2 mt-3">
            <Image src={paper} alt="material" />
            <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto capitalize">
              {selectedAuction.materialType}
            </h4>
          </div>
          <div className="my-4 flex justify-center items-center">
            <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
              Mass: {Number(selectedAuction.mass).toFixed(2)}t
            </p>
          </div>

          <div className="mt-5">
            <h5 className="text-center text-lg font-semibold mb-2">Select Grade</h5>
            <div className="flex flex-col items-center justify-center gap-2">
              {allowedGrades.map((grade) => (
                <label key={grade} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="grade"
                    value={grade}
                    checked={selectedGrade === grade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-4 h-4 accent-[#3A7D2C]"
                  />
                  <span className="text-lg font-medium">Grade {grade}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h5 className="text-center text-lg font-semibold mb-2">Entry Price</h5>
            <div className="flex justify-center">
              <input
                type="number"
                min="0"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full max-w-xs px-4 py-2 border-2 border-[#6D974D] rounded-md text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#3A7D2C]"
              />
            </div>
          </div>

          <div className="mb-5 mt-5 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
                <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                  Entry Price
                </p>
              </div>
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-normal text-black font-roboto">
                ${entryPrice || '0.00'}
              </p>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedGrade || !entryPrice || parseFloat(entryPrice) <= 0}
            className="w-full bg-[#50704C] hover:bg-[#5a8a42] flex justify-around rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p></p>
            <p className="text-white py-2 rounded-[5px] font-bold 2xl:text-[24px] xl:text-[16px] lg:text-[24px] text-[24px]">
              Activate
            </p>
            <div className="flex items-center">
              <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
                <Image src={sideArrow} alt="sideArrow" />
              </div>
            </div>
          </button>
        </>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500 text-lg">Select a pending auction to activate</p>
        </div>
      )}
    </div>
  );
};