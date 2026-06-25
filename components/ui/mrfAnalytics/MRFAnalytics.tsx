'use client';

import React, { useMemo } from 'react';
import { Auction, Material, MaterialType, WasteBatch } from '@/types/besse';
import UnprocessedWasteChart from './UnprocessedWasteChart';
import ProcessedNotListedChart from './ProcessedNotListedChart';
import ListedReadyChart from './ListedReadyChart';

interface MRFAnalyticsProps {
  wasteBatches: WasteBatch[];
  inventory: Material[];
  marketplaceListing?: Auction[];
}

const EMPTY_BY_TYPE = (): Record<MaterialType, number> => ({
  paper: 0,
  plastic: 0,
  metal: 0,
  glass: 0,
  wood: 0,
});

const MRFAnalytics: React.FC<MRFAnalyticsProps> = ({
  wasteBatches,
  inventory,
  marketplaceListing = [],
}) => {
  const totals = useMemo(() => {
    // ─────────────────────────────────────────────────────────────
    // CHART 1: Unprocessed waste composition
    // Source: wasteBatches with status === 'PENDING'
    // ─────────────────────────────────────────────────────────────
    const unprocessedByType = EMPTY_BY_TYPE();

    wasteBatches.forEach(batch => {
      if (batch.status !== 'PENDING') return;
      Object.entries(batch.composition).forEach(([material, fraction]) => {
        const materialType = material as MaterialType;
        const mass = batch.mass * (fraction || 0);
        if (unprocessedByType[materialType] !== undefined) {
          unprocessedByType[materialType] += mass;
        }
      });
    });

    // ─────────────────────────────────────────────────────────────
    // CHART 2: Processed but not yet listed
    // Primary source: marketplaceListing where status === 'pending'
    //   (materials processed at MRF, awaiting grade & price assignment)
    // Fallback: inventory items where !listed && owner === 'mrf'
    // ─────────────────────────────────────────────────────────────
    const processedNotListedByType = EMPTY_BY_TYPE();

    marketplaceListing.forEach(auction => {
      if (auction.status === 'pending') {
        const materialType = auction.materialType as MaterialType;
        if (processedNotListedByType[materialType] !== undefined) {
          processedNotListedByType[materialType] += auction.mass;
        }
      }
    });

    inventory.forEach(item => {
      if (!item.listed && item.owner === 'mrf') {
        if (processedNotListedByType[item.type] !== undefined) {
          processedNotListedByType[item.type] += item.mass;
        }
      }
    });

    // ─────────────────────────────────────────────────────────────
    // CHART 3: Listed & ready for auction
    // Primary source: marketplaceListing where status === 'active'
    //   (active auctions currently accepting bids)
    // Fallback: inventory items where listed && owner === 'mrf'
    // ─────────────────────────────────────────────────────────────
    const listedByType = EMPTY_BY_TYPE();

    marketplaceListing.forEach(auction => {
      if (auction.status === 'active') {
        const materialType = auction.materialType as MaterialType;
        if (listedByType[materialType] !== undefined) {
          listedByType[materialType] += auction.mass;
        }
      }
    });

    inventory.forEach(item => {
      if (item.listed && item.owner === 'mrf') {
        if (listedByType[item.type] !== undefined) {
          listedByType[item.type] += item.mass;
        }
      }
    });

    const totalUnprocessed = Object.values(unprocessedByType).reduce(
      (a, b) => a + b,
      0
    );
    const totalProcessedNotListed = Object.values(processedNotListedByType).reduce(
      (a, b) => a + b,
      0
    );
    const totalListed = Object.values(listedByType).reduce((a, b) => a + b, 0);

    return {
      unprocessed: { byType: unprocessedByType, total: totalUnprocessed },
      processedNotListed: {
        byType: processedNotListedByType,
        total: totalProcessedNotListed,
      },
      listed: { byType: listedByType, total: totalListed },
    };
  }, [wasteBatches, inventory, marketplaceListing]);

  return (
    <div className="w-full">
      {/* Heading */}
      <h3 className="text-center text-2xl font-bold text-[#4f2d14] mb-4 font-roboto">
        Material Analytics
      </h3>

      {/* Horizontal row of 3 charts - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <UnprocessedWasteChart data={totals.unprocessed} />
        </div>

        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <ProcessedNotListedChart data={totals.processedNotListed} />
        </div>

        <div className="bg-[#F8F0DD] rounded-lg p-4 border border-[#b18c5a] shadow-sm">
          <ListedReadyChart data={totals.listed} />
        </div>
      </div>

      {/* Summary Row */}
      <div className="mt-6 pt-4 border-t border-[#d3c4ad]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Total Unprocessed</p>
            <p className="text-xl font-bold text-[#4f2d14]">
              {totals.unprocessed.total.toFixed(2)} tons
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Ready to List</p>
            <p className="text-xl font-bold text-[#4f2d14]">
              {totals.processedNotListed.total.toFixed(2)} tons
            </p>
          </div>
          <div className="bg-white/50 rounded-lg p-2">
            <p className="text-xs text-[#7a5f41] font-semibold">Active Auctions</p>
            <p className="text-xl font-bold text-[#4f2d14]">
              {totals.listed.total.toFixed(2)} tons
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRFAnalytics;
