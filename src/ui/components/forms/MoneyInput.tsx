import { useState, useEffect } from "react";

interface MoneyInputProps {
    value: number | string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

export const MoneyInput = ({
    value,
    onChange,
    placeholder = "0",
    className = "",
    label,
    required = false,
    disabled = false
}: MoneyInputProps) => {
    // Format number to Argentine Currency format (e.g. 1.234,56)
    const formatCurrency = (val: string | number) => {
        if (!val) return "";
        const numberVal = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(numberVal)) return "";

        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numberVal);
    };

    const [displayValue, setDisplayValue] = useState(formatCurrency(value));

    useEffect(() => {
        setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        // Allow only numbers and commas
        const cleanValue = rawValue.replace(/[^0-9,]/g, '');

        // Split decimal
        const parts = cleanValue.split(',');

        // Prevent multiple commas
        if (parts.length > 2) return;

        // Reconstruct for display
        // We don't update displayValue directly here fully formatted because it interferes with typing
        // Instead we keep the raw numeric input feel but visual formatting happens on blur or we do simple mask?
        // User requested "se pone automatico". standard approach: format as you type.

        // Current simple approach:
        // 1. Get digits only
        const digits = cleanValue.replace(/\D/g, '');

        if (!digits) {
            setDisplayValue("");
            onChange("");
            return;
        }

        // 2. Treat as integer or decimal if comma exist
        // Simple logic: remove dots, change comma to dot for parsing
        const numberForParse = cleanValue.replace(/\./g, '').replace(',', '.');
        onChange(numberForParse); // Send raw number string to parent "1234.56"

        // For display, we might want to manually format simple: 
        // 1000 -> 1.000
        // We'll update display on Blur to perfect format, but keep 'digits' while typing?
        // Let's rely on standard text input behavior for edit, and format on blur?
        // User said: "Nosotros le ponemos los puntos visualmente y que se ponga automatico"
        // This usually implies a mask.

        setDisplayValue(cleanValue);
    };

    const handleBlur = () => {
        // Re-format on blur to look pretty (add dots)
        setDisplayValue(formatCurrency(value));
    };

    const handleFocus = () => {
        // Remove dots for easier editing, keep comma
        if (value) {
            const raw = value.toString().replace('.', ',');
            // Note: JS number uses dot. es-AR uses comma.
            // value is likely "1234.56" string or number.
            // If string "1234.56", we want "1234,56" for editing
            setDisplayValue(value.toString().replace('.', ','));
        }
    };

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && "*"}
                </label>
            )}
            <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                    type="text"
                    inputMode="decimal"
                    disabled={disabled}
                    required={required}
                    className={`w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};
