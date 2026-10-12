import ContactForm from "@/ui/sections/ContactForm";
import { PrimaryCta } from "@/ui/sections/PhotoHero";

export const metadata = {
    title: "Contacto",
    description: "Contactá al equipo de Zeta Prop por consultas sobre el software, los planes o cómo empezar con tu inmobiliaria. Escribinos por el formulario o WhatsApp.",
    alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
    return (
        <main className="flex-1">
            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="contacto-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">Contacto</p>
                        <h1 id="contacto-title" className="s-page-title">
                            ¿Listo para potenciar tu inmobiliaria?
                        </h1>
                        <p className="s-page-lede">
                            Crea tu cuenta gratuita ahora mismo o envíanos un mensaje para resolver cualquier duda que tengas sobre la plataforma.
                        </p>
                        <div className="l-hero__ctas s-page-head__actions">
                            <PrimaryCta href="/register">Comenzar gratis (14 días)</PrimaryCta>
                        </div>
                    </div>
                </div>
            </section>

            <ContactForm />
        </main>
    );
}
