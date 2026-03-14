'use client';

import React from 'react';

interface Auction {
  auctionId: string;
  materialType: string;
  grade: string;
  entryPrice: number;
  currentBid: number;
  highestBidder?: string;
  mass: number;
  seller: string;
  endTime: string | number;
  status: 'active' | 'expired' | 'pending';
}

interface BrokerGlobalAuctionSelectedBoxProps {
  auctions: Auction[];
  selectedAuction: Auction | null;
  setSelectedAuction: (auction: Auction) => void;
  currentUserId?: string;
  onPlaceBid: (auctionId: string) => void;
}

export const BrokerGlobalAuctionSelectedBox: React.FC<BrokerGlobalAuctionSelectedBoxProps> = ({
  auctions,
  selectedAuction,
  setSelectedAuction,
  currentUserId,
  onPlaceBid,
}) => {
  const getTimeRemaining = (endsAt: string | number) => {
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const isAuctionSelected = (auction: Auction): boolean => {
    return selectedAuction?.auctionId === auction.auctionId;
  };

  return (
    <div className="w-full flex justify-center mt-8 pb-6">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 w-full p-4 h-[600px] overflow-y-auto">
        {auctions.length > 0 ? (
          auctions
            .filter((auction) => auction.status !== 'expired')
            .map((auction) => {
              return (
                <div
                  key={auction.auctionId}
                  className="relative w-full h-80 rounded-lg p-4 flex flex-col bg-white text-gray-800 shadow-md"
                >
                  {/* Status badge */}
                  {auction.status !== 'active' && (
                    <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {auction.status === 'expired' ? 'Expired' : 'Pending'}
                    </div>
                  )}

                  {/* Auction Info */}
                  <div className="text-center py-3 shrink-0">
                    <h3 className="font-bold text-lg capitalize text-gray-800">
                      {auction.materialType}
                    </h3>
                    <p className="text-sm text-gray-600">Grade: {auction.grade}</p>
                    <p className="text-2xl font-bold mt-2 text-green-600">
                      {Number(auction.mass).toFixed(2)}t
                    </p>
                  </div>

                  {/* Auction Details */}
                  <div className="mb-3 grow overflow-y-auto">
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Entry Price:</span>
                        <span className="font-semibold">${auction?.entryPrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Bid:</span>
                        <span className="font-semibold text-green-600">
                          ${auction.currentBid.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seller:</span>
                        <span className="font-semibold">{auction.seller}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-semibold text-orange-600">
                          {getTimeRemaining(auction.endTime)}
                        </span>
                      </div>
                      {auction.highestBidder && (
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span>Highest Bid:</span>
                          <span className="font-semibold text-yellow-600">
                            {auction.highestBidder === currentUserId
                              ? 'You'
                              : auction.highestBidder}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive footer */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (auction.status === 'active') {
                        setSelectedAuction(auction);
                        onPlaceBid(auction.auctionId);
                      }
                    }}
                    disabled={auction.status !== 'active'}
                    className="w-full py-2 px-4 rounded-md font-semibold transition-all shrink-0 bg-[#6D974D] hover:bg-[#5a8a42] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {auction.status === 'active' ? 'Place Bid' : 'Bid Closed'}
                  </button>
                </div>
              );
            })
        ) : (
          <div className="col-span-full flex items-center justify-center h-[600px]">
            <p className="text-gray-500 text-lg">No auctions available</p>
          </div>
        )}
      </div>
    </div>
  );
};
