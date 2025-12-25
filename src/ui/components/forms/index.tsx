"use client";

import { useState } from "react";
import ValidatedInput from "./ValidatedInput";
import { validators, formatters, inputRestrictions } from "@/utils/validators";

interface DNIInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function DNIInput({ label = "DNI", value, onChange, required = false }: DNIInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validateDNI}
            formatter={formatters.formatDNI}
            placeholder="12345678"
            maxLength={8}
            required={required}
            type="tel"
            onKeyDown={inputRestrictions.onlyNumbers}
            helpText="7 u 8 dígitos sin puntos"
        />
    );
}

interface CUITInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function CUITInput({ label = "CUIT/CUIL", value, onChange, required = false }: CUITInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validateCUIT}
            formatter={formatters.formatCUIT}
            placeholder="20-12345678-9"
            maxLength={13}
            required={required}
            type="tel"
            helpText="Formato: XX-XXXXXXXX-X"
        />
    );
}

interface CBUInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function CBUInput({ label = "CBU", value, onChange, required = false }: CBUInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validateCBU}
            formatter={formatters.formatCBU}
            placeholder="0000000000000000000000"
            maxLength={23}
            required={required}
            type="tel"
            onKeyDown={inputRestrictions.onlyNumbers}
            helpText="22 dígitos"
        />
    );
}

interface EmailInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function EmailInput({ label = "Email", value, onChange, required = false }: EmailInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validateEmail}
            placeholder="ejemplo@email.com"
            maxLength={100}
            required={required}
            type="email"
            helpText="Dirección de correo electrónico"
        />
    );
}

interface PhoneInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function PhoneInput({ label = "Teléfono", value, onChange, required = false }: PhoneInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validatePhone}
            formatter={formatters.formatPhone}
            placeholder="1155551234"
            maxLength={15}
            required={required}
            type="tel"
            onKeyDown={inputRestrictions.onlyNumbers}
            helpText="10-15 dígitos sin espacios"
        />
    );
}

interface AliasInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export function AliasInput({ label = "Alias", value, onChange, required = false }: AliasInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            validator={validators.validateAlias}
            formatter={formatters.formatAlias}
            placeholder="mi.alias.banco"
            maxLength={20}
            required={required}
            onKeyDown={inputRestrictions.alphanumericDot}
            helpText="Letras, números y puntos"
        />
    );
}

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    showCharCount?: boolean;
}

export function TextInput({
    label,
    value,
    onChange,
    placeholder,
    maxLength = 200,
    required = false,
    showCharCount = true
}: TextInputProps) {
    return (
        <ValidatedInput
            label={label}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            showCharCount={showCharCount}
        />
    );
}

interface TextAreaInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    rows?: number;
}

export function TextAreaInput({
    label,
    value,
    onChange,
    placeholder,
    maxLength = 2000,
    required = false,
    rows = 4
}: TextAreaInputProps) {
    const [touched, setTouched] = useState(false);

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                onBlur={() => setTouched(true)}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />

            <div className="flex justify-between text-xs text-gray-500">
                <span>{touched && value.length === 0 && required ? "Campo requerido" : ""}</span>
                <span>{value.length} / {maxLength}</span>
            </div>
        </div>
    );
}

// Exportar todos los componentes
export { ValidatedInput };
