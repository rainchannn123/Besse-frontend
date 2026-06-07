'use client';
import React, { useState } from 'react';

interface DynamicDropdownProps {
  label?: string;
  options: string[];
  selected?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  showOptionIcon?: boolean;
}

const DynamicDropdown: React.FC<DynamicDropdownProps> = ({
  options,
  selected,
  onSelect,
  disabled,
  showOptionIcon = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(selected || options[0]);

  const handleSelect = (value: string) => {
    if (disabled) return;
    setSelectedValue(value);
    setIsOpen(false);
    if (onSelect) onSelect(value);
  };

  return (
    <div className="flex justify-between ">
      {/* Dropdown */}
      <div className="relative inline-block">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`px-4 py-2 text-white rounded-[10px] font-roboto flex items-center justify-between min-w-[140px] ${
            disabled ? 'bg-[#8b6647] cursor-not-allowed' : 'bg-[#50704C] cursor-pointer'
          }`}
        >
          <span className="text-[20px]">{selectedValue}</span>
          {showOptionIcon && <span className="text-[15px] ml-2">▼</span>}
        </button>

        {isOpen && !disabled && (
          <div className="absolute mt-1 bg-white w-full rounded shadow-md z-10">
            {options.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-black font-roboto"
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDropdown;
