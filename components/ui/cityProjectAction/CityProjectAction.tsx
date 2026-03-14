'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import { CityProject, MaterialType } from '@/types/besse';
import Image from 'next/image';
import React from 'react';

interface CityProjectActionProps {
  selectedProject?: CityProject | null;
  municipalInventory?: Record<MaterialType, number>;
  handleConstructProject?: () => void;
}

export const CityProjectAction: React.FC<CityProjectActionProps> = ({
  selectedProject,
  municipalInventory = {
    paper: 0,
    plastic: 0,
    metal: 0,
    glass: 0,
    wood: 0,
  },
  handleConstructProject,
}) => {
  // Check if project can be constructed
  const canConstruct = selectedProject
    ? Object.entries(selectedProject.requiredMaterials).every(
        ([material, required]) =>
          municipalInventory[material as MaterialType] >= (required || 0)
      )
    : false;

  return (
    <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
        City Project
      </h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      {selectedProject ? (
        <>
          <div className="mt-6">
            <h4 className="2xl:text-[28px] xl:text-[24px] lg:text-[28px] text-[28px] font-bold text-black mb-3 font-roboto text-center">
              {selectedProject.name}
            </h4>
          </div>

          <div className="my-4">
            <p className="2xl:text-[22px] xl:text-[18px] lg:text-[22px]  text-[22px] font-bold text-black  font-roboto text-center mb-2">
              Progress: {selectedProject.progress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-[#6D974D] h-4 rounded-full transition-all"
                style={{ width: `${selectedProject.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-5 mb-4">
            <h5 className="text-center text-lg font-semibold mb-3">Required Materials</h5>
            <div className="space-y-2">
              {Object.entries(selectedProject.requiredMaterials).map(([material, required]) => {
                const available = municipalInventory[material as MaterialType] || 0;
                const hasEnough = available >= (required || 0);
                return (
                  <div
                    key={material}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium capitalize">{material}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${hasEnough ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {available.toFixed(2)}t / {(required || 0).toFixed(2)}t
                      </span>
                      {hasEnough ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-5 mt-5 space-y-2">
            {/* Health Bonus */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <Image src={dollarBag} alt="health" className="w-6 h-6" />
                <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                  Health Bonus
                </p>
              </div>
              <p className="2xl:text-[20px] xl:text-[17px]  lg:text-[20px] md:text-[20px] text-[20px]  font-normal text-black font-roboto">
                +{selectedProject.healthBonus}%
              </p>
            </div>
          </div>

          <button
            onClick={handleConstructProject}
            disabled={!canConstruct || selectedProject.completed}
            className="w-full bg-[#6D974D] hover:bg-[#5a8a42] flex justify-around rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p></p>
            <p className="text-white py-2 rounded-[5px] font-bold 2xl:text-[24px] xl:text-[16px] lg:text-[24px] text-[24px]">
              {selectedProject.completed ? 'Completed' : 'Construct'}
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
          <p className="text-gray-500 text-lg">Select a project to view details</p>
        </div>
      )}
    </div>
  );
};