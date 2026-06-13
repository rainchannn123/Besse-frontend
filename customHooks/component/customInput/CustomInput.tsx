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
    <div className={`flex flex-col w-full min-w-0 mb-4 relative ${className || ''}`}>
      {label && (
        <label className="mb-2 block text-[20px] md:text-[24px] font-semibold text-[#f3f7f2] tracking-[0.01em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">{label}</label>
      )}

      <div className="relative w-full min-w-0">
        <input
          {...field}
          type={inputType}
          placeholder={placeholder}
          onChange={handleChange}
          className={`w-full max-w-full min-w-0 px-4 pr-12 focus:outline-none h-[56px] md:h-[60px] border bg-[#f6fbf8] rounded-md shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)] transition duration-150 ease-in-out text-[#1f2b22] text-base placeholder:text-[#5f6d63] placeholder:text-[16px] md:placeholder:text-[18px] ${
            error
              ? 'border-red-400 focus:ring-2 focus:ring-red-300'
              : 'border-[#b7c8bd] focus:ring-2 focus:ring-[#9ed7b4]'
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
