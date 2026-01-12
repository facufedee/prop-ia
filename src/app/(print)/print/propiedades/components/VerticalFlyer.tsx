"use client";

import { Property } from "@/ui/components/tables/PropertiesTable";
import { MapPin, Ruler, BedDouble, Bath, Car, Phone, Mail, Globe, Instagram, QrCode } from "lucide-react";

interface VerticalFlyerProps {
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

export default function VerticalFlyer({ property, agent }: VerticalFlyerProps) {
    const mainImage = property.imageUrls?.[0] || "/assets/img/placeholder.png";
    const gallery = property.imageUrls?.slice(1, 4) || [];

    return (
        <div className="w-[210mm] h-[297mm] bg-white text-gray-900 overflow-hidden relative flex flex-col mx-auto shadow-2xl print:w-[210mm] print:h-[297mm] print:shadow-none print:m-0 bg-page">
            {/* Full Height Hero Image as Background Top Half */}
            <div className="h-[45%] w-full relative">
                <img
                    src={mainImage}
                    alt="Main"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90 print:print-color-adjust-exact"></div>

                {/* Price Tag Overlay */}
                <div className="absolute bottom-6 left-6 text-white z-10">
                    <div className="bg-amber-500 text-slate-900 font-bold px-3 py-1 rounded-sm uppercase text-xs inline-block mb-2 print:print-color-adjust-exact">
                        {property.operation_type}
                    </div>
                    <div className="text-5xl font-extrabold tracking-tight drop-shadow-lg">
                        {property.currency} {property.price?.toLocaleString('es-AR')}
                    </div>
                    <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                        <MapPin size={16} />
                        {property.localidad}, {property.provincia}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 bg-white p-8 flex flex-col gap-6 relative z-10 -mt-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

                {/* Title and Details */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 leading-tight mb-2">
                        {property.title}
                    </h1>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100 print:bg-gray-50 print:print-color-adjust-exact">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600">
                            <Ruler size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-slate-900">{property.area_covered}m²</p>
                            <p className="text-xs text-gray-500 uppercase font-medium">Cubiertos</p>
                        </div>
                    </div>
                    {property.bedrooms && Number(property.bedrooms) > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100 print:bg-gray-50 print:print-color-adjust-exact">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600">
                                <BedDouble size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900">{property.bedrooms}</p>
                                <p className="text-xs text-gray-500 uppercase font-medium">Dorms</p>
                            </div>
                        </div>
                    )}
                    {property.bathrooms && Number(property.bathrooms) > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100 print:bg-gray-50 print:print-color-adjust-exact">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600">
                                <Bath size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900">{property.bathrooms}</p>
                                <p className="text-xs text-gray-500 uppercase font-medium">Baños</p>
                            </div>
                        </div>
                    )}
                    {property.garages && Number(property.garages) > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100 print:bg-gray-50 print:print-color-adjust-exact">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600">
                                <Car size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-900">{property.garages}</p>
                                <p className="text-xs text-gray-500 uppercase font-medium">Cochera</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Small Gallery Strip */}
                {gallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 h-20">
                        {gallery.map((img, i) => (
                            <div key={i} className="rounded-lg overflow-hidden bg-gray-100 h-full">
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Agent Footer */}
                <div className="mt-auto bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg print:bg-slate-900 print:print-color-adjust-exact">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden">
                            {agent.photoUrl ? (
                                <img src={agent.photoUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                    <span>{agent.name[0]}</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-sm">{agent.name}</p>
                            <p className="text-xs text-slate-400">{agent.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {agent.logoUrl ? (
                            <img src={agent.logoUrl} className="h-10 w-auto object-contain brightness-0 invert" />
                        ) : (
                            <div className="font-bold border border-white/20 px-2 py-1 rounded text-xs">PropIA</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
