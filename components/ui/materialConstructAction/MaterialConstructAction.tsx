'use client';

import sideArrow from '@/public/assets/images/sideArrow.png';
import { CityProject, MaterialType } from '@/types/besse';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';

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

  // Determine which projects can be selected
  const selectableProjects = useMemo(() => {
    // Show all incomplete projects; backend now allows free project selection.
    return cityProjects.filter((p) => !p.completed);
  }, [cityProjects]);

  // Get the required amount for the selected material in the selected project
  const requiredMaterialAmount = useMemo(() => {
    if (!selectedProject) return 0;
    return selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0;
  }, [selectedProject, selectedMaterial]);

  // Check if selected material matches the project's required materials
  const isValidMaterialType = useMemo(() => {
    if (!selectedProject) return false;
    return (
      selectedMaterial in selectedProject.requiredMaterials &&
      (selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0) > 0
    );
  }, [selectedProject, selectedMaterial]);

  // Maximum amount that can be contributed (no limit, can use entire inventory)
  const maxContributionAmount = availableAmount;

  // Check if project can still accept more of this material
  const remainingRequired = useMemo(() => {
    if (!selectedProject) return 0;
    const required = selectedProject.requiredMaterials[selectedMaterial as MaterialType] || 0;
    const added = (selectedProject.addedMaterials as any)?.[selectedMaterial] || 0;
    return Math.max(0, required - added);
  }, [selectedProject, selectedMaterial]);

  return (
    <div className="bg-white border-4 border-dashed border-[#b18c5a] rounded-md p-4">
      <h3 className="text-center 2xl:text-[35px] xl:text-[28px] lg:text-[35px] text-[35px] font-bold text-black mb-1">
        Construct Project
      </h3>
      <div className="h-0.5 mx-4 bg-[#A99065] mb-3"></div>

      <div className="mb-4">
        <p className="text-lg font-semibold">Selected Material: {selectedMaterial}</p>
        <p className="text-sm text-gray-600">Available: {availableAmount.toFixed(2)} tons</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Project:</label>
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
              <p>
                <span className="font-medium">Name:</span> {selectedProject.name}
              </p>
              <p>
                <span className="font-medium">Progress:</span> {selectedProject.progress}%
              </p>
              <p>
                <span className="font-medium">Health Bonus:</span> +{selectedProject.healthBonus}%
              </p>
              <p>
                <span className="font-medium">Budget Bonus:</span> +${(selectedProject.budgetBonus ?? 0).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Required Materials Section */}
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

          {/* Material Type Validation Warning */}
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

          {/* Material Input Section */}
          {isValidMaterialType && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Material Amount (tons) - Available: {availableAmount.toFixed(2)}t, Needed:{' '}
                {remainingRequired.toFixed(2)}t
              </label>

              {/* Contribute Full Amount Checkbox */}
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
                  Contribute full available amount
                </label>
              </div>

              <input
                type="text"
                inputMode="decimal"
                value={materialAmount > 0 ? materialAmount.toString() : ''}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Allow free typing, just parse and validate on the fly
                  const value = inputValue === '' ? 0 : parseFloat(inputValue);

                  if (!isNaN(value)) {
                    const maxAllowed = Math.min(availableAmount, remainingRequired);
                    // Clamp the value to max allowed
                    const clamped = Math.min(Math.max(0, value), maxAllowed);
                    setMaterialAmount(clamped);
                    // Uncheck the full contribution checkbox if user manually edits
                    if (value !== maxAllowed) {
                      setContributeFull(false);
                    }
                  }
                }}
                placeholder={`Max: ${Math.min(availableAmount, remainingRequired).toFixed(2)}t`}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-600 mt-1">
                Enter the amount to contribute (max:{' '}
                {Math.min(availableAmount, remainingRequired).toFixed(2)}t)
              </p>
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
