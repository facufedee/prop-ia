"use client";

import { app, auth } from "@/infrastructure/firebase/client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User as UserIcon, LogOut, LayoutDashboard, Settings, Home } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();



  // Firebase listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);



  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll detection
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // On /propiedades (landing), always show white background so dark text/logo are readable over the hero
  const isHeroPage = pathname === "/propiedades";
  // Dark hero = home page NOT yet scrolled
  const isDarkHero = pathname === "/" && !scrolled;

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        md:${scrolled || isHeroPage
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50 py-3"
          : isDarkHero
            ? "bg-transparent border-b border-transparent py-5"
            : "bg-transparent border-b border-transparent py-5"}
        ${scrolled || isHeroPage
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50 py-3 md:bg-white/90"
          : isDarkHero
            ? "bg-[#080810] border-b border-white/10 py-3 md:bg-transparent md:border-transparent md:py-5"
            : "bg-[#080810] border-b border-white/10 py-3 md:bg-transparent md:border-transparent md:py-5"}
      `}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className={`relative h-10 w-40 md:h-16 md:w-64 transition-transform duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}>
            {/* On mobile: always dark bg → always use white/dark logo. On desktop: respect scroll/page state */}
            <Image
              src="/assets/img/logo_zeta_prop_transparent.png"
              alt="Zeta Prop Logo"
              fill
              sizes="(max-width: 768px) 160px, 256px"
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Desktop menu */}
        <div className={`hidden md:flex items-center gap-8 text-lg font-medium transition-colors ${isDarkHero ? 'text-white/80' : 'text-gray-700'}`}>
          <Link href="/servicios" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Servicios
          </Link>
          <Link href="/precios" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Precios
          </Link>
          <Link href="/nosotros" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Nosotros
          </Link>
          <Link href="/blog" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Blog
          </Link>
          <Link href="/propiedades" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Propiedades
          </Link>
          <Link href="/faqs" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            FAQs
          </Link>
          <Link href="/contacto" className={`transition-colors ${isDarkHero ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
            Contacto
          </Link>
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link
                href="/login"
                className={`px-5 py-2.5 border rounded-xl text-sm font-medium transition-all ${isDarkHero
                  ? 'border-white/30 text-white/90 hover:bg-white/10'
                  : scrolled || isHeroPage
                    ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    : 'border-gray-300/50 text-gray-800 bg-white/50 hover:bg-white'
                  }`}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-lg ${isDarkHero
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                  : 'bg-black text-white hover:bg-gray-800 shadow-gray-900/10'
                  }`}
              >
                Comenzar
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">

              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 relative overflow-hidden">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <UserIcon size={18} />
                    )}
                  </div>
                  <span className={`hidden md:block text-sm font-medium max-w-[100px] truncate ${isDarkHero ? 'text-white/90' : 'text-gray-700'}`}>
                    {user.displayName || user.email?.split('@')[0] || "Usuario"}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isDarkHero ? 'text-white/60' : 'text-gray-400'} ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 relative overflow-hidden">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt="Profile"
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
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
                        <p className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5">
                          {(user as any)?.subscription?.planTier === 'basic' ? 'Plan Básico' :
                            (user as any)?.subscription?.planTier === 'professional' ? 'Profesional' :
                              (user as any)?.subscription?.planTier === 'enterprise' ? 'Empresarial' :
                                'Gestión Inteligente'}
                        </p>
                      </div>
                    </div>

                    <div className="py-1">


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
                    <Link
                      href="/"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Home size={16} />
                      Volver al inicio
                    </Link>
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
        <button
          className={`md:hidden p-2 ${isDarkHero ? 'text-white' : scrolled || isHeroPage ? 'text-gray-700' : 'text-white'}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú principal" : "Abrir menú principal"}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-2 p-4 flex flex-col gap-4 
        bg-[#080810] backdrop-blur-xl border-t border-white/10 shadow-xl rounded-b-2xl animate-in slide-in-from-top-2">

          <Link href="/servicios" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Servicios</Link>
          <Link href="/precios" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Precios</Link>
          <Link href="/nosotros" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Nosotros</Link>
          <Link href="/blog" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Blog</Link>
          <Link href="/propiedades" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Propiedades</Link>
          <Link href="/faqs" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>FAQs</Link>
          <Link href="/contacto" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 font-medium text-white" onClick={() => setOpen(false)}>Contacto</Link>

          <div className="border-t border-white/10 pt-4">
            {!user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="block w-full border border-white/20 px-4 py-3 rounded-xl text-center font-semibold text-white/90"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-center font-semibold shadow-lg"
                  onClick={() => setOpen(false)}
                >
                  Comenzar
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 relative overflow-hidden">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{user.displayName || "Usuario"}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/dashboard"
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={20} className="text-indigo-400" />
                    <span className="text-xs font-medium text-white">Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/cuenta"
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <Settings size={20} className="text-indigo-400" />
                    <span className="text-xs font-medium text-white">Cuenta</span>
                  </Link>
                </div>

                <button
                  onClick={() => { if (auth) signOut(auth); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl mt-3 font-medium border border-red-500/20"
                >
                  <LogOut size={18} />
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
