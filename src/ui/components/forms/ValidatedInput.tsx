"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";

interface ValidatedInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    validator?: (value: string) => { valid: boolean; message: string };
    formatter?: (value: string) => string;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    type?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    helpText?: string;
    showCharCount?: boolean;
}

export default function ValidatedInput({
    label,
    value,
    onChange,
    validator,
    formatter,
    placeholder,
    maxLength,
    required = false,
    type = "text",
    onKeyDown,
    helpText,
    showCharCount = false
}: ValidatedInputProps) {
    const [touched, setTouched] = useState(false);
    const [validation, setValidation] = useState<{ valid: boolean; message: string } | null>(null);

    useEffect(() => {
        if (touched && value && validator) {
            const result = validator(value);
            setValidation(result);
        } else if (!value) {
            setValidation(null);
        }
    }, [value, touched, validator]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Aplicar formateador si existe
        if (formatter) {
            newValue = formatter(newValue);
        }

        onChange(newValue);
    };

    const handleBlur = () => {
        setTouched(true);
    };

    const getStatusIcon = () => {
        if (!touched || !value) return null;

        if (validation?.valid) {
            return <Check className="w-5 h-5 text-green-600" />;
        } else if (validation && !validation.valid) {
            return <X className="w-5 h-5 text-red-600" />;
        }

        return null;
    };

    const getInputClasses = () => {
        const base = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors";

        if (!touched || !value) {
            return `${base} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
        }

        if (validation?.valid) {
            return `${base} border-green-500 focus:ring-green-500 focus:border-green-500`;
        } else if (validation && !validation.valid) {
            return `${base} border-red-500 focus:ring-red-500 focus:border-red-500`;
        }

        return `${base} border-gray-300 focus:ring-indigo-500 focus:border-indigo-500`;
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={getInputClasses()}
                />

                {getStatusIcon() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getStatusIcon()}
                    </div>
                )}
            </div>

            {/* Mensajes de ayuda y validación */}
            <div className="min-h-[20px]">
                {touched && validation && !validation.valid && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{validation.message}</span>
                    </div>
                )}

                {touched && validation?.valid && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        <span>{validation.message}</span>
                    </div>
                )}

                {!touched && helpText && (
                    <p className="text-sm text-gray-500">{helpText}</p>
                )}
            </div>

            {/* Contador de caracteres */}
            {showCharCount && maxLength && (
                <div className="text-right text-xs text-gray-500">
                    {value.length} / {maxLength}
                </div>
            )}
        </div>
    );
}
