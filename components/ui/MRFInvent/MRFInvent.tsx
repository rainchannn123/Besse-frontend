'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import React, { useEffect, useState } from 'react';

import Image from 'next/image';

interface MRFInventProps {
  budget?: number;
  totalCO2?: number;
  selectedItem?: any;
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  handleAssignGrade?: (grade: string) => void;
}

export const MRFInvent: React.FC<MRFInventProps> = ({
  budget,
  totalCO2,
  selectedItem,
  selectedGrade,
  setSelectedGrade,
  handleAssignGrade,
}) => {
  const gradeOrder = ['A', 'B', 'C', 'F'];

  const currentGrade = selectedItem?.grade || 'B';
  const currentIndex = gradeOrder.indexOf(currentGrade);
  const allowedGrades = gradeOrder.slice(0, currentIndex + 1);

  const dumpOptions = ['Landfill', 'Landfill 2', 'Landfill 3'];
  const handleSelect = (value: string) => {
    console.log('Selected option:', value);
  };

  const handleConfirm = () => {
    if (selectedGrade && handleAssignGrade) {
      handleAssignGrade(selectedGrade);
    }
  };

  return (
    <div className=" bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center  2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
        Assign Grade
      </h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      {selectedItem ? (
        <>
          <div className="flex justify-center gap-2 mt-3">
            <Image src={paper} alt="material" />
            <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
              {selectedItem.type || 'Material'}
            </h4>
          </div>
          <div className="my-4 flex justify-center items-center">
            <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px]  text-[25px] font-bold text-black  font-roboto">
              Mass: {Number(selectedItem.mass).toFixed(2) || 0}t
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
            <div className="flex justify-center mt-4">
              <button
                onClick={handleConfirm}
                disabled={!selectedGrade}
                className="w-full bg-[#6D974D] hover:bg-[#5a8a42] flex justify-around rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Select a material to assign grade</p>
        </div>
      )}

      <div className="mb-5 mt-5 space-y-2">
        {/* Budget */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
            <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
              Cost
            </p>
          </div>
          <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-normal text-black font-roboto">
            ${Number(budget || 0).toFixed(2)}
          </p>
        </div>

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
      </div>
    </div>
  );
};
