export function Pricing() {
    const plans = [
        {
            name: "Starter",
            price: "$0",
            desc: "Ideal para explorar la plataforma",
            features: ["5 propiedades", "1 tasación/día", "Dashboard básico"],
        },
        {
            name: "Pro",
            price: "$19/mo",
            desc: "Perfecto para profesionales inmobiliarios",
            features: ["Propiedades ilimitadas", "Tasaciones ilimitadas", "CRM integrado", "Publicación multiplataforma"],
        },
        {
            name: "Business",
            price: "$49/mo",
            desc: "Equipos y agencias inmobiliarias",
            features: ["Todo lo del Pro", "Usuarios del equipo", "Reportes avanzados", "Automatizaciones"],
        },
    ];

    return (
        <section id="pricing" className="py-24 bg-white px-6 scroll-mt-20">
            <div className="max-w-6xl mx-auto text-center mb-16">
                <h2 className="text-4xl font-bold">Planes que crecen con vos</h2>
                <p className="text-gray-600 mt-2">Elegí el plan que mejor se adapta a tu negocio.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {plans.map((p, i) => (
                    <div key={i} className="border rounded-2xl p-8 shadow-sm bg-gray-50">
                        <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
                        <p className="text-4xl font-bold mb-3">{p.price}</p>
                        <p className="text-gray-600 mb-6">{p.desc}</p>

                        <ul className="text-gray-700 space-y-2 mb-6">
                            {p.features.map((f, idx) => (
                                <li key={idx}>✔ {f}</li>
                            ))}
                        </ul>

                        <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition">
                            Elegir
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}