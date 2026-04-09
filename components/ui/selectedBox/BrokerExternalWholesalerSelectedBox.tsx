'use client';

import React, { useState } from 'react';

interface StockItem {
  materialType: string;
  availableAmount: number;
  pricePerUnit: number;
  lastUpdated: string;
}

interface BrokerExternalWholesalerSelectedBoxProps {
  stock: StockItem[];
  selectedStock: StockItem | null;
  setSelectedStock: (item: StockItem) => void;
  onBuy: (materialType: string, amount: number) => void;
}

export const BrokerExternalWholesalerSelectedBox: React.FC<
  BrokerExternalWholesalerSelectedBoxProps
> = ({ stock, selectedStock, setSelectedStock, onBuy }) => {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const handleBuy = (materialType: string) => {
    const amount = parseFloat(quantities[materialType] || '0');
    if (amount > 0) {
      onBuy(materialType, amount);
      setQuantities({ ...quantities, [materialType]: '' });
      setSelectedStock(stock.find((s) => s.materialType === materialType)!);
    }
  };

  const handleQuantityChange = (materialType: string, value: string) => {
    setQuantities({ ...quantities, [materialType]: value });
  };

  const isItemSelected = (item: StockItem): boolean => {
    return selectedStock?.materialType === item.materialType;
  };

  if (!stock) {
    return (
        <div className="w-full flex justify-center mt-2 pb-2 lg:h-full">
          <div className="flex items-center justify-center lg:h-full w-full">
          <p className="text-gray-500 text-lg">Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full flex justify-center mt-2 pb-2 lg:h-full">
        <div className="grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-3 w-full p-2 lg:h-full lg:overflow-y-auto content-start">
        {stock.length > 0 ? (
          stock.map((item) => {
            const isSelected = isItemSelected(item);
            const quantity = parseFloat(quantities[item.materialType] || '0');
            const totalCost = quantity * item.pricePerUnit;
            const canBuy = quantity > 0 && quantity <= item.availableAmount;

            return (
              <div
                key={item.materialType}
                className="relative rounded-lg p-4 flex flex-col bg-white text-gray-800 shadow-md"
              >
                {/* Stock Info */}
                <div className="text-left py-3 shrink-0 pr-8">
                  <h3 className="font-bold text-lg capitalize text-gray-800">
                    {item.materialType}
                  </h3>
                </div>

                {/* Stock Details */}
                <div className="mb-3 grow">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Available Stock:</span>
                      <span className="font-semibold">
                        {Number(item.availableAmount).toFixed(2)}t
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per Ton:</span>
                      <span className="font-semibold text-green-600">
                        ${item.pricePerUnit.toFixed(2)}
                      </span>
                    </div>
                    {quantity > 0 && (
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="font-bold">Total Cost:</span>
                        <span className="font-bold text-green-600">${totalCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input and Buy Button */}
                <div className="flex flex-col gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max={item.availableAmount}
                    step="0.1"
                    value={quantities[item.materialType] || ''}
                    onChange={(e) => handleQuantityChange(item.materialType, e.target.value)}
                    placeholder="Enter amount (tons)"
                    className="px-3 py-2 rounded-md text-center focus:outline-none transition-all bg-gray-100 text-gray-800 border-2 border-gray-300 focus:ring-2 focus:ring-[#3A7D2C] focus:border-transparent"
                  />
                  <button
                    onClick={() => handleBuy(item.materialType)}
                    disabled={!canBuy}
                    className="py-2 px-4 rounded-md font-semibold transition-all bg-[#6D974D] hover:bg-[#5a8a42] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {canBuy ? 'Buy' : 'Enter Amount'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
            <div className="col-span-full flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">No stock available</p>
          </div>
        )}
      </div>
    </div>
  );
};
