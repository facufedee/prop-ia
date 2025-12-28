import dynamic from "next/dynamic";
import Hero from "@/ui/sections/Hero";

const Features = dynamic(() => import("@/ui/sections/Features"));
const Testimonials = dynamic(() => import("@/ui/sections/Testimonials"));
const PropertyNetworkCTA = dynamic(() => import("@/ui/sections/PropertyNetworkCTA"));
const ContactForm = dynamic(() => import("@/ui/sections/ContactForm"));

const GoogleAuthPrompt = dynamic(() => import("@/ui/components/auth/GoogleAuthPrompt"));

const LatestBlogPosts = dynamic(() => import("@/ui/sections/LatestBlogPosts"));
const FAQ = dynamic(() => import("@/ui/sections/FAQ"));

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
            {/* Testimonials removed as per user request */}
            {/* <Testimonials /> */}
            <PropertyNetworkCTA />
            <LatestBlogPosts />
            <FAQ />
            <ContactForm />

        </main>
    );
}