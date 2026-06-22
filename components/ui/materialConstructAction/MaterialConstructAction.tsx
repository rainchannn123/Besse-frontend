'use client';

import sideArrow from '@/public/assets/images/sideArrow.png';
import { CityProject, MaterialType } from '@/types/besse';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';

// CO₂ emission factors per ton (same as backend)
const CO2_EMISSION_FACTORS: Record<MaterialType, number> = {
  paper: 0.8,
  plastic: 2.5,
  metal: 1.5,
  glass: 0.6,
  wood: 0.3,
};

interface MaterialConstructActionProps {
  selectedMaterial: string;
  cityProjects: CityProject[];
  selectedProject: CityProject | null;
  setSelectedProject: (project: CityProject | null) => void;
  municipalInventory?: Record<MaterialType, number>;
  handleConstructProject?: (
    materialType: string,
    projectId: string,
    materialAmount: number
  ) => void;
}

export const MaterialConstructAction: React.FC<MaterialConstructActionProps> = ({
  selectedMaterial,
  cityProjects,
  selectedProject,
  setSelectedProject,
  municipalInventory = {
    paper: 0,
    plastic: 0,
    metal: 0,
    glass: 0,
    wood: 0,
  },
  handleConstructProject,
}) => {
  const [materialAmount, setMaterialAmount] = useState<number>(0);
  const [contributeFull, setContributeFull] = useState<boolean>(false);

  const availableAmount = municipalInventory[selectedMaterial as MaterialType] || 0;

  const selectableProjects = useMemo(() => {
    return cityProjects.filter((p) => !p.completed);
  }, [cityProjects]);

  const requiredMaterialAmount = useMemo(() => {
    if (!selectedProject) return 0;
    return selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0;
  }, [selectedProject, selectedMaterial]);

  const isValidMaterialType = useMemo(() => {
    if (!selectedProject) return false;
    return (
      selectedMaterial in selectedProject.requiredMaterials &&
      (selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0) > 0
    );
  }, [selectedProject, selectedMaterial]);

  const maxContributionAmount = availableAmount;
  const remainingRequired = useMemo(() => {
    if (!selectedProject) return 0;
    const required = selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0;
    const added = (selectedProject.addedMaterials as any)?.[selectedMaterial] || 0;
    return Math.max(0, required - added);
  }, [selectedProject, selectedMaterial]);

  // Calculate CO₂ emission for the selected amount
  const co2Emission = useMemo(() => {
    const factor = CO2_EMISSION_FACTORS[selectedMaterial as MaterialType] || 0;
    return materialAmount * factor;
  }, [materialAmount, selectedMaterial]);

  return (
    <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-2">
      <h3 className="text-center 2xl:text-[30px] xl:text-[24px] lg:text-[30px] text-[30px] font-bold text-black mb-1">
        Project Construction
      </h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      {/* <div className="mb-4">
        <p className="text-lg font-semibold">Selected Material: {selectedMaterial}</p>
        <p className="text-sm text-gray-600">Available: {availableAmount.toFixed(2)} tons</p>
      </div> */}

      <div className="mb-4">
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = selectableProjects.find((p) => p.id === e.target.value);
            setSelectedProject(project || null);
            setMaterialAmount(0);
            setContributeFull(false);
          }}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a project</option>
          {selectableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProject && (
        <>
          <div className="mb-4 bg-gray-50 p-3 rounded-md">
            <h4 className="font-semibold text-sm mb-2">Project Details:</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {selectedProject.name}</p>
              <p><span className="font-medium">Progress:</span> {selectedProject.progress}%</p>
              <p><span className="font-medium">Health Bonus:</span> +{selectedProject.healthBonus}%</p>
              <p><span className="font-medium">Budget Bonus:</span> +${(selectedProject.budgetBonus ?? 0).toFixed(0)}</p>
            </div>
          </div>

          <div className="mb-4 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
            <h4 className="font-semibold text-sm mb-2">Required Materials:</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(selectedProject.requiredMaterials).map(([material, amount]) => {
                const materialType = material as MaterialType;
                const isCurrentMaterial = materialType === selectedMaterial;
                const required = amount as number;
                const added = (selectedProject.addedMaterials as any)?.[material] || 0;
                const remaining = Math.max(0, required - added);

                return (
                  <div
                    key={material}
                    className={`flex flex-col gap-1 p-2 rounded ${
                      isCurrentMaterial
                        ? 'bg-green-100 border border-green-400'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="capitalize font-medium">{material}:</span>
                      <span className="text-xs text-gray-600">
                        Required: {required.toFixed(2)}t
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Added: {added.toFixed(2)}t</span>
                      <span className="text-xs font-semibold text-orange-600">
                        Remaining: {remaining.toFixed(2)}t
                      </span>
                    </div>
                    {isCurrentMaterial && remaining > 0 && (
                      <p className="text-xs text-green-700 font-semibold">✓ Can contribute</p>
                    )}
                    {isCurrentMaterial && remaining <= 0 && (
                      <p className="text-xs text-gray-600 font-semibold">✓ Complete</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isValidMaterialType && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <p className="text-sm text-red-700 font-medium">
                ⚠ This project does not require "{selectedMaterial}" material.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Please select a material that is required by this project.
              </p>
            </div>
          )}

          {isValidMaterialType && (
            <div className="mb-4">

              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="contributeFull"
                  checked={contributeFull}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setContributeFull(checked);
                    if (checked) {
                      const maxAllowed = Math.min(availableAmount, remainingRequired);
                      setMaterialAmount(maxAllowed);
                    } else {
                      setMaterialAmount(0);
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="contributeFull" className="text-sm text-gray-700 cursor-pointer">
                  Contribute all available amount
                </label>
              </div>

              <input
                type="text"
                inputMode="decimal"
                value={materialAmount > 0 ? materialAmount.toString() : ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const value = inputValue === '' ? 0 : parseFloat(inputValue);

                  if (!isNaN(value)) {
                    const maxAllowed = Math.min(availableAmount, remainingRequired);
                    const clamped = Math.min(Math.max(0, value), maxAllowed);
                    setMaterialAmount(clamped);
                    if (value !== maxAllowed) {
                      setContributeFull(false);
                    }
                  }
                }}
                placeholder={`Max: ${Math.min(availableAmount, remainingRequired).toFixed(2)} tonnes`}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {materialAmount > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠ CO₂ to be emitted: {co2Emission.toFixed(2)} tons
                </p>
              )}
            </div>
          )}

          <button
            onClick={() =>
              handleConstructProject &&
              handleConstructProject(selectedMaterial, selectedProject!.id, materialAmount)
            }
            disabled={
              materialAmount <= 0 ||
              materialAmount > maxContributionAmount ||
              !isValidMaterialType ||
              !selectedProject
            }
            className="w-full bg-[#50704C] hover:bg-[#5a8a42] flex justify-around rounded-[5px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <p></p>
            <p className="text-white py-2 rounded-[5px] font-bold 2xl:text-[24px] xl:text-[16px] lg:text-[24px] text-[24px]">
              Construct
            </p>
            <div className="flex items-center">
              <div className="bg-[#C0D066] w-[33px] h-[33px] rounded-[50%] flex justify-center items-center">
                <Image src={sideArrow} alt="sideArrow" />
              </div>
            </div>
          </button>
        </>
      )}
    </div>
  );
};