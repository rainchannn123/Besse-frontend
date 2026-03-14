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

interface GlobalAuctionsProps {
  auctions: Auction[];
  onPlaceBid: (auctionId: string) => void;
  currentUserId?: string;
}

export const GlobalAuctions: React.FC<GlobalAuctionsProps> = ({
  auctions,
  onPlaceBid,
  currentUserId,
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

  return (
    <div className="w-full p-4">
      <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-4 h-[600px] overflow-y-auto">
        {auctions.length > 0 ? (
          auctions.map((auction) => (
            <div
              key={auction.auctionId}
              className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200 hover:border-[#3A7D2C] transition-colors"
            >
              <div className="text-center py-2">
                <h3 className="font-bold text-xl text-gray-800 capitalize">
                  {auction.materialType}
                </h3>
                <p className="text-sm text-gray-600">Grade: {auction.grade}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {Number(auction.mass).toFixed(2)}t
                </p>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Entry Price:</span>
                  <span className="font-semibold">${auction.currentBid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Bid:</span>
                  <span className="font-semibold text-green-600">
                    ${auction.currentBid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Seller:</span>
                  <span className="font-semibold">{auction.seller}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-semibold text-orange-600">
                    {getTimeRemaining(auction.endTime)}
                  </span>
                </div>
                {auction.highestBidder && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Highest Bidder:</span>
                    <span className="font-semibold text-blue-600">
                      {auction.highestBidder === currentUserId ? 'You' : auction.highestBidder}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onPlaceBid(auction.auctionId)}
                disabled={auction.status !== 'active'}
                className="w-full bg-[#6D974D] hover:bg-[#5a8a42] text-white py-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Place Bid
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">No active auctions available</p>
          </div>
        )}
      </div>
    </div>
  );
};
