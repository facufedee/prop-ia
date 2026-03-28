// SelectField component for Tasacion module
import React from 'react';

interface SelectFieldProps {
  name: string;
  label: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  icon,
  options,
  value,
  disabled = false,
  onChange,
}) => {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
        {icon}
      </span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border bg-gray-50 pl-10 p-3 rounded-xl text-black focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none disabled:bg-gray-100 disabled:text-gray-400 text-base min-h-[44px]"
      >
        <option value="">{disabled ? `Selecciona ${label.toLowerCase()} primero` : label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <label className="absolute left-9 -top-2.5 text-gray-500 text-xs bg-white px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-black">
        {label}
      </label>
    </div>
  );
};
