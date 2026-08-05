"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";
import Footer from "@/ui/components/layout/Footer";
import { AuthProvider } from "@/ui/context/AuthContext";
import { ThemeProvider } from "@/ui/context/ThemeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    const isLogin = pathname === "/login";
    const hideChrome = isDashboard || isLogin;
    // On the home page ("/") the Hero section already handles its own top padding
    // for the fixed navbar. For all other public pages we need to push content down.
    const isHome = pathname === "/";

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
