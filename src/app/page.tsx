import dynamic from "next/dynamic";
import Hero from "@/ui/sections/Hero";

const Features = dynamic(() => import("@/ui/sections/Features"));
const Testimonials = dynamic(() => import("@/ui/sections/Testimonials"));
const ContactForm = dynamic(() => import("@/ui/sections/ContactForm"));
const Footer = dynamic(() => import("@/ui/components/layout/Footer"));
const GoogleAuthPrompt = dynamic(() => import("@/ui/components/auth/GoogleAuthPrompt"), {
    ssr: false
});

export default function LandingPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col gap-0">
            <GoogleAuthPrompt />

            {/* Structured Data for Software Application */}
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

            <Hero />
            <Features />
            <Testimonials />
            <ContactForm />
            <Footer />
        </main>
    );
}