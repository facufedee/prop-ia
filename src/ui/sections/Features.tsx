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
      icon: BarChart3,
      title: "Tasación Inteligente",
      description: "IA que valúa propiedades en segundos con precisión del 95%. Basada en datos reales del mercado argentino.",
      color: "from-blue-500 to-cyan-500",
      benefits: ["Ahorra 2 horas por tasación", "Reportes profesionales", "Comparables automáticos"]
    },
    {
      icon: Building2,
      title: "Gestión de Propiedades",
      description: "Administra todo tu portfolio desde un solo lugar. CRM completo con seguimiento de leads y visitas.",
      color: "from-purple-500 to-pink-500",
      benefits: ["Catálogo ilimitado", "Fotos y videos HD", "Estados personalizables"]
    },
    {
      icon: Megaphone,
      title: "Publicación Multiplataforma",
      description: "Publica en Mercado Libre, Argenprop, Zonaprop y más con un solo click. Sincronización automática.",
      color: "from-orange-500 to-red-500",
      benefits: ["10+ portales", "Actualización automática", "Analytics integrado"]
    },
    {
      icon: Users,
      title: "CRM de Clientes",
      description: "Gestiona leads, clientes y agentes. Seguimiento completo del embudo de ventas y conversión.",
      color: "from-green-500 to-emerald-500",
      benefits: ["Pipeline visual", "Automatizaciones", "Recordatorios inteligentes"]
    },
    {
      icon: Bot,
      title: "Chat Prop-IA",
      description: "Asistente de IA que responde consultas, genera descripciones y te ayuda en tu día a día.",
      color: "from-indigo-500 to-purple-500",
      benefits: ["Disponible 24/7", "Aprende de tu negocio", "Multiidioma"]
    },
    {
      icon: Calendar,
      title: "Agenda Inteligente",
      description: "Calendario compartido para visitas, reuniones y seguimientos. Recordatorios automáticos.",
      color: "from-pink-500 to-rose-500",
      benefits: ["Sincroniza con Google", "Notificaciones push", "Vista de equipo"]
    },
    {
      icon: DollarSign,
      title: "Gestión Financiera",
      description: "Control de comisiones, pagos y facturación. Reportes financieros en tiempo real.",
      color: "from-yellow-500 to-orange-500",
      benefits: ["Comisiones automáticas", "Reportes fiscales", "Múltiples monedas"]
    },
    {
      icon: FileText,
      title: "Contratos Digitales",
      description: "Genera contratos de alquiler y venta con firma digital. Plantillas personalizables.",
      color: "from-teal-500 to-cyan-500",
      benefits: ["Firma electrónica", "Plantillas legales", "Almacenamiento seguro"]
    },
    {
      icon: TrendingUp,
      title: "Analytics Avanzado",
      description: "Dashboards con métricas clave: conversión, tiempo promedio de venta, ROI por propiedad.",
      color: "from-violet-500 to-purple-500",
      benefits: ["Métricas en tiempo real", "Exportar a Excel", "Comparativas"]
    },
    {
      icon: MessageSquare,
      title: "Mesa de Ayuda",
      description: "Soporte técnico dedicado. Tickets, chat en vivo y base de conocimientos.",
      color: "from-blue-500 to-indigo-500",
      benefits: ["Respuesta < 24hs", "Chat en vivo", "Tutoriales en video"]
    },
    {
      icon: Shield,
      title: "Seguridad Total",
      description: "Encriptación end-to-end, backups automáticos y cumplimiento de normativas.",
      color: "from-gray-600 to-gray-800",
      benefits: ["Backups diarios", "SSL/TLS", "GDPR compliant"]
    },
    {
      icon: Zap,
      title: "Automatizaciones",
      description: "Workflows automáticos para tareas repetitivas. Ahorra hasta 15 horas por semana.",
      color: "from-amber-500 to-yellow-500",
      benefits: ["Email automático", "Seguimientos", "Recordatorios"]
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

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            ¿Querés ver todas las características en acción?
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
            Solicitar Demo Gratuita
          </button>
        </div>
      </div>
    </section>
  );
}
