import Link from 'next/link';
import {
    Building2, Users, Receipt, Calendar, DollarSign, FileText,
    BarChart3, Shield, Globe, Smartphone, CreditCard, PenLine,
    CheckCircle2, Clock
} from 'lucide-react';

export const metadata = {
    title: "Servicios | Zeta Prop",
    description: "Todo lo que incluye Zeta Prop: CRM inmobiliario, gestión de alquileres, contratos digitales, agenda, finanzas y más. Conocé lo que tenemos hoy y lo que viene.",
    alternates: {
        canonical: 'https://zetaprop.com.ar/servicios',
    },
};

const available = [
    {
        icon: Building2,
        color: "from-blue-500 to-cyan-500",
        bg: "bg-blue-50",
        text: "text-blue-600",
        title: "Gestión de Propiedades",
        description: "Fichas completas con fotos, ubicación en mapa, precios y estados en tiempo real. Generación automática de ficha PDF para compartir con clientes.",
        items: ["Catálogo digital ilimitado", "Publicación al portal federal", "Fichas PDF automáticas", "Historial de cambios de precio"],
    },
    {
        icon: Users,
        color: "from-green-500 to-emerald-500",
        bg: "bg-green-50",
        text: "text-green-600",
        title: "CRM de Clientes",
        description: "Seguimiento completo de cada lead: perfil de búsqueda, historial de interacciones, pipeline visual y alertas de matching automático con propiedades.",
        items: ["Pipeline visual de oportunidades", "Matching automático", "Perfiles de búsqueda", "Scoring y etiquetas de clientes"],
    },
    {
        icon: Receipt,
        color: "from-purple-500 to-indigo-500",
        bg: "bg-purple-50",
        text: "text-purple-600",
        title: "Administración de Alquileres",
        description: "El ciclo completo del alquiler automatizado: contratos, vencimientos, recibos, punitorios y liquidaciones. Sin Excel, sin errores.",
        items: ["Recibos automáticos mensuales", "Punitorios por mora día a día", "Ajustes ICL / IPC / % fijo", "Liquidaciones a propietarios en PDF"],
    },
    {
        icon: FileText,
        color: "from-teal-500 to-cyan-500",
        bg: "bg-teal-50",
        text: "text-teal-600",
        title: "Contratos Digitales",
        description: "Generación automática de contratos de alquiler y venta con los datos del sistema. Listos para descargar e imprimir en segundos.",
        items: ["Contratos de alquiler y venta", "Plantillas actualizadas", "Descarga PDF inmediata", "Datos precargados del sistema"],
    },
    {
        icon: Calendar,
        color: "from-pink-500 to-rose-500",
        bg: "bg-pink-50",
        text: "text-pink-600",
        title: "Agenda Inteligente",
        description: "Coordiná visitas sin solapamientos. Sincronización con Google Calendar, recordatorios automáticos y vista de disponibilidad por agente.",
        items: ["Sincronización con Google Calendar", "Recordatorios automáticos", "Vista de equipo", "Gestión de visitas por propiedad"],
    },
    {
        icon: DollarSign,
        color: "from-yellow-500 to-amber-500",
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        title: "Gestión Financiera",
        description: "Control total de la caja: comisiones, gastos operativos y reportes por período. Todo lo que necesitás para saber cómo está tu negocio.",
        items: ["Cálculo de comisiones por operación", "Control de caja y gastos", "Alertas de pagos pendientes", "Exportación a Excel"],
    },
    {
        icon: Shield,
        color: "from-slate-500 to-gray-600",
        bg: "bg-slate-50",
        text: "text-slate-600",
        title: "Portal del Inquilino",
        description: "Acceso exclusivo para cada inquilino donde puede ver su contrato, el monto del mes, pagos realizados y punitorios. Sin app, sin registro.",
        items: ["Acceso por link único", "Resumen de contrato", "Historial de pagos", "Transparencia total"],
    },
    {
        icon: BarChart3,
        color: "from-violet-500 to-purple-500",
        bg: "bg-violet-50",
        text: "text-violet-600",
        title: "Dashboard y Analytics",
        description: "Métricas en tiempo real de tu cartera: propiedades activas, pagos del mes, vencimientos próximos y rendimiento por agente.",
        items: ["Dashboard en tiempo real", "Métricas de rendimiento", "Alertas de vencimientos", "Reportes exportables"],
    },
    {
        icon: Globe,
        color: "from-orange-500 to-red-500",
        bg: "bg-orange-50",
        text: "text-orange-600",
        title: "Red Inmobiliaria Federal",
        description: "Tus propiedades publicadas en el portal de Zeta Prop, visible para compradores e inquilinos de todo el país.",
        items: ["Portal público en zetaprop.com.ar", "Búsqueda por zona y tipo", "Ficha pública de cada propiedad", "Contacto directo con la agencia"],
    },
];

