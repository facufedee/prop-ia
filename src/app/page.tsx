import Hero from "@/ui/sections/Hero";
import Features from "@/ui/sections/Features";
import Testimonials from "@/ui/sections/Testimonials";
import ContactForm from "@/ui/sections/ContactForm";
import Footer from "@/ui/components/layout/Footer";
import GoogleAuthPrompt from "@/ui/components/auth/GoogleAuthPrompt";

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