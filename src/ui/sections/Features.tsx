"use client";

import {
  Calculator,
  Building2,
  LineChart,
  Clock,
  Send,
  Users,
  Search,
} from "lucide-react";

export default function Features() {
  const items = [
    {
      icon: <Calculator className="w-7 h-7 text-black" />,
      title: "Tasación Inteligente",
      desc: "Calculá el valor estimado de cualquier inmueble usando IA.",
    },
    {
      icon: <Building2 className="w-7 h-7 text-black" />,
      title: "Gestión de Propiedades",
      desc: "Administrá tu cartera inmobiliaria desde un solo lugar.",
    },
    {
      icon: <LineChart className="w-7 h-7 text-black" />,
      title: "Estadísticas y Reportes",
      desc: "Visualizá datos que te ayudan a tomar mejores decisiones.",
    },
    {
      icon: <Clock className="w-7 h-7 text-black" />,
      title: "Automatización de Tareas",
      desc: "Programá recordatorios, seguimientos y tareas repetitivas.",
    },
    {
      icon: <Users className="w-7 h-7 text-black" />,
      title: "CRM Integrado",
      desc: "Gestioná leads, consultas y clientes con un CRM inmobiliario.",
    },
    {
      icon: <Search className="w-7 h-7 text-black" />,
      title: "Comparador de Mercado (IA)",
      desc: "Obtené comparables reales y analizá el mercado al instante.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
        {items.map((f, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-2xl border shadow-sm text-center"
          >
            <div className="flex justify-center mb-4">{f.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900">{f.title}</h3>
            <p className="text-gray-600 mt-2">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
