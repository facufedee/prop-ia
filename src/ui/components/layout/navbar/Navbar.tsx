"use client";

import { auth } from "@/infrastructure/firebase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Firebase listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50 
        bg-white/90 backdrop-blur-xl 
        border-b border-white/20 
        px-6 py-4 
      "
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/" className="text-xl font-semibold text-black hover:opacity-80">
          PROP-IA
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8 text-sm text-black">
          <Link href="#como-funciona" className="hover:text-gray-700">Cómo funciona</Link>
          <Link href="#pricing" className="hover:text-gray-700">Precios</Link>
          <Link href="#faq" className="hover:text-gray-700">Preguntas</Link>

          {/* Mega menu */}
          <div className="relative">
            <button
              onClick={() => setMegaOpen(!megaOpen)}
              className="flex items-center gap-1 hover:text-gray-700"
            >
              Features <ChevronDown size={16} />
            </button>

            {megaOpen && (
              <div className="absolute left-0 mt-3 bg-white shadow-lg border rounded-2xl 
              p-6 grid grid-cols-2 gap-6 w-[400px]">
                <div>
                  <h4 className="font-semibold mb-2">IA</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>Tasación Inteligente</li>
                    <li>Comparador de Mercado</li>
                    <li>Automatizaciones</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Gestión</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>CRM de Clientes</li>
                    <li>Publicación Multiplataforma</li>
                    <li>Estadísticas</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 border border-black text-black rounded-xl text-sm hover:bg-gray-100 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="px-4 py-2 bg-black text-white rounded-xl text-sm hover:bg-gray-800 transition"
              >
                Comenzar
              </Link>
            </>
          ) : (
            <button
              onClick={() => signOut(auth)}
              className="px-4 py-2 bg-gray-100 text-black rounded-xl text-sm hover:bg-gray-200 transition"
            >
              Cerrar sesión
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-3 flex flex-col gap-4 
        bg-white/95 backdrop-blur-xl border-t border-white/20 py-4 px-2 text-sm">

          <Link href="#como-funciona" className="px-2 py-1 hover:text-black">Cómo funciona</Link>
          <Link href="#pricing" className="px-2 py-1 hover:text-black">Precios</Link>
          <Link href="#faq" className="px-2 py-1 hover:text-black">Preguntas</Link>

          <div className="border-t pt-3">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="block w-full border px-4 py-2 rounded-xl mb-2 text-center"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="block w-full bg-black text-white px-4 py-2 rounded-xl text-center"
                >
                  Comenzar
                </Link>
              </>
            ) : (
              <button
                onClick={() => signOut(auth)}
                className="w-full bg-gray-200 text-black px-4 py-2 rounded-xl"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
