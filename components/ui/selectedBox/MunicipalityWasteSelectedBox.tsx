'use client';

import { WasteBatch } from '@/types/besse';
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

interface MunicipalityWasteSelectedBoxProps {
  wasteBatches: WasteBatch[];
  selectedBatch: WasteBatch | null;
  setSelectedBatch: (batch: WasteBatch) => void;
}

export const MunicipalityWasteSelectedBox: React.FC<MunicipalityWasteSelectedBoxProps> = ({
  wasteBatches = [],
  selectedBatch,
  setSelectedBatch,
}) => {
  return (
      <div className="w-full flex justify-center mt-2 pb-2 lg:h-full">
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-3 w-full p-2 lg:h-full lg:overflow-y-auto content-start">
        {wasteBatches.map((batch) => {
          const isSelected = selectedBatch?.id === batch.id;

          return (
            <div
              key={batch.id}
              className={`relative w-full h-[290px] rounded-lg p-3 flex flex-col cursor-pointer transition-all duration-300 transform hover:scale-105 group ${
                isSelected
                  ? 'bg-linear-to-br from-[#3A7D2C] to-[#2d6322] text-white shadow-lg'
                  : 'bg-white text-gray-800 shadow-md hover:shadow-xl'
              }`}
              onClick={() => setSelectedBatch(batch)}
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

              {/* Batch Info */}
              <div className="text-center py-4 shrink-0">
                <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {batch.origin} Waste
                </h3>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    isSelected ? 'text-white' : 'text-green-600'
                  }`}
                >
                  {Number(batch.mass).toFixed(2)}t
                </p>
                <p className={`text-sm ${isSelected ? 'text-green-100' : 'text-gray-600'}`}>
                  Status: {batch.status}
                </p>
              </div>

              {/* Composition */}
              <div className="mb-4 grow overflow-y-auto">
                <h4
                  className={`font-semibold text-sm mb-2 ${
                    isSelected ? 'text-green-100' : 'text-gray-700'
                  }`}
                >
                  Composition:
                </h4>
                <div
                  className={`space-y-1 text-xs ${isSelected ? 'text-green-50' : 'text-gray-600'}`}
                >
                  {Object.entries(batch.composition).map(([material, percentage]) => (
                    <div key={material} className="flex justify-between">
                      <span className="capitalize">{material}:</span>
                      <span>{(percentage * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
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
        {[...Array(Math.max(0, 6 - wasteBatches.length))].map((_, index) => (
          <div
            key={`empty-${index}`}
              className="bg-gray-100 h-[290px] rounded-lg shadow-lg flex items-center justify-center"
          >
            <p className="text-gray-500">No waste batch available</p>
          </div>
        ))}
      </div>
    </div>
  );
};
