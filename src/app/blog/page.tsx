import Link from "next/link";
import { ArrowLeft, Calendar, User, ArrowRight } from "lucide-react";

const BLOG_POSTS = [
    {
        id: 1,
        title: "El futuro del mercado inmobiliario en Argentina",
        excerpt: "Descubrí cómo la inteligencia artificial está transformando la manera en que compramos y vendemos propiedades en 2025.",
        date: "26 Nov 2025",
        author: "Facundo Federico",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Tecnología"
    },
    {
        id: 2,
        title: "Guía completa para tasar tu propiedad",
        excerpt: "Aprende los factores clave que determinan el valor de tu inmueble y cómo maximizar su precio de venta.",
        date: "24 Nov 2025",
        author: "Equipo Prop-IA",
        image: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Guías"
    },
    {
        id: 3,
        title: "Tendencias de diseño interior 2025",
        excerpt: "Minimalismo cálido, espacios multifuncionales y la vuelta de los materiales naturales. Todo lo que tenés que saber.",
        date: "20 Nov 2025",
        author: "Sofia Diseño",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Diseño"
    }
];

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-slate-900 text-white py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} /> Volver al inicio
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Inmobiliario</h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                        Noticias, tendencias y consejos expertos sobre el mercado inmobiliario y la tecnología que lo impulsa.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {BLOG_POSTS.map((post) => (
                        <article key={post.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-indigo-600">
                                    {post.category}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                                    <span className="flex items-center gap-1"><User size={14} /> {post.author}</span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                    {post.title}
                                </h3>

                                <p className="text-gray-600 text-sm mb-6 flex-1">
                                    {post.excerpt}
                                </p>

                                <button className="flex items-center gap-2 text-indigo-600 font-medium text-sm group-hover:gap-3 transition-all">
                                    Leer artículo <ArrowRight size={16} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
