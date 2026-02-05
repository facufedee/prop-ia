"use client";

import { app, auth } from "@/infrastructure/firebase/client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, User as UserIcon, LogOut, LayoutDashboard, Settings, Bot, Home, Bell, Check, ExternalLink } from "lucide-react";
import { onAuthStateChanged, signOut, type User, type Auth } from "firebase/auth";
import { notificationService, type AppNotification } from "@/infrastructure/services/notificationService";
import { roleService } from "@/infrastructure/services/roleService";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Firebase listener
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsAdmin(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupNotifications = async () => {
      try {
        const role = await roleService.getUserRole(user.uid);
        if (role?.name === 'Administrador') {
          setIsAdmin(true);
          unsubscribe = notificationService.subscribeToNotifications(user.uid, 'Administrador', (data) => {
            setNotifications(data);
          });
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Error setting up notifications", e);
      }
    };

    setupNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!user) return;

    // Mark as read
    await notificationService.markAsRead(notification.id, user.uid);

    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link);
      setNotifOpen(false);
    }
  };

  // Scroll detection
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${scrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 py-3"
          : "bg-transparent border-b border-transparent py-5"}
      `}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src="/assets/img/logo_web_ZetaProp.png"
            alt="Zeta Prop Logo"
            className={`h-8 w-auto transition-transform duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}
          />
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8 text-lg font-medium text-gray-700">
          <Link href="/servicios" className="hover:text-indigo-600 transition-colors">
            Servicios
          </Link>
          <Link href="/precios" className="hover:text-indigo-600 transition-colors">
            Precios
          </Link>
          <Link href="/nosotros" className="hover:text-indigo-600 transition-colors">
            Nosotros
          </Link>
          <Link href="/blog" className="hover:text-indigo-600 transition-colors">
            Blog
          </Link>
          <Link href="/propiedades" className="hover:text-indigo-600 transition-colors">
            Propiedades
          </Link>
          <Link href="/contacto" className="hover:text-indigo-600 transition-colors">
            Contacto
          </Link>
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <>
              <Link
                href="/login"
                className={`px-5 py-2.5 border rounded-xl text-sm font-medium transition-all ${scrolled ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'border-gray-300/50 text-gray-800 bg-white/50 hover:bg-white'}`}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-900/10"
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

              {/* Notification Bell */}
              {isAdmin ? (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 animate-in fade-in zoom-in-95 duration-200 z-50">
                      {/* Triangle Arrow */}
                      <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

                      {/* Header */}
                      <div className="relative px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-md z-10">
                        <h3 className="font-medium text-gray-900 text-base">Notificaciones</h3>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Settings size={18} />
                        </button>
                      </div>

                      {/* Tabs (Visual only for now) */}
                      <div className="relative flex px-4 border-b border-gray-100 bg-white z-10">
                        <div className="py-2 border-b-2 border-blue-500 text-blue-500 font-medium text-sm cursor-pointer">
                          Generales
                        </div>
                      </div>

                      {/* List */}
                      <div className="relative max-h-[400px] overflow-y-auto custom-scrollbar bg-white rounded-b-md z-10">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <Bell size={32} className="text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-900 mb-1">No tienes notificaciones</p>
                            <p className="text-sm">Enviaremos avisos cuando algo importante suceda.</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`px-4 py-4 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex gap-4 ${notif.readBy.includes(user.uid) ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                                }`}
                            >
                              <div className="shrink-0 mt-1">
                                {/* Icon based on Type */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                  notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                    notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                  {notif.type === 'success' ? <Check size={20} /> :
                                    notif.type === 'warning' ? <LogOut size={20} /> : /* alert triangle fallback? using logout as placeholder... wait Use Bell */
                                      notif.type === 'error' ? <X size={20} /> : <Bell size={20} />}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 pr-2">
                                    {notif.title}
                                  </h4>
                                  <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Hoy'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                  {notif.message}
                                </p>
                                {notif.link && (
                                  <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
                                    Ver detalles <ExternalLink size={10} />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer (See all) */}
                      {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center rounded-b-md">
                          <Link
                            href="/dashboard/administrador/notificaciones"
                            className="text-sm text-blue-600 font-medium hover:underline block w-full"
                            onClick={() => setNotifOpen(false)}
                          >
                            Ver todas las notificaciones
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

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
                        <p className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5">
                          {/* Since user object might not have subscription joined, showing simple 'Plan Básico' if free, or rely on future role update.
                                For now, let's assuming if they are logged in they are at least Basic.
                                Better: Show nothing or fetch subscription.
                                Given the user request is specifically about the 'Cliente Free' label which usually comes from role,
                                and we want to change that visual.
                            */}
                          {(user as any)?.subscription?.planTier === 'basic' ? 'Plan Básico' :
                            (user as any)?.subscription?.planTier === 'professional' ? 'Profesional' :
                              (user as any)?.subscription?.planTier === 'enterprise' ? 'Empresarial' :
                                'Gestión Inteligente' /* Fallback friendly name */}
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
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
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
        <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen(!open)}>
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-2 p-4 flex flex-col gap-4 
        bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-xl rounded-b-2xl animate-in slide-in-from-top-2">

          <Link href="/servicios" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Servicios</Link>
          <Link href="/precios" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Precios</Link>
          <Link href="/nosotros" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Nosotros</Link>
          <Link href="/blog" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Blog</Link>
          <Link href="/propiedades" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Propiedades</Link>
          <Link href="/contacto" className="p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 font-medium" onClick={() => setOpen(false)}>Contacto</Link>

          <div className="border-t border-gray-200 pt-4">
            {!user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="block w-full border border-gray-300 px-4 py-3 rounded-xl text-center font-semibold text-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-black text-white px-4 py-3 rounded-xl text-center font-semibold shadow-lg"
                  onClick={() => setOpen(false)}
                >
                  Comenzar
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{user.displayName || "Usuario"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/dashboard/propiedades/nueva"
                  className="block w-full bg-indigo-600 text-white px-4 py-3 rounded-xl text-center mb-3 font-semibold shadow-md"
                  onClick={() => setOpen(false)}
                >
                  Publicar Propiedad
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/dashboard"
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={20} className="text-gray-600" />
                    <span className="text-xs font-medium">Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/cuenta"
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <Settings size={20} className="text-gray-600" />
                    <span className="text-xs font-medium">Cuenta</span>
                  </Link>
                </div>

                <button
                  onClick={() => { if (auth) signOut(auth); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl mt-3 font-medium border border-red-100"
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
