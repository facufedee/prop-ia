"use client";


import { Info, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface InfoAlertProps {
    message: string;
    linkText?: string;
    linkHref?: string;
    onClose?: () => void;
}

export default function InfoAlert({ message, linkText, linkHref, onClose }: InfoAlertProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    return (
        <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] border-l-2 border-l-[var(--color-accent)] text-[var(--color-ink-2)] px-4 py-3 rounded-lg flex items-center justify-between mb-6 relative">
            <div className="flex items-center gap-3">
                <Info size={18} strokeWidth={1.5} className="shrink-0 text-[var(--color-accent)]" />
                <div className="text-sm font-medium">
                    <span className="font-semibold text-[var(--color-ink)] mr-1">Info:</span>
                    {message}
                    {linkText && linkHref && (
                        <Link href={linkHref} className="ml-2 underline text-[var(--color-accent)] hover:text-[var(--color-accent-2)] transition-colors">
                            {linkText}
                        </Link>
                    )}
                </div>
            </div>
            <button
                onClick={handleClose}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors p-1 rounded-md hover:bg-[var(--color-paper-3)]"
                aria-label="Cerrar"
            >
                <X size={16} strokeWidth={1.5} />
            </button>
        </div>
    );
}
