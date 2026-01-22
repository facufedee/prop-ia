export function CTA() {
    return (
        <section className="py-28 bg-black text-white text-center px-6">
            <h2 className="text-4xl font-bold mb-4">Probá Zeta Prop gratis</h2>
            <p className="text-gray-300 max-w-xl mx-auto mb-8">
                Comenzá ahora y descubrí cómo la IA puede transformar tu negocio inmobiliario.
            </p>
            <a
                href="/dashboard"
                className="bg-white text-black px-10 py-4 rounded-xl text-lg font-semibold hover:bg-gray-200 transition"
            >
                Empezar ahora
            </a>
        </section>
    );
}