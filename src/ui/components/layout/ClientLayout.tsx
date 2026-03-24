"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";
import Footer from "@/ui/components/layout/Footer";
import { AuthProvider } from "@/ui/context/AuthContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");
    // On the home page ("/") the Hero section already handles its own top padding
    // for the fixed navbar. For all other public pages we need to push content down.
    const isHome = pathname === "/";

    return (
        <AuthProvider>
            {!isDashboard && <Navbar />}
            <div className={!isDashboard && !isHome ? "pt-16 md:pt-0" : ""}>
                {children}
            </div>
            {!isDashboard && <Footer />}
        </AuthProvider>
    );
}
