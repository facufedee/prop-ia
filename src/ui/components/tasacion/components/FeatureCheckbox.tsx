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
    <label className="flex items-center space-x-2 p-1.5 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(feature, e.target.checked)}
        className="rounded border-gray-300 text-black focus:ring-black"
      />
      <span className="text-xs text-gray-700 capitalize truncate">{feature}</span>
    </label>
  );
};
