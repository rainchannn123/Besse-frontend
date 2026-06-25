'use client';

import dollarBag from '@/public/assets/images/dollarBag.png';
import lCo2 from '@/public/assets/images/lCo2.png';
import sideArrow from '@/public/assets/images/sideArrow.png';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { Clock, Zap } from 'lucide-react';

interface PendingAuctionLike {
  id?: string;
  auctionId?: string;
  materialType: string;
  mass: number;
}

interface MRFSendBackActionProps {
  budget?: number;
  selectedAuction?: PendingAuctionLike | null;
  onSendBack?: (mode: 'fast' | 'slow') => Promise<void> | void;
  fastDurationSeconds?: number;
  slowDurationSeconds?: number;
}


export const MRFSendBackAction: React.FC<MRFSendBackActionProps> = ({
    budget = 0,
  selectedAuction,
  onSendBack,
  fastDurationSeconds = 20,
  slowDurationSeconds = 40,
}) => {

  const [selectedMode, setSelectedMode] = useState<'fast' | 'slow' | null>(null);
  const [isSending, setIsSending] = useState(false);

  const mass = selectedAuction?.mass ?? 0;
  const fastCost = mass * 50;
  const slowCost = mass * 25;
  const transportCO2 = 1.6;

  const hasEnoughBudgetFast = budget >= fastCost;
  const hasEnoughBudgetSlow = budget >= slowCost;

  const canConfirm = useMemo(() => {
    if (!selectedAuction || !selectedMode || isSending) return false;
    if (selectedMode === 'fast') return hasEnoughBudgetFast;
    return hasEnoughBudgetSlow;
  }, [selectedAuction, selectedMode, isSending, hasEnoughBudgetFast, hasEnoughBudgetSlow]);

  const handleConfirm = async () => {
    if (!canConfirm || !selectedMode || !onSendBack) return;
    setIsSending(true);
    try {
      await onSendBack(selectedMode);
      setSelectedMode(null);
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedAuction) {
    return (
      <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
        <p className="text-center text-gray-500">Select a recycled material batch first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center text-[28px] font-bold text-black mb-1">Send Back to Municipality</h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-center font-semibold text-[#33552C] mb-1 capitalize">
          {selectedAuction.materialType} · {Number(selectedAuction.mass).toFixed(2)}t
        </p>
        <p className="text-center text-sm text-[#33552C] mb-3">Select Transport Mode</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedMode('fast')}
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
               <p className="text-xs text-gray-600">{fastDurationSeconds} seconds</p>

            <p className={`text-sm font-bold ${hasEnoughBudgetFast ? 'text-green-600' : 'text-red-500'}`}>
              ${fastCost.toFixed(0)}
            </p>
          </button>

          <button
            onClick={() => setSelectedMode('slow')}
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
                <p className="text-xs text-gray-600">{slowDurationSeconds} seconds</p>

            <p className={`text-sm font-bold ${hasEnoughBudgetSlow ? 'text-green-600' : 'text-red-500'}`}>
              ${slowCost.toFixed(0)}
            </p>
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={dollarBag} alt="budget" className="w-6 h-6" />
            <p className="text-[18px] font-bold text-black">Budget</p>
          </div>
          <p className="text-[18px]">${Number(budget).toFixed(2)}</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={lCo2} alt="co2" className="w-6 h-6" />
            <p className="text-[18px] font-bold text-black">CO₂</p>
          </div>
          <p className="text-[18px]">+ {transportCO2.toFixed(1)}t</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Image src={dollarBag} alt="cost" className="w-6 h-6" />
            <p className="text-[18px] font-bold text-black">Transport Cost</p>
          </div>
          <p className="text-[18px]">
            ${selectedMode === 'fast' ? fastCost.toFixed(0) : selectedMode === 'slow' ? slowCost.toFixed(0) : '--'}
          </p>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={`w-full rounded-[5px] flex justify-between items-center px-4 py-2 transition-all ${
          canConfirm ? 'bg-[#50704C] hover:bg-[#3A7D2C]' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="text-white font-bold text-[20px]">
          {isSending ? 'Processing...' : 'Confirm Send'}
        </span>
        <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-full flex justify-center items-center">
          <Image src={sideArrow} alt="sideArrow" />
        </div>
      </button>
    </div>
  );
};
