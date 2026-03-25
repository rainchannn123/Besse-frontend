'use client';

import { CityProject, Material, WasteBatch } from '@/types/besse';
import React from 'react';

interface PendingAuction {
  id?: string; // Make optional
  auctionId?: string; // Add this
  materialType: string;
  mass: number;
  createdAt?: string;
  grade?: string;
  currentBid?: number;
}

interface SelectedBoxProps {
  from?: string;
  wasteBatches?: WasteBatch[] | Material[] | CityProject[] | PendingAuction[];
  selectedBatch?: WasteBatch | Material | CityProject | PendingAuction | null;
  setSelectedBatch?: (batch: WasteBatch | Material | CityProject | PendingAuction) => void;
}

export const SelectedBox: React.FC<SelectedBoxProps> = ({
  from,
  wasteBatches = [],
  selectedBatch,
  setSelectedBatch,
}) => {
  // Check if the items are city projects or pending auctions
  const isCityProjects = wasteBatches.length > 0 && 'requiredMaterials' in wasteBatches[0];
  const isPendingAuctions =
    wasteBatches.length > 0 && 'materialType' in wasteBatches[0] && 'createdAt' in wasteBatches[0];

  return (
    <div className="w-full flex justify-center mt-8 pb-6">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 w-full p-4 h-[600px] overflow-y-auto">
        {wasteBatches.map((batch, index) => {
          const isMaterial = 'type' in batch;
          const isProject = 'requiredMaterials' in batch;
          const isPendingAuction = from === 'mrf-pending-auctions';
          if (isPendingAuction) {
            const auction = batch as PendingAuction;
            // Use auctionId if available, otherwise use id
            const auctionId = auction.auctionId || auction.id;
            return (
              <div
                onClick={() => setSelectedBatch && setSelectedBatch(auction)}
                key={auctionId}
                className="bg-white w-full h-[300px] rounded-lg shadow-lg p-4 flex flex-col"
              >
                {/* Auction Info */}
                <div className="text-center py-4 flex-shrink-0">
                  <h3 className="font-bold text-lg text-gray-800 capitalize">
                    {auction.materialType}
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {Number(auction.mass).toFixed(2)}t
                  </p>
                </div>

                <div className="mb-4 flex-grow">
                  <p className="text-center text-sm text-gray-600">
                    Pending grade assignment and price
                  </p>
                </div>

                {/* Radio button */}
                <div className="flex items-center justify-center pb-2 flex-shrink-0">
                  <input
                    type="radio"
                    id={`radio-${auction.id}`}
                    name="select"
                    value={auction.id}
                    className="w-5 h-5 accent-[#3A7D2C]"
                    onChange={() => setSelectedBatch && setSelectedBatch(auction)}
                    checked={selectedBatch?.id === auction.id}
                  />
                  <label
                    htmlFor={`radio-${auction.id}`}
                    className="ml-2 text-black font-bold text-xl"
                  >
                    Select
                  </label>
                </div>
              </div>
            );
          }

          if (isProject) {
            const project = batch as CityProject;
            return (
              <div
                key={project.id}
                className="bg-white w-full h-[300px] rounded-lg shadow-lg p-4 flex flex-col"
              >
                {/* Project Info */}
                <div className="text-center py-4 flex-shrink-0">
                  <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.completed ? 'Completed' : `Progress: ${project.progress}%`}
                  </p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Health Bonus: +{project.healthBonus}%
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">
                    Budget Bonus: +${(project.budgetBonus ?? 0).toFixed(0)}
                  </p>
                </div>

                {/* Required Materials */}
                <div className="mb-4 flex-grow overflow-y-auto">
                  <h4 className="font-semibold text-sm mb-2">Required Materials:</h4>
                  <div className="space-y-1 text-xs">
                    {Object.entries(project.requiredMaterials).map(([material, amount]) => (
                      <div key={material} className="flex justify-between">
                        <span className="capitalize">{material}:</span>
                        <span>{(amount || 0).toFixed(2)}t</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radio button */}
                <div className="flex items-center justify-center pb-2 flex-shrink-0">
                  <input
                    type="radio"
                    id={`radio-${project.id}`}
                    name="select"
                    value={project.id}
                    className="w-5 h-5 accent-[#3A7D2C]"
                    onChange={() => setSelectedBatch && setSelectedBatch(project)}
                    checked={selectedBatch?.id === project.id}
                    disabled={project.completed}
                  />
                  <label
                    htmlFor={`radio-${project.id}`}
                    className="ml-2 text-black font-bold text-xl"
                  >
                    Select
                  </label>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`${batch.id}-${(batch as any).mass}-${
                isMaterial ? (batch as Material).type : (batch as WasteBatch).origin
              }-${isMaterial ? (batch as Material).quality : (batch as WasteBatch).status}`}
              className="bg-white w-full  h-[300px] rounded-lg shadow-lg p-4"
            >
              {/* Batch Info */}
              <div className="text-center py-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {isMaterial ? (batch as Material).type : (batch as WasteBatch).origin + ' Waste'}
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {Number((batch as any).mass).toFixed(2)}t
                </p>
                <p className="text-sm text-gray-600">
                  {isMaterial
                    ? `Quality: ${(batch as Material).quality}`
                    : `Status: ${(batch as WasteBatch).status}`}
                </p>
              </div>

              {/* Composition or Details */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">
                  {isMaterial ? 'Details:' : 'Composition:'}
                </h4>
                <div className="space-y-1 text-xs">
                  {isMaterial ? (
                    <>
                      {/* <div className="flex justify-between">
                        <span>Contamination:</span>
                        <span>{Number((batch as Material).contamination).toFixed(2)}%</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span>Owner:</span>
                        <span>{(batch as Material).owner}</span>
                      </div>
                    </>
                  ) : (
                    Object.entries((batch as WasteBatch).composition).map(
                      ([material, percentage]) => (
                        <div key={material} className="flex justify-between">
                          <span className="capitalize">{material}:</span>
                          <span>{(percentage * 100).toFixed(2)}%</span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Radio button */}
              <div className="flex items-center justify-center pb-6">
                <input
                  type="radio"
                  id={`radio-${batch.id}`}
                  name="select"
                  value={batch.id}
                  className="w-5 h-5 accent-[#3A7D2C]"
                  onChange={() => setSelectedBatch && setSelectedBatch(batch)}
                  checked={selectedBatch?.id === batch.id}
                />
                <label htmlFor={`radio-${batch.id}`} className="ml-2 text-black font-bold text-xl">
                  Select
                </label>
              </div>
            </div>
          );
        })}

        {/* Fill remaining slots if less than 5 batches */}
        {[...Array(Math.max(0, 6 - wasteBatches.length))].map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-100  h-[307px] rounded-lg shadow-lg flex items-center justify-center"
          >
            <p className="text-gray-500">No waste batch available</p>
          </div>
        ))}
      </div>
    </div>
  );
};
