"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, MessageCircle, Home, Building2, Phone, Mail } from "lucide-react";
import { Site } from "@/domain/models/Site";

interface SiteNavbarProps {
  site: Site;
  basePath: string;
  transparent?: boolean;
}

export default function SiteNavbar({ site, basePath, transparent = false }: SiteNavbarProps) {
  const [isOpen, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const primary = site.colorPrimario || "#4f46e5";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSticky = scrolled || !transparent;

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${isSticky 
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-3" 
          : "bg-transparent py-5"}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href={basePath || "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {site.logoUrl ? (
            <div className={`relative h-10 w-40 md:h-12 md:w-48 transition-transform duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}>
              <Image
                src={site.logoUrl}
                alt={site.nombre}
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className={`text-xl font-bold tracking-tight ${isSticky ? "text-gray-900" : "text-white"}`}>
                {site.nombre}
              </span>
              <span className={`text-[10px] uppercase tracking-widest font-medium ${isSticky ? "text-gray-500" : "text-white/70"}`}>
                Inmobiliaria
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider transition-colors ${isSticky ? "text-gray-600" : "text-white"}`}>
          <Link href={basePath || "/"} className={`hover:opacity-70 transition-opacity ${isSticky ? "hover:text-gray-900" : "hover:text-white"}`}>
            Inicio
          </Link>
          <Link href={`${basePath}/propiedades`} className={`hover:opacity-70 transition-opacity ${isSticky ? "hover:text-gray-900" : "hover:text-white"}`}>
            Propiedades
          </Link>
          {site.email && (
             <a href={`mailto:${site.email}`} className={`hover:opacity-70 transition-opacity ${isSticky ? "hover:text-gray-900" : "hover:text-white"}`}>
               Contacto
             </a>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          {site.whatsapp && (
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-lg active:scale-95"
              style={{ backgroundColor: primary }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}

          {/* Mobile Toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${isSticky ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col p-6 gap-4">
            <Link 
              href={basePath || "/"} 
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-900 font-bold"
              onClick={() => setOpen(false)}
            >
              <Home className="w-5 h-5 text-gray-400" />
              Inicio
            </Link>
            <Link 
              href={`${basePath}/propiedades`}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-900 font-bold"
              onClick={() => setOpen(false)}
            >
              <Building2 className="w-5 h-5 text-gray-400" />
              Propiedades
            </Link>
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl text-white font-bold"
                style={{ backgroundColor: primary }}
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Directo
              </a>
            )}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {site.email && (
                <a href={`mailto:${site.email}`} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Email</span>
                </a>
              )}
              {site.whatsapp && (
                <a href={`tel:${site.whatsapp}`} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Llamar</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
