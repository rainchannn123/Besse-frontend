'use client';

import React, { useState } from 'react';

interface StockItem {
  materialType: string;
  availableAmount: number;
  pricePerUnit: number;
  lastUpdated: string;
}

interface ExternalWholesalerProps {
  stock: StockItem[];
  onBuy: (materialType: string, amount: number) => void;
}

export const ExternalWholesaler: React.FC<ExternalWholesalerProps> = ({ stock, onBuy }) => {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const handleBuy = (materialType: string) => {
    const amount = parseFloat(quantities[materialType] || '0');
    if (amount > 0) {
      onBuy(materialType, amount);
      setQuantities({ ...quantities, [materialType]: '' });
    }
  };

  const handleQuantityChange = (materialType: string, value: string) => {
    setQuantities({ ...quantities, [materialType]: value });
  };

  if (!stock) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center h-[600px]">
          <p className="text-gray-500 text-lg">Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="space-y-4 h-[600px] overflow-y-auto">
        {stock.map((item) => {
          const quantity = parseFloat(quantities[item.materialType] || '0');
          const totalCost = quantity * item.pricePerUnit;
          const canBuy = quantity > 0 && quantity <= item.availableAmount;

          return (
            <div
              key={item.materialType}
              className="bg-white rounded-lg shadow-lg p-4 border-2 border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-800 capitalize mb-2">
                    {item.materialType}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Stock:</span>
                      <span className="font-semibold">
                        {Number(item.availableAmount).toFixed(2)}t
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per Ton:</span>
                      <span className="font-semibold">${item.pricePerUnit.toFixed(2)}</span>
                    </div>
                    {quantity > 0 && (
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-600 font-bold">Total Cost:</span>
                        <span className="font-bold text-green-600">
                          ${totalCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-64">
                  <input
                    type="number"
                    min="0"
                    max={item.availableAmount}
                    step="0.1"
                    value={quantities[item.materialType] || ''}
                    onChange={(e) => handleQuantityChange(item.materialType, e.target.value)}
                    placeholder="Enter amount (tons)"
                    className="px-4 py-2 border-2 border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-[#3A7D2C] focus:border-transparent"
                  />
                  <button
                    onClick={() => handleBuy(item.materialType)}
                    disabled={!canBuy}
                    className="bg-[#6D974D] hover:bg-[#5a8a42] text-white py-2 px-6 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy
                  </button>
                </div>
              </div>

              {quantity > item.availableAmount && (
                <p className="text-red-500 text-sm mt-2">
                  Insufficient stock. Available: {item.availableAmount.toFixed(2)}t
                </p>
              )}
            </div>
          );
        })}

        {stock.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">No stock available</p>
          </div>
        )}
      </div>
    </div>
  );
};