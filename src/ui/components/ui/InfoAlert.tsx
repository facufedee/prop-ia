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
        <div className="bg-sky-100 border border-sky-200 text-sky-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm mb-6 relative">
            <div className="flex items-center gap-3">
                <div className="bg-sky-200/50 p-1.5 rounded-full">
                    <Info size={20} className="text-sky-600" />
                </div>
                <div className="text-sm font-medium">
                    <span className="font-bold mr-1">INFO!</span>
                    {message}
                    {linkText && linkHref && (
                        <Link href={linkHref} className="ml-2 underline hover:text-sky-900 transition-colors">
                            {linkText}
                        </Link>
                    )}
                </div>
            </div>
            <button
                onClick={handleClose}
                className="text-sky-400 hover:text-sky-600 transition-colors p-1 rounded-md hover:bg-sky-200/50"
            >
                <X size={18} />
            </button>
        </div>
    );
}