const coming = [
    {
        icon: Globe,
        title: "Mi Sitio — Portal Propio",
        description: "Tu propia web inmobiliaria bajo un subdominio de Zeta Prop. Con tu logo, tus colores y tus propiedades publicadas automáticamente.",
    },
    {
        icon: CreditCard,
        title: "Pago Online del Alquiler",
        description: "Integración con MercadoPago para que los inquilinos paguen el alquiler directamente desde su portal, sin transferencias manuales.",
    },
    {
        icon: PenLine,
        title: "Firma Digital de Contratos",
        description: "Firma electrónica con validez legal para contratos de alquiler y venta, sin necesidad de presencia física.",
    },
    {
        icon: Globe,
        title: "Integración con Portales",
        description: "Publicación automática en Argenprop, MercadoLibre y otros portales desde un solo lugar, sin cargar la propiedad dos veces.",
    },
    {
        icon: Smartphone,
        title: "App Móvil",
        description: "Toda la plataforma en tu celular. Gestioná propiedades, respondé leads y revisá tu caja desde donde estés.",
    },
];

export default function ServicesPage() {
    return (
        <div className="bg-white font-sans text-gray-900">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-5 sm:px-6 bg-[#080810]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#080810] to-purple-950/60 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-semibold mb-6">
                        Servicios
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
                        Todo lo que necesita
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            tu inmobiliaria, en un solo lugar
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Sin integraciones complicadas, sin costos ocultos. Un ecosistema completo pensado para la realidad inmobiliaria argentina.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Comenzar gratis
                        </Link>
                        <Link
                            href="/precios"
                            className="px-8 py-3.5 border border-white/20 text-white/80 hover:bg-white/10 font-semibold rounded-xl transition-colors"
                        >
                            Ver precios
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Disponible hoy ── */}
            <section className="py-20 sm:py-24 px-5 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-200 rounded-full mb-4">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Disponible ahora</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Lo que tenemos hoy</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                            Funcionalidades activas en la plataforma, listas para usar desde el primer día.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {available.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={s.title}
                                    className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                >
                                    <div className={`w-13 h-13 w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-5 shadow-sm`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.description}</p>
                                    <ul className="space-y-2 mt-auto">
                                        {s.items.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.text}`} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Próximamente ── */}
            <section className="py-20 sm:py-24 px-5 sm:px-6 bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 border border-indigo-200 rounded-full mb-4">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-700">En camino</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Lo que viene</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                            Funcionalidades en desarrollo que van a estar disponibles próximamente.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coming.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={s.title}
                                    className="bg-white rounded-2xl border border-dashed border-gray-200 p-7 flex flex-col gap-4 opacity-80"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Próximamente</span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-700 mb-1">{s.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{s.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-5 sm:px-6 bg-[#080810] text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Empezá hoy, sin compromiso
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        Probá todas las funcionalidades gratis y sumate a las inmobiliarias que ya trabajan con Zeta Prop.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Crear cuenta gratis
                        </Link>
                        <Link
                            href="/faqs"
                            className="px-8 py-3.5 border border-white/20 text-white/80 hover:bg-white/10 font-semibold rounded-xl transition-colors"
                        >
                            Ver preguntas frecuentes
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
