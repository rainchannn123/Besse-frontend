'use client';

import React, { useMemo } from 'react';
import { WasteBatch, Material, MaterialType } from '@/types/besse';
import UnprocessedWasteChart from './UnprocessedWasteChart';
import ProcessedNotListedChart from './ProcessedNotListedChart';
import ListedReadyChart from './ListedReadyChart';

interface MRFAnalyticsProps {
  wasteBatches: WasteBatch[];
  inventory: Material[];
}

const MRFAnalytics: React.FC<MRFAnalyticsProps> = ({ wasteBatches, inventory }) => {
  // Calculate totals for all three charts
  const totals = useMemo(() => {
    // Chart 1: Unprocessed waste totals (from wasteBatches with status 'PENDING')
    const unprocessedByType: Record<MaterialType, number> = {
      paper: 0,
      plastic: 0,
      metal: 0,
      glass: 0,
      wood: 0,
    };

    wasteBatches.forEach(batch => {
      if (batch.status === 'PENDING') {
        Object.entries(batch.composition).forEach(([material, percentage]) => {
          const materialType = material as MaterialType;
          const mass = batch.mass * (percentage || 0);
          if (unprocessedByType[materialType] !== undefined) {
            unprocessedByType[materialType] += mass;
          }
        });
      }
    });

    // Chart 2: Processed but not listed (inventory where listed === false, owner === 'mrf')
    const processedNotListedByType: Record<MaterialType, number> = {
      paper: 0,
      plastic: 0,
      metal: 0,
      glass: 0,
      wood: 0,
    };

    inventory.forEach(item => {
      if (!item.listed && item.owner === 'mrf') {
        processedNotListedByType[item.type] += item.mass;
      }
    });

    // Chart 3: Listed and ready for auction (inventory where listed === true, owner === 'mrf')
    const listedByType: Record<MaterialType, number> = {
      paper: 0,
      plastic: 0,
      metal: 0,
      glass: 0,
      wood: 0,
    };

    inventory.forEach(item => {
      if (item.listed && item.owner === 'mrf') {
        listedByType[item.type] += item.mass;
      }
    });

    const totalUnprocessed = Object.values(unprocessedByType).reduce((a, b) => a + b, 0);
    const totalProcessedNotListed = Object.values(processedNotListedByType).reduce((a, b) => a + b, 0);
    const totalListed = Object.values(listedByType).reduce((a, b) => a + b, 0);

    return {
      unprocessed: { byType: unprocessedByType, total: totalUnprocessed },
      processedNotListed: { byType: processedNotListedByType, total: totalProcessedNotListed },
      listed: { byType: listedByType, total: totalListed },
    };
  }, [wasteBatches, inventory]);

  return (
    <div className="w-full">
      {/* Heading */}
      <h3 className="text-center text-2xl font-bold text-[#4f2d14] mb-4 font-roboto">
        Material Analytics
      </h3>
      
      {/* Horizontal row of 3 charts - responsive: stacks on mobile, row on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1 - Unprocessed Waste */}
        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <UnprocessedWasteChart data={totals.unprocessed} />
        </div>

        {/* Chart 2 - Processed Not Listed */}
        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <ProcessedNotListedChart data={totals.processedNotListed} />
        </div>

        {/* Chart 3 - Listed Ready */}
        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <ListedReadyChart data={totals.listed} />
        </div>
      </div>

      {/* Summary Row - optional */}
      <div className="mt-6 pt-4 border-t border-[#d3c4ad]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Total Unprocessed</p>
            <p className="text-xl font-bold text-[#4f2d14]">{totals.unprocessed.total.toFixed(2)} tons</p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Ready to List</p>
            <p className="text-xl font-bold text-[#4f2d14]">{totals.processedNotListed.total.toFixed(2)} tons</p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Active Auctions</p>
            <p className="text-xl font-bold text-[#4f2d14]">{totals.listed.total.toFixed(2)} tons</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRFAnalytics;