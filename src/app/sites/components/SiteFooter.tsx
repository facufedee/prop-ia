"use client";

import Link from "next/link";
import { Instagram, Facebook, Mail, MapPin, Phone, Building2 } from "lucide-react";
import { Site } from "@/domain/models/Site";

interface SiteFooterProps {
  site: Site;
  basePath: string;
}

export default function SiteFooter({ site, basePath }: SiteFooterProps) {
  const primary = site.colorPrimario || "#4f46e5";
  
  return (
    <footer className="bg-gray-900 text-gray-400 py-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand & Bio */}
        <div className="md:col-span-2">
          <div className="flex flex-col gap-1 mb-6">
             <span className="text-2xl font-bold text-white tracking-tight">{site.nombre}</span>
             <span className="text-xs uppercase tracking-[0.3em] font-medium text-gray-500">Inmobiliaria</span>
          </div>
          <p className="max-w-md text-gray-400 leading-relaxed text-sm">
            {site.descripcion || "Líderes en el mercado inmobiliario, brindando asesoramiento profesional y personalizado para encontrar la propiedad de tus sueños."}
          </p>
          
          <div className="flex items-center gap-4 mt-8">
            {site.instagram && (
              <a href={`https://instagram.com/${site.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Instagram size={18} />
              </a>
            )}
            {site.facebook && (
              <a href={site.facebook} target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <Facebook size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Explorar</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <Link href={basePath || "/"} className="hover:text-white transition-colors">Inicio</Link>
            </li>
            <li>
              <Link href={`${basePath}/propiedades`} className="hover:text-white transition-colors">Propiedades</Link>
            </li>
            <li>
              <Link href={`${basePath}/propiedades?operacion=venta`} className="hover:text-white transition-colors">Venta</Link>
            </li>
            <li>
              <Link href={`${basePath}/propiedades?operacion=alquiler`} className="hover:text-white transition-colors">Alquiler</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Contacto</h4>
          <ul className="space-y-4 text-sm">
            {site.direccion && (
              <li className="flex gap-3">
                <MapPin size={18} className="text-gray-600 shrink-0" />
                <span>{site.direccion}</span>
              </li>
            )}
            {site.whatsapp && (
              <li className="flex gap-3">
                <Phone size={18} className="text-gray-600 shrink-0" />
                <span>{site.whatsapp}</span>
              </li>
            )}
            {site.email && (
              <li className="flex gap-3">
                <Mail size={18} className="text-gray-600 shrink-0" />
                <span className="truncate">{site.email}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} {site.nombre}. Todos los derechos reservados.</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-700">Powered by</span>
          <Link href="https://zetaprop.com.ar" target="_blank" className="flex items-center gap-1 font-bold text-gray-500 hover:text-white transition-colors">
             ZetaProp
          </Link>
        </div>
      </div>
    </footer>
  );
}
