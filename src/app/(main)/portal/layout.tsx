"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [branding, setBranding] = useState<{ logoUrl?: string; agencyName?: string } | null>(null);

    useEffect(() => {
        // Attempt to load branding from localStorage (set during login)
        // This allows basic persistence of the logo on refresh without re-fetching immediately 
        // (though real state should probably be in a Context or fetched via session)
        const stored = localStorage.getItem('portal_branding');
        if (stored) {
            try {
                setBranding(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            {/* Portal Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between">
                <div className="flex items-center gap-3">
                    {branding?.logoUrl ? (
                        <img src={branding.logoUrl} alt="Agency Logo" className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                T
                            </div>
                            <span className="font-bold text-xl text-gray-900">Portal Inquilino</span>
                        </div>
                    )}
                    {branding?.agencyName && <span className="text-sm text-gray-500 border-l pl-3 ml-3 border-gray-300">{branding.agencyName}</span>}
                </div>
                <div className="text-sm text-gray-500">
                    Ayuda
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}
