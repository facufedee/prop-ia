import Link from "next/link";
import { ArrowRight, Building2, Search, ShieldCheck, BadgeCheck, Camera, Users } from "lucide-react";

export default function PropertyNetworkCTA() {
    return (
        <section className="py-16 bg-indigo-50/30 border-y border-indigo-100 relative overflow-hidden">
            {/* Subtle decorative background */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-60"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
                        <Building2 className="w-4 h-4 text-indigo-700" />
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Red Inmobiliaria Federal</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                        Encontrá tu próxima propiedad en nuestra <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            red exclusiva de agencias
                        </span>
                    </h2>

                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Accedé a un catálogo verificado de propiedades gestionadas por las mejores inmobiliarias del país.
                    </p>

                    <div className="flex justify-center mb-12">
                        <Link
                            href="/propiedades"
                            className="group inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
                        >
                            <Search className="w-5 h-5 mr-2" />
                            Explorar Propiedades
                            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-indigo-100 pt-8">
                        <div className="flex flex-col items-center p-3 rounded-lg hover:bg-white/50 transition-colors">
                            <ShieldCheck className="w-8 h-8 text-indigo-600 mb-2" strokeWidth={1.5} />
                            <div className="font-bold text-gray-900">Propiedades Verificadas</div>
                            <div className="text-xs text-gray-500 mt-1">Catálogo 100% seguro</div>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg hover:bg-white/50 transition-colors">
                            <BadgeCheck className="w-8 h-8 text-indigo-600 mb-2" strokeWidth={1.5} />
                            <div className="font-bold text-gray-900">Agencias Validadas</div>
                            <div className="text-xs text-gray-500 mt-1">Profesionales matriculados</div>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg hover:bg-white/50 transition-colors">
                            <Camera className="w-8 h-8 text-indigo-600 mb-2" strokeWidth={1.5} />
                            <div className="font-bold text-gray-900">Fotos Reales</div>
                            <div className="text-xs text-gray-500 mt-1">Sin sorpresas en la visita</div>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg hover:bg-white/50 transition-colors">
                            <Users className="w-8 h-8 text-indigo-600 mb-2" strokeWidth={1.5} />
                            <div className="font-bold text-gray-900">Trato Personalizado</div>
                            <div className="text-xs text-gray-500 mt-1">Expertos a tu disposición</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
