"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, MessageCircle, Home, Building2, Phone, Mail } from "lucide-react";
import { Site } from "@/domain/models/Site";
import { useSite } from "../[slug]/SiteProvider";
import { trackContact } from "@/lib/trackContact";

interface SiteNavbarProps {
  site: Site;
  basePath: string;
  transparent?: boolean; // kept for API compat, ignored — always solid
}

export default function SiteNavbar({ site, basePath: propBasePath }: SiteNavbarProps) {
  const { basePath: contextBasePath } = useSite();
  const basePath = propBasePath || contextBasePath || "";
  const [isOpen, setOpen] = useState(false);

  const primary  = site.colorPrimario || "#4f46e5";
  const navBg    = site.navbarBg   || "#ffffff";
  const navColor = site.navbarText || "#111827";

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 shadow-sm border-b py-3"
      style={{ backgroundColor: navBg, borderColor: `${navColor}12` }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href={basePath || "/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {site.logoUrl ? (
            <div className="relative h-10 w-40 md:h-12 md:w-48">
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
              <span className="text-xl font-bold tracking-tight" style={{ color: navColor }}>
                {site.nombre}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: `${navColor}99` }}>
                Inmobiliaria
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider">
          <Link href={basePath || "/"} className="hover:opacity-70 transition-opacity" style={{ color: navColor }}>
            Inicio
          </Link>
          <Link href={`${basePath}/propiedades`} className="hover:opacity-70 transition-opacity" style={{ color: navColor }}>
            Propiedades
          </Link>
          {site.pages?.filter(p => p.enabled).map(page => (
            <Link key={page.id} href={`${basePath}/p/${page.id}`} className="hover:opacity-70 transition-opacity" style={{ color: navColor }}>
              {page.label}
            </Link>
          ))}
          {site.email && (
            <a href={`mailto:${site.email}`} onClick={() => trackContact({ userId: site.userId, origen: "click-email" })} className="hover:opacity-70 transition-opacity" style={{ color: navColor }}>
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
              onClick={() => trackContact({ userId: site.userId, origen: "click-whatsapp" })}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-lg active:scale-95"
              style={{ backgroundColor: primary }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: navColor }}
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full border-b shadow-2xl animate-in slide-in-from-top-2"
          style={{ backgroundColor: navBg, borderColor: `${navColor}20` }}
        >
          <div className="flex flex-col p-6 gap-4">
            <Link
              href={basePath || "/"}
              className="flex items-center gap-3 p-4 rounded-xl font-bold"
              style={{ backgroundColor: `${navColor}08`, color: navColor }}
              onClick={() => setOpen(false)}
            >
              <Home className="w-5 h-5 opacity-50" />
              Inicio
            </Link>
            <Link
              href={`${basePath}/propiedades`}
              className="flex items-center gap-3 p-4 rounded-xl font-bold"
              style={{ backgroundColor: `${navColor}08`, color: navColor }}
              onClick={() => setOpen(false)}
            >
              <Building2 className="w-5 h-5 opacity-50" />
              Propiedades
            </Link>
            {site.pages?.filter(p => p.enabled).map(page => (
              <Link
                key={page.id}
                href={`${basePath}/p/${page.id}`}
                className="flex items-center gap-3 p-4 rounded-xl font-bold"
                style={{ backgroundColor: `${navColor}08`, color: navColor }}
                onClick={() => setOpen(false)}
              >
                {page.label}
              </Link>
            ))}
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl text-white font-bold"
                style={{ backgroundColor: primary }}
                onClick={() => { setOpen(false); trackContact({ userId: site.userId, origen: "click-whatsapp" }); }}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Directo
              </a>
            )}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {site.email && (
                <a href={`mailto:${site.email}`} onClick={() => { setOpen(false); trackContact({ userId: site.userId, origen: "click-email" }); }} className="flex flex-col items-center gap-2 p-4 rounded-xl border" style={{ color: navColor, borderColor: `${navColor}20` }}>
                  <Mail className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Email</span>
                </a>
              )}
              {site.whatsapp && (
                <a href={`tel:${site.whatsapp}`} onClick={() => { setOpen(false); trackContact({ userId: site.userId, origen: "click-telefono" }); }} className="flex flex-col items-center gap-2 p-4 rounded-xl border" style={{ color: navColor, borderColor: `${navColor}20` }}>
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
