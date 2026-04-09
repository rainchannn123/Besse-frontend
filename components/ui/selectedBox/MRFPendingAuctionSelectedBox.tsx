'use client';

import { CheckCircle2 } from 'lucide-react';
import React from 'react';

export interface PendingAuction {
  id?: string;
  auctionId?: string;
  materialType: string;
  mass: number;
  createdAt?: string;
  grade?: string;
  currentBid?: number;
}

interface MRFPendingAuctionSelectedBoxProps {
  auctions: PendingAuction[];
  selectedAuction: PendingAuction | null;
  setSelectedAuction: (auction: PendingAuction) => void;
}

export const MRFPendingAuctionSelectedBox: React.FC<MRFPendingAuctionSelectedBoxProps> = ({
  auctions = [],
  selectedAuction,
  setSelectedAuction,
}) => {
  const getAuctionId = (auction: PendingAuction): string => {
    return auction.auctionId || auction.id || '';
  };

  const isAuctionSelected = (auction: PendingAuction): boolean => {
    const auctionId = getAuctionId(auction);
    const selectedId = selectedAuction ? getAuctionId(selectedAuction) : null;
    return auctionId === selectedId;
  };

  return (
      <div className="w-full flex justify-center mt-2 pb-2 lg:h-full">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 w-full p-2 lg:h-full lg:overflow-y-auto content-start">
        {auctions.map((auction) => {
          const isSelected = isAuctionSelected(auction);

          return (
            <div
              key={getAuctionId(auction)}
              className={`relative w-full h-[220px] rounded-lg p-3 flex flex-col cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group ${
                isSelected
                  ? 'bg-linear-to-br from-[#3A7D2C] to-[#2d6322] text-white shadow-lg'
                  : 'bg-white text-gray-800 shadow-md hover:shadow-xl'
              }`}
              onClick={() => setSelectedAuction(auction)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 flex items-center gap-2 animate-pulse">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
              )}

              {/* Hover overlay indicator for non-selected items */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-lg bg-[#3A7D2C] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              )}

              {/* Auction Info */}
              <div className="text-center py-4 shrink-0">
                <h3
                  className={`font-bold text-lg capitalize ${
                    isSelected ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {auction.materialType}
                </h3>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    isSelected ? 'text-white' : 'text-green-600'
                  }`}
                >
                  {Number(auction.mass).toFixed(2)}t
                </p>
              </div>

              <div className="mb-4 grow">
                <p
                  className={`text-center text-sm ${
                    isSelected ? 'text-green-100' : 'text-gray-600'
                  }`}
                >
                  Pending grade assignment and price
                </p>
              </div>

              {/* Interactive footer */}
              {/* <div
                className={`text-center py-2 shrink-0 rounded transition-all ${
                  isSelected ? 'bg-white bg-opacity-20' : 'group-hover:bg-gray-50'
                }`}
              >
                <span
                  className={`font-bold text-sm ${
                    isSelected ? 'text-white' : 'text-gray-700 group-hover:text-[#3A7D2C]'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Click to Select'}
                </span>
              </div> */}
            </div>
          );
        })}

        {/* Fill remaining slots if less than 6 items */}
        {[...Array(Math.max(0, 6 - auctions.length))].map((_, index) => (
          <div
            key={`empty-${index}`}
              className="bg-gray-100 h-[220px] rounded-lg shadow-lg flex items-center justify-center"
          >
            <p className="text-gray-500">No auction available</p>
          </div>
        ))}
      </div>
    </div>
  );
};
