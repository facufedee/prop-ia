import Hero from "@/ui/sections/Hero";
import Features from "@/ui/sections/Features";
import { Pricing } from "@/ui/sections/Pricing";
import { HowItWorks } from "@/ui/sections/HowItWorks";
import { MockupSection } from "@/ui/sections/MockupSection";
import { FAQ } from "@/ui/sections/FAQ";
import { CTA } from "@/ui/sections/CTA";


export default function LandingPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col gap-20">
            <Hero />
            <Features />
            <HowItWorks />
            <MockupSection />
            <Pricing />
            <FAQ />
            <CTA />
        </main>
    );
}