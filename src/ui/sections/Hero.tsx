export default function Hero() {
return (
<section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
<h1 className="text-5xl font-bold text-gray-900 max-w-3xl leading-tight">
Tu plataforma inmobiliaria con <span className="text-black">inteligencia artificial</span>
</h1>
<p className="text-gray-600 mt-4 max-w-xl text-lg">
Gestioná propiedades, tasá inmuebles en segundos y optimizá tus decisiones con datos reales.
</p>


<a
href="/dashboard"
className="mt-8 bg-black text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-gray-800 transition"
>
Ir al Dashboard
</a>
</section>
);
}