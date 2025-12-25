"use client";

import {
  BarChart3,
  Building2,
  Users,
  Megaphone,
  Bot,
  Calendar,
  DollarSign,
  Shield,
  Zap,
  TrendingUp,
  MessageSquare,
  FileText
} from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Building2,
      title: "Gestión de Propiedades",
      description: "Centraliza todo tu inventario en un solo lugar. Fichas técnicas completas, fotos, videos y estados en tiempo real.",
      color: "from-blue-500 to-cyan-500",
      benefits: ["Catálogo digital", "Historial de cambios", "Fichas PDF automáticas"]
    },
    {
      icon: Users,
      title: "CRM de Clientes",
      description: "No pierdas ni una venta. Seguimiento automático de leads, perfiles de búsqueda y embudo de conversión.",
      color: "from-green-500 to-emerald-500",
      benefits: ["Pipeline visual", "Scoring de clientes", "Alertas de matching"]
    },
    {
      icon: MessageSquare,
      title: "Chat Prop-IA",
      description: "Tu asistente virtual disponible 24/7. Responde consultas, agendamiento de visitas y pre-calificación de interesados.",
      color: "from-purple-500 to-indigo-500",
      benefits: ["Respuestas inmediatas", "Guiones de venta", "Integrado a WhatsApp"]
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Coordina visitas sin solapamientos. Sincronización automática con Google Calendar y recordatorios push.",
      color: "from-pink-500 to-rose-500",
      benefits: ["Recordatorios x WhatsApp", "Rutas optimizadas", "Vista de equipo"]
    },
    {
      icon: DollarSign,
      title: "Gestión Financiera",
      description: "Control total de tu caja. Seguimiento de comisiones, gastos operativos y facturación electrónica.",
      color: "from-yellow-500 to-amber-500",
      benefits: ["Cálculo de comisiones", "Reportes de caja", "Alertas de cobro"]
    },
    {
      icon: FileText,
      title: "Contratos Digitales",
      description: "Generación automática de contratos de alquiler y venta. El sistema los crea listos para descargar e imprimir.",
      color: "from-teal-500 to-cyan-500",
      benefits: ["Sin firma digital", "Plantillas legales", "Descarga PDF inmediata"]
    },
    {
      icon: TrendingUp,
      title: "Analytics Avanzado",
      description: "Toma decisiones basadas en datos. Métricas de rendimiento de agentes, propiedades más vistas y tiempos de venta.",
      color: "from-violet-500 to-purple-500",
      benefits: ["Dashboards en vivo", "Exportación a Excel", "ROI por portal"]
    },
    {
      icon: Shield, // Using Shield as LifeBuoy/HelpCircle alternative if needed, but let's import proper HelpCircle if possible or use Shield for now as "Support" often implies security/safety net. Actually let's use Shield or swap for HelpCircle if available. Let's check imports.
      title: "Mesa de Ayuda",
      description: "Soporte técnico prioritario siempre que lo necesites. Base de conocimientos y tickets de resolución rápida.",
      color: "from-red-500 to-orange-500",
      benefits: ["Soporte 24/7", "Video tutoriales", "Gestor de cuenta"]
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
            CARACTERÍSTICAS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Todo lo que necesitas para
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              hacer crecer tu inmobiliaria
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una plataforma completa con todas las herramientas que necesitas.
            Sin integraciones complicadas, sin costos ocultos.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}
