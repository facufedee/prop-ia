"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";
import Footer from "@/ui/components/layout/Footer";
import ChristmasModal from "@/ui/components/modals/ChristmasModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <>
            {!isDashboard && <Navbar />}
            {children}
            {!isDashboard && <Footer />}
            <ChristmasModal />
        </>
    );
}
