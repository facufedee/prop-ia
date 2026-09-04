"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";
import Footer from "@/ui/components/layout/Footer";
import { AuthProvider } from "@/ui/context/AuthContext";
import { ThemeProvider } from "@/ui/context/ThemeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    const isAuthPage = pathname === "/login" || pathname === "/register";
    const isHome = pathname === "/";
    // The home page ships its own dark-theme nav/footer (LandingNav/LandingFooter) —
    // the global light-theme Navbar/Footer would visually clash with it.
    const hideChrome = isDashboard || isAuthPage || isHome;

    return (
        <ThemeProvider>
        <AuthProvider>
            {!hideChrome && <Navbar />}
            <div className={!hideChrome && !isHome ? "pt-16 md:pt-0" : ""}>
                {children}
            </div>
            {!hideChrome && <Footer />}
        </AuthProvider>
        </ThemeProvider>
    );
}
