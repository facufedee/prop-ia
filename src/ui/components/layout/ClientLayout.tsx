"use client";

import { usePathname } from "next/navigation";
import LandingNav from "@/ui/components/landing/LandingNav";
import Footer from "@/ui/components/layout/Footer";
import { AuthProvider } from "@/ui/context/AuthContext";
import { ThemeProvider } from "@/ui/context/ThemeContext";
import { landingHeading, landingSans } from "@/ui/sections/landingFonts";
import "@/ui/sections/landing-theme.css";
import "@/ui/sections/site-pages.css";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

    // The dashboard reuses the site palette through `.app-theme` (dark-only); public pages use `.landing-page`.
    if (isDashboard) {
        return (
            <ThemeProvider>
                <AuthProvider>
                    {/* `dark` lives here (not on <html>) so `dark:` variants only apply inside the dashboard. */}
                    <div className={`app-theme dark ${landingSans.variable} ${landingHeading.variable} font-sans min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]`}>
                        {children}
                    </div>
                </AuthProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <AuthProvider>
                <div className={`landing-page ${landingSans.variable} ${landingHeading.variable} flex min-h-screen flex-col`}>
                    {!isAuthPage && <LandingNav />}
                    <div className="flex flex-1 flex-col">{children}</div>
                    {!isAuthPage && <Footer />}
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
}
