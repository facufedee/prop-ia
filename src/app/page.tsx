import Hero from "@/ui/sections/Hero";
import Features from "@/ui/sections/Features";
import { Pricing } from "@/ui/sections/Pricing";
import { HowItWorks } from "@/ui/sections/HowItWorks";
import { MockupSection } from "@/ui/sections/MockupSection";
import { FAQ } from "@/ui/sections/FAQ";
import { CTA } from "@/ui/sections/CTA";
import Footer from "@/ui/components/layout/Footer";


export default function LandingPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col gap-0">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "PROP-IA",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Plataforma de tasación inmobiliaria con Inteligencia Artificial para Argentina.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.8",
                            "ratingCount": "1250"
                        }
                    })
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "PROP-IA",
                        "url": "https://prop-ia.com",
                        "logo": "https://prop-ia.com/logo.png",
                        "sameAs": [
                            "https://twitter.com/propia",
                            "https://linkedin.com/company/propia"
                        ]
                    })
                }}
            />
            <Hero />
            <Features />
            <HowItWorks />
            <MockupSection />
            <Pricing />
            <FAQ />
            <CTA />
            <Footer />
        </main>
    );
}