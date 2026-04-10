"use client";

import { ShieldCheck, AlertTriangle, PhoneCall, Flag } from "lucide-react";
import { Site } from "@/domain/models/Site";

export default function SiteSafetySection({ site }: { site: Site }) {
    return (
        <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Tu seguridad es lo primero</h2>
                        <p className="text-sm text-gray-500">Información importante antes de realizar cualquier operación</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Verificá siempre la información</h3>
                                <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed">
                                    <li>• Solicitá documentación del inmueble antes de firmar.</li>
                                    <li>• Verificá la identidad del propietario o agente.</li>
                                    <li>• No realices pagos sin haber visto la propiedad en persona.</li>
                                    <li>• Desconfiá de precios muy por debajo del mercado.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Operá con seguridad</h3>
                                <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed">
                                    <li>• Realizá todas las operaciones con escritura o boleto firmado.</li>
                                    <li>• Trabajá siempre con un corredor matriculado.</li>
                                    <li>• Conservá todos los comprobantes de pago.</li>
                                    <li>• Consultá con un abogado ante cualquier duda.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Flag className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">¿Detectaste algo sospechoso?</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Si creés que esta publicación es fraudulenta o encontraste información incorrecta, podés denunciarlo.
                            Podés contactarnos directamente o comunicarte con las autoridades locales de defensa al consumidor.
                        </p>
                    </div>
                    {site.email && (
                        <a
                            href={`mailto:${site.email}?subject=Denuncia de publicación`}
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors whitespace-nowrap"
                        >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Denunciar
                        </a>
                    )}
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
                    Este sitio es operado por <strong>{site.nombre}</strong>. ZetaProp no interviene en las operaciones realizadas entre
                    usuarios y agentes inmobiliarios. Ante cualquier inconveniente, contactá directamente con la inmobiliaria.
                </p>
            </div>
        </section>
    );
}
