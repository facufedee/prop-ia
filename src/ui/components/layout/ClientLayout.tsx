"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <>
            {!isDashboard && <Navbar />}
            {children}
        </>
    );
}
