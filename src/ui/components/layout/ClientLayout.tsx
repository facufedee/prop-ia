"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/ui/components/layout/navbar/Navbar";
import Footer from "@/ui/components/layout/Footer";
import { AuthProvider } from "@/ui/context/AuthContext";

import OnboardingTour from "../onboarding/OnboardingTour";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <AuthProvider>
            <OnboardingTour />
            {!isDashboard && <Navbar />}
            {children}
            {!isDashboard && <Footer />}
        </AuthProvider>
    );
}
