import ContactForm from "@/ui/sections/ContactForm";
import Link from "next/link";

export const metadata = {
    title: "Contacto | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Contacta con el equipo de Zeta Prop. Estamos para ayudarte a potenciar tu inmobiliaria con nuestra tecnología.",
};

export default function ContactPage() {
    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-5 sm:px-6 bg-[#080810]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#080810] to-purple-950/60 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-semibold mb-6">
                        Contacto
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
                        ¿Listo para potenciar
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            tu inmobiliaria?
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Crea tu cuenta gratuita ahora mismo o envíanos un mensaje para resolver cualquier duda que tengas sobre la plataforma.
                    </p>
                    <div className="flex justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Comenzar gratis (14 días)
                        </Link>
                    </div>
                </div>
            </section>

            <ContactForm />
        </main>
    );
}
