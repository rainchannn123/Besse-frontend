'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import lCo2 from '@/public/assets/images/lCo2.png';
import paper from '@/public/assets/images/paper.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import littleTrack from '@/public/assets/images/littleTrack.png';
import { WasteBatch } from '@/types/besse';
import Image from 'next/image';
import React, { useState } from 'react';
import { Clock, Zap } from 'lucide-react';

interface WasteCollectActionProps {
  budget?: number;
  totalCO2?: number;
  wasteInventory?: number;
  maxCapacity?: number;
  selectedBatch?: WasteBatch | null;
  handleCollectWaste?: (mode: 'fast' | 'slow') => void;
  transportCostPerTon?: number;
}

export const WasteCollectAction: React.FC<WasteCollectActionProps> = ({
  budget = 0,
  totalCO2 = 0,
  wasteInventory = 0,
  maxCapacity = 0,
  selectedBatch,
  handleCollectWaste,
}) => {
  const [selectedMode, setSelectedMode] = useState<'fast' | 'slow' | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const fastCost = selectedBatch ? selectedBatch.mass * 50 : 0;
  const slowCost = selectedBatch ? selectedBatch.mass * 25 : 0;
  const transportCO2 = 1.6;

  const canCollect = selectedBatch && selectedBatch.status === 'PENDING' && !isCollecting;
  const hasEnoughBudgetFast = budget >= fastCost;
  const hasEnoughBudgetSlow = budget >= slowCost;

  const handleConfirm = async () => {
    console.log('=== WasteCollectAction handleConfirm CALLED ===');
    console.log('selectedMode:', selectedMode);
    console.log('handleCollectWaste exists:', !!handleCollectWaste);
    console.log('selectedBatch:', selectedBatch);
    console.log('selectedBatch?.status:', selectedBatch?.status);
    
    if (!selectedMode || !handleCollectWaste || !selectedBatch) {
      console.log('FAILED: missing conditions - selectedMode:', selectedMode, 'handleCollectWaste:', !!handleCollectWaste, 'selectedBatch:', !!selectedBatch);
      return;
    }
    
    console.log('fastCost:', fastCost, 'hasEnoughBudgetFast:', hasEnoughBudgetFast);
    console.log('slowCost:', slowCost, 'hasEnoughBudgetSlow:', hasEnoughBudgetSlow);
    
    if (selectedMode === 'fast' && !hasEnoughBudgetFast) {
      console.log('FAILED: Insufficient budget for fast transport');
      alert(`Insufficient budget for fast transport. Need $${fastCost.toFixed(2)} but have $${budget.toFixed(2)}`);
      return;
    }
    
    if (selectedMode === 'slow' && !hasEnoughBudgetSlow) {
      console.log('FAILED: Insufficient budget for slow transport');
      alert(`Insufficient budget for slow transport. Need $${slowCost.toFixed(2)} but have $${budget.toFixed(2)}`);
      return;
    }
    
    console.log('Calling handleCollectWaste with mode:', selectedMode);
    setIsCollecting(true);
    await handleCollectWaste(selectedMode);
    setSelectedMode(null);
    setIsCollecting(false);
    console.log('handleCollectWaste completed');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
        <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
          Waste Collection
        </h3>
        <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

        {/* <div className="flex justify-center gap-4 mt-6">
          <Image src={paper} alt="paper" />
          <h4 className="2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1 font-roboto">
            {selectedBatch ? `${selectedBatch.origin} Waste` : 'Select a Batch'}
          </h4>
        </div>
        
        <div className="my-4 flex justify-center items-center">
          <p className="2xl:text-[25px] xl:text-[20px] lg:text-[25px] text-[25px] font-bold text-black font-roboto">
            Mass: {selectedBatch ? `${Number(selectedBatch.mass).toFixed(2)}t` : '0.00t'}
          </p>
        </div> */}

        {selectedBatch && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-center font-semibold text-[#33552C] mb-3">Select Transport Mode</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  console.log('Fast mode selected');
                  setSelectedMode('fast');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMode === 'fast'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <span className="font-bold text-orange-600">Fast</span>
                </div>
                <p className="text-xs text-gray-600">30 seconds</p>
                <p className={`text-sm font-bold ${hasEnoughBudgetFast ? 'text-green-600' : 'text-red-500'}`}>
                  ${fastCost.toFixed(0)}
                </p>
              </button>

              <button
                onClick={() => {
                  console.log('Slow mode selected');
                  setSelectedMode('slow');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedMode === 'slow'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="font-bold text-green-600">Slow</span>
                </div>
                <p className="text-xs text-gray-600">60 seconds</p>
                <p className={`text-sm font-bold ${hasEnoughBudgetSlow ? 'text-green-600' : 'text-red-500'}`}>
                  ${slowCost.toFixed(0)}
                </p>
              </button>
            </div>
          </div>
        )}

        <div className="mb-5 mt-5 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={dollarBag} alt="dollarBag" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Budget
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              ${Number(budget).toFixed(2)}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={lCo2} alt="lCo2" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                CO₂
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              + {transportCO2.toFixed(1)}t
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <Image src={dollarBag} alt="cost" className="w-6 h-6" />
              <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-bold text-black font-roboto">
                Transport Cost
              </p>
            </div>
            <p className="2xl:text-[20px] xl:text-[17px] lg:text-[20px] md:text-[20px] text-[20px] font-normal text-black font-roboto">
              ${selectedMode === 'fast' ? fastCost.toFixed(0) : selectedMode === 'slow' ? slowCost.toFixed(0) : '--'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
          <button
            onClick={handleConfirm}
            disabled={!canCollect || !selectedMode || isCollecting}
            className={`px-2 rounded-[5px] flex gap-4 transition-all ${
              canCollect && selectedMode
                ? 'bg-[#50704C] hover:bg-[#3A7D2C] cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <p className="text-white py-2 font-bold 2xl:text-[24px] xl:text-[16px] lg:text-[24px] text-[24px]">
              {isCollecting ? 'Processing...' : 'Confirm'}
            </p>
            <div className="flex items-center">
              <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-full flex justify-center items-center">
                <Image src={sideArrow} alt="sideArrow" />
              </div>
            </div>
          </button>
        </div>

        {selectedMode === 'fast' && !hasEnoughBudgetFast && (
          <p className="text-red-500 text-xs mt-2 text-center">
            Insufficient budget for fast transport. Need ${fastCost.toFixed(2)}.
          </p>
        )}
      </div>

      {/* <div>
        <h2 className="text-center mt-4 mb-2 font-roboto font-bold 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px] text-black">
          Truck Fleet
        </h2>
        <div className="flex justify-start gap-2">
          <p className="font-roboto 2xl:text-[25px] xl:text-[20px] md:text-[25px] text-[25px] text-black">
            Active : 0
          </p>
          <div className="flex gap-2">
            <Image src={littleTrack} alt="littleTrack" className="w-10 h-6" />
          </div>
        </div>
      </div> */}
    </div>
  );
};