"use client";

import { Property } from "@/ui/components/tables/PropertiesTable";
import { MapPin, Ruler, BedDouble, Bath, Car, Phone, Mail, Instagram, Globe } from "lucide-react";

interface HorizontalFlyerProps {
    property: Property;
    agent: {
        name: string;
        email: string;
        phone?: string;
        photoUrl?: string;
        logoUrl?: string;
        instagram?: string;
    };
}

export default function HorizontalFlyer({ property, agent }: HorizontalFlyerProps) {
    const mainImage = property.imageUrls?.[0] || "/assets/img/placeholder.png";
    const secondaryImages = property.imageUrls?.slice(1, 4) || [];

    return (
        <div className="w-[297mm] h-[210mm] bg-white text-gray-900 overflow-hidden relative flex flex-col shadow-2xl mx-auto my-8 print:shadow-none print:m-0 print:w-[297mm] print:h-[210mm] bg-page break-after-page">

            {/* FLOATING BADGES (Moved to root to fix z-index stacking issues) */}

            {/* Operation Tag */}
            <div className="absolute top-12 left-0 z-30 bg-slate-900 text-white px-10 py-4 uppercase tracking-[0.25em] text-4xl font-extrabold shadow-2xl print:print-color-adjust-exact clip-path-slant">
                {property.operation_type === 'Venta' ? 'En Venta' : 'Alquiler'}
            </div>



            {/* TOP SECTION: MAIN IMAGE (55% Height) */}
            <div className="h-[55%] w-full relative group z-0">
                <img
                    src={mainImage}
                    alt="Main Property"
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* BOTTOM SECTION: INFO (45% Height) */}
            <div className="h-[45%] bg-white p-12 flex justify-between gap-12 relative z-10">

                {/* Decoration Element */}
                <div className="absolute top-0 right-0 w-80 h-full bg-slate-50 skew-x-[-12deg] translate-x-20 z-0 border-l border-slate-100"></div>

                {/* COL 1: Property Details */}
                <div className="w-[45%] flex flex-col z-10 justify-between h-full pt-2">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-4xl font-extrabold text-slate-900 uppercase leading-[0.9] text-balance">
                            {property.title}
                        </h1>
                        <div className="flex items-center gap-3 text-slate-500 font-bold text-xl uppercase">
                            <MapPin size={28} className="text-amber-500" />
                            <span>{property.localidad}, {property.provincia}</span>
                        </div>
                    </div>

                    {/* Features Strip */}
                    <div className="flex gap-10 mt-auto items-end pb-4">
                        <div className="flex flex-col items-center group">
                            <span className="font-black text-3xl text-slate-500 flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                                {property.area_covered} <span className="text-base text-slate-400 font-medium mt-3">m²</span>
                            </span>
                            <span className="text-sm uppercase text-slate-400 font-bold tracking-widest mt-1">Cubiertos</span>
                        </div>

                        {(property.bedrooms && Number(property.bedrooms) > 0) ? (
                            <>
                                <div className="w-px h-16 bg-slate-200"></div>
                                <div className="flex flex-col items-center group">
                                    <span className="font-black text-3xl text-slate-500 group-hover:text-amber-500 transition-colors">{property.bedrooms}</span>
                                    <span className="text-sm uppercase text-slate-400 font-bold tracking-widest mt-1">Dorms</span>
                                </div>
                            </>
                        ) : null}

                        {(property.bathrooms && Number(property.bathrooms) > 0) ? (
                            <>
                                <div className="w-px h-16 bg-slate-200"></div>
                                <div className="flex flex-col items-center group">
                                    <span className="font-black text-3xl text-slate-500 group-hover:text-amber-500 transition-colors">{property.bathrooms}</span>
                                    <span className="text-sm uppercase text-slate-400 font-bold tracking-widest mt-1">Baños</span>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* COL 2: Gallery Strip */}
                <div className="w-[22%] z-10 flex flex-col gap-4 h-full justify-center py-2">
                    {secondaryImages.length > 0 ? (
                        <div className="grid grid-cols-1 grid-rows-2 gap-4 h-full">
                            {secondaryImages.slice(0, 2).map((img, i) => (
                                <div key={i} className="bg-gray-100 rounded-lg overflow-hidden h-full shadow-md border-2 border-white relative group">
                                    <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt="Gallery" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium text-center p-6">
                            Más fotos en la web
                        </div>
                    )}
                </div>

                {/* COL 3: Agent & Brand */}
                <div className="w-[28%] z-10 flex flex-col justify-between items-end text-right h-full pb-2">
                    {/* Price Badge (Moved here) */}
                    <div className="w-full bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-row items-center justify-center px-4 print:print-color-adjust-exact mb-6 gap-2">
                        <span className="text-3xl font-extrabold drop-shadow-sm whitespace-nowrap truncate">
                            {property.currency} {Number(property.price).toLocaleString('es-AR')}
                        </span>
                    </div>

                    {/* Agent Contact Card */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl w-full print:print-color-adjust-exact mt-auto relative overflow-hidden">
                        {/* Abstract bg circle */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl"></div>

                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-700/50 relative z-10 -mt-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-[2px] shrink-0 shadow-lg">
                                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                    {agent.photoUrl ? (
                                        <img src={agent.photoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center font-bold text-2xl text-slate-800">{agent.name[0]}</span>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0 text-left">
                                <h3 className="font-bold text-xl leading-tight truncate text-white">{agent.name}</h3>
                                <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mt-1">Asesor Inmobiliario</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm font-medium relative z-10">
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 flex justify-center"><Mail size={16} className="text-amber-500" /></div>
                                <span className="truncate text-xs tracking-wide">{agent.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <div className="w-6 flex justify-center"><Globe size={16} className="text-amber-500" /></div>
                                <span className="truncate text-xs tracking-wide">zetaprop.com.ar</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bar */}
            <div className="absolute bottom-0 w-full bg-slate-100 py-1 px-8 flex justify-between text-[8px] text-slate-400 uppercase tracking-widest border-t border-slate-200 print:print-color-adjust-exact">
                <span>Documento generado el {new Date().toLocaleDateString()}</span>
                <span>Zeta Prop Management System</span>
            </div>
        </div>
    );
}
