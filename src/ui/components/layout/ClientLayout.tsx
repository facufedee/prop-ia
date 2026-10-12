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

    // The app keeps its own design system; every public page shares the site theme.
    if (isDashboard) {
        return (
            <ThemeProvider>
                <AuthProvider>{children}</AuthProvider>
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
