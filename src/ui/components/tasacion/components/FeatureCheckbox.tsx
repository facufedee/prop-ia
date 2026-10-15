// FeatureCheckbox component for Tasacion module
import React from 'react';

interface FeatureCheckboxProps {
  feature: string;
  checked: boolean;
  onChange: (feature: string, checked: boolean) => void;
}

export const FeatureCheckbox: React.FC<FeatureCheckboxProps> = ({
  feature,
  checked,
  onChange,
}) => {
  return (
    <label className="flex items-center space-x-2 p-1.5 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(feature, e.target.checked)}
        className="rounded border-[var(--color-rule)] text-[var(--color-ink)] focus:ring-[var(--color-rule)]"
      />
      <span className="text-xs text-[var(--color-ink-2)] capitalize truncate">{feature}</span>
    </label>
  );
};
