'use client';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Control, useController } from 'react-hook-form';
interface CustomInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  type?: string;
  rules?: object;
  onChange?: (value: string) => void;
  className?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  rules,
  onChange,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e);
    if (onChange) onChange(e.target.value);
  };

  // Determine input type based on password visibility
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`flex flex-col w-full mb-4 relative ${className || ''}`}>
      {label && (
        <label className="mb-2 block text-[30px] font-medium greenTextColor">{label}</label>
      )}

      <div className="relative">
        <input
          {...field}
          type={inputType}
          placeholder={placeholder}
          onChange={handleChange}
          className={`px-4 focus:outline-none focus:ring-0 lg:w-[682px] md:w-[550px]  sm:w-[500px]  w-full flex items-center h-[60px] border borderColor bg-white rounded-none shadow-sm transition duration-150 ease-in-out text-base placeholder:text-[#000000] placeholder:text-[26px] ${
            error ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
          }`}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-700 transition duration-150 ease-in-out"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={24} color="#33552C" /> : <Eye size={24} />}
          </button>
        )}
      </div>

      {error && <span className="text-red-500 text-sm mt-1">{error.message}</span>}
    </div>
  );
};

export default CustomInput;
