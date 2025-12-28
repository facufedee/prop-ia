"use client";

import { app, auth } from "@/infrastructure/firebase/client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User as UserIcon, LogOut, LayoutDashboard, Settings, Bot, Home } from "lucide-react";
import { onAuthStateChanged, signOut, type User, type Auth } from "firebase/auth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Firebase listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className="
        fixed top-0 left-0 w-full z-50 
        fixed top-0 left-0 w-full z-50 
        bg-white shadow-sm
        border-b border-gray-100 
        px-6 py-4 
      "
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <img
            src="/assets/img/logo_web_propia.png"
            alt="PROP-IA Logo"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/servicios" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            Servicios
          </Link>
          <Link href="/precios" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            Precios
          </Link>
          <Link href="/nosotros" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            Nosotros
          </Link>
          <Link href="/propiedades" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            Propiedades
          </Link>
          <Link href="/contacto" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            Contacto
          </Link>
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
                href="/register"
                className="px-4 py-2 bg-black text-white rounded-xl text-sm hover:bg-gray-800 transition"
              >
                Comenzar
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/propiedades/nueva"
                className="hidden md:flex bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
              >
                Publicar
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <UserIcon size={18} />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.displayName || user.email?.split('@')[0] || "Usuario"}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-lg">{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.displayName || "Usuario"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Home size={16} /> {/* Note: Need to import Home if not already, or use ArrowLeft/House */}
                        Volver al inicio
                      </Link>

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/cuenta"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings size={16} />
                        Modificar datos
                      </Link>
                    </div>

                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button
                        onClick={() => { if (auth) signOut(auth); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

          <Link href="/servicios" className="px-2 py-1 hover:text-black">Servicios</Link>
          <Link href="/precios" className="px-2 py-1 hover:text-black">Precios</Link>
          <Link href="/nosotros" className="px-2 py-1 hover:text-black">Nosotros</Link>
          <Link href="/propiedades" className="px-2 py-1 hover:text-black">Propiedades</Link>
          <Link href="/contacto" className="px-2 py-1 hover:text-black">Contacto</Link>

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
                  href="/register"
                  className="block w-full bg-black text-white px-4 py-2 rounded-xl text-center"
                >
                  Comenzar
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.displayName || "Usuario"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/dashboard/propiedades/nueva"
                  className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-xl text-center mb-2"
                >
                  Publicar
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/cuenta"
                  className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  <Settings size={16} />
                  Modificar datos
                </Link>
                <button
                  onClick={() => { if (auth) signOut(auth); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl mt-2"
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
