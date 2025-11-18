export function HowItWorks() {
const steps = [
{ title: "1. Cargá los datos", desc: "Ingresá información básica de la propiedad" },
{ title: "2. Ejecutá la tasación", desc: "La IA analiza el mercado y genera un valor estimado" },
{ title: "3. Gestioná y publicá", desc: "Administrá la propiedad y publicala en portales" },
];


return (
<section className="py-24 bg-gray-50 px-6">
<div className="max-w-5xl mx-auto text-center mb-12">
<h2 className="text-4xl font-bold">¿Cómo funciona?</h2>
<p className="text-gray-600 mt-2">PROP-IA simplifica todo el proceso inmobiliario.</p>
</div>


<div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
{steps.map((s, i) => (
<div key={i} className="bg-white p-8 rounded-2xl border shadow-sm text-center">
<h3 className="text-2xl font-semibold mb-3">{s.title}</h3>
<p className="text-gray-600">{s.desc}</p>
</div>
))}
</div>
</section>
);
}