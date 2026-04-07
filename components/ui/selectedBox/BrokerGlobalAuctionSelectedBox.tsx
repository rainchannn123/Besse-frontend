'use client';

import React, { useEffect, useState } from 'react';

interface Auction {
  auctionId: string;
  materialType: string;
  grade: string;
  entryPrice: number;
  currentBid: number;
  highestBidder?: string;
  highBidder?: string | null;
  highBidderSessionId?: string | null;
  mass: number;
  seller: string;
  originTeam?: string;
  endTime: string | number;
  status: 'active' | 'expired' | 'pending' | 'sold';
  sellerTeamRole?: string;
  highBidderTeamRole?: string | null;
  winnerTeamRole?: string | null;
}

interface BrokerGlobalAuctionSelectedBoxProps {
  auctions: Auction[];
  selectedAuction: Auction | null;
  setSelectedAuction: (auction: Auction) => void;
  currentUserId?: string;
  onPlaceBid: (auctionId: string) => void;
}

// Live countdown hook that ticks every second
function useCountdowns(auctions: Auction[]) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export const BrokerGlobalAuctionSelectedBox: React.FC<BrokerGlobalAuctionSelectedBoxProps> = ({
  auctions,
  selectedAuction,
  setSelectedAuction,
  currentUserId,
  onPlaceBid,
}) => {
  const now = useCountdowns(auctions);

  const getTimeRemaining = (endTime: string | number) => {
    const end = typeof endTime === 'number' ? endTime : new Date(endTime).getTime();
    const diff = end - now;

    if (diff <= 0) return null; // expired

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const isExpired = (auction: Auction) => {
    if (auction.status === 'sold') return true;
    const end = typeof auction.endTime === 'number' ? auction.endTime : new Date(auction.endTime).getTime();
    return end <= now;
  };

  return (
    <div className="w-full flex justify-center mt-8 pb-6">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 w-full p-4 h-[600px] overflow-y-auto">
        {auctions.length > 0 ? (
          auctions.map((auction) => {
            const expired = isExpired(auction);
            const timeStr = getTimeRemaining(auction.endTime);

            return (
              <div
                key={auction.auctionId}
                className={`relative w-full rounded-lg p-4 flex flex-col shadow-md border ${
                  expired
                    ? 'bg-[#f0e8d8] text-[#8b7355] border-[#d4c4a8]'
                    : 'bg-white text-gray-800 border-[#d4c4a8]'
                }`}
              >
                {/* Status badge */}
                {expired && (
                  <div className="absolute top-4 right-4 bg-[#b18c5a] text-white px-3 py-1 rounded-full text-xs font-bold">
                    Expired
                  </div>
                )}

                {/* Auction Info */}
                <div className="text-center py-3 shrink-0">
                  <h3 className="font-bold text-lg capitalize text-[#33552C]">
                    {auction.materialType}
                  </h3>
                  <p className="text-sm text-[#6b5e4f]">Grade: {auction.grade}</p>
                  <p className={`text-2xl font-bold mt-2 ${expired ? 'text-[#a09070]' : 'text-[#3A7D2C]'}`}>
                    {Number(auction.mass).toFixed(2)}t
                  </p>
                </div>

                {/* Auction Details */}
                <div className="mb-3 grow overflow-y-auto">
                  <div className="space-y-2 text-xs text-[#6b5e4f]">
                    {/* Seller */}
                    <div className="flex justify-between">
                      <span>Seller:</span>
                      <span className="font-semibold text-[#8b6647]">
                        {auction.sellerTeamRole || auction.seller || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Entry Price:</span>
                      <span className="font-semibold">${auction?.entryPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Bid:</span>
                      <span className={`font-semibold ${expired ? 'text-[#a09070]' : 'text-[#3A7D2C]'}`}>
                        ${auction.currentBid.toFixed(2)}
                      </span>
                    </div>

                    {/* Countdown / Expired */}
                    <div className="flex justify-between">
                      <span>Time:</span>
                      {expired ? (
                        <span className="font-semibold text-[#b18c5a]">Expired</span>
                      ) : (
                        <span className="font-semibold text-[#c47d20] tabular-nums">
                          {timeStr}
                        </span>
                      )}
                    </div>

                    {/* Current Highest Bidder (shown while active or after sold) */}
                    {auction.highBidderTeamRole && !expired && (
                      <div className="flex justify-between pt-2 border-t border-[#d4c4a8]">
                        <span>Current Highest Bidder:</span>
                        <span className="font-semibold text-[#b18c5a]">
                          {auction.highBidderTeamRole}
                        </span>
                      </div>
                    )}

                    {/* Winner Bidder (shown after expired/sold) */}
                    {expired && (
                      <div className="flex justify-between pt-2 border-t border-[#d4c4a8]">
                        <span>Winner Bidder:</span>
                        <span className={`font-semibold ${auction.winnerTeamRole ? 'text-[#3A7D2C]' : 'text-[#a09070]'}`}>
                          {auction.winnerTeamRole || 'No bids (Liquidated)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive footer */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!expired && auction.status === 'active') {
                      setSelectedAuction(auction);
                      onPlaceBid(auction.auctionId);
                    }
                  }}
                  disabled={expired || auction.status !== 'active'}
                  className={`w-full py-2 px-4 rounded-md font-semibold transition-all shrink-0 ${
                    expired
                      ? 'bg-[#c4b896] text-[#8b7355] cursor-not-allowed'
                      : 'bg-[#6D974D] hover:bg-[#5a8a42] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {expired ? 'Bid Closed' : 'Place Bid'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex items-center justify-center h-[600px]">
            <p className="text-[#8b7355] text-lg">No auctions available</p>
          </div>
        )}
      </div>
    </div>
  );
};
