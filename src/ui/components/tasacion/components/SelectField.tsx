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
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-muted)] pointer-events-none">
        {icon}
      </span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border bg-[var(--color-paper)] pl-10 p-3 rounded-xl text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-rule)] focus:bg-[var(--color-paper-2)] transition-all appearance-none disabled:bg-[var(--color-paper-3)] disabled:text-[var(--color-neutral)] text-base min-h-[44px]"
      >
        <option value="">{disabled ? `Selecciona ${label.toLowerCase()} primero` : label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <label className="absolute left-9 -top-2.5 text-[var(--color-muted)] text-xs bg-[var(--color-paper-2)] px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-ink)]">
        {label}
      </label>
    </div>
  );
};
