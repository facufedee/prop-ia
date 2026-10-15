// InputField component for Tasacion module
import React from 'react';

interface InputFieldProps {
  name: string;
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  icon,
  type = 'text',
  placeholder = '',
  value,
  onChange,
}) => {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-muted)] pointer-events-none">
        {icon}
      </span>
      <input
        name={name}
        type={type}
        min={type === 'number' ? '0' : undefined}
        placeholder={label}
        value={value}
        onChange={onChange}
        className="w-full border bg-[var(--color-paper)] pl-10 p-3 rounded-xl text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-rule)] focus:bg-[var(--color-paper-2)] transition-all placeholder-transparent peer text-base min-h-[44px]"
      />
      <label className="absolute left-9 -top-2.5 text-[var(--color-muted)] text-xs bg-[var(--color-paper-2)] px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-ink)]">
        {label}
      </label>
    </div>
  );
};
