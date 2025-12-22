"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  Calculator,
  Building2,
  MessageSquare,
  Users,
  Bot,
  Megaphone,
  Banknote,
  Calendar,
  User as UserIcon,
  Settings,
  X,
  Shield,
  FileText,
  ScrollText,
  HardDrive,
  Headphones,
  Ticket,
  CreditCard,
  LogOut,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { app, auth, db } from "@/infrastructure/firebase/client";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { ticketsService } from "@/infrastructure/services/ticketsService";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/tasacion", label: "Tasación Inteligente", icon: Calculator },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/dashboard/alquileres", label: "Alquileres", icon: FileText },
  { href: "/dashboard/agentes", label: "Agentes", icon: Users },
  { href: "/dashboard/leads", label: "Leads / Consultas", icon: MessageSquare },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/chat", label: "Chat Prop-IA", icon: Bot },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone },
  { href: "/dashboard/blog", label: "Blog / Novedades", icon: FileText },
  { href: "/dashboard/finanzas", label: "Finanzas", icon: Banknote },
  { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
  { href: "/dashboard/soporte", label: "Soporte", icon: Headphones },
  { href: "/dashboard/soporte/ticketera", label: "Ticketera", icon: Ticket, adminOnly: true },
  { href: "/dashboard/bitacora", label: "Bitácora", icon: ScrollText, adminOnly: true },
  { href: "/catalogo", label: "Mi Suscripción", icon: CreditCard },
  // { href: "/dashboard/cuenta", label: "Cuenta", icon: UserIcon }, // Moved to User Menu
  { href: "/dashboard/admin", label: "Gestión Plataforma", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: HardDrive, adminOnly: true },
];

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect for Role Listener
  useEffect(() => {
    if (!user) return;

    // Use real-time listener for user role
    const userRef = doc(db, "users", user.uid);
    const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.roleId) {
          try {
            const role = await roleService.getRoleById(userData.roleId);
            setUserRole(role);
          } catch (error) {
            console.error('Error fetching role details:', error);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
    return () => unsubscribeSnapshot();
  }, [user]);

  // Effect for Notifications (Tickets)
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user || !userRole) return;
    // Only check for standard users (or agents), not necessarily admins unless they want to see their own requests? 
    // Requirement says: "notification in the menu... de que tiene mensajes". Assuming for the regular user.

    const unsubTickets = ticketsService.subscribeToUserTickets(user.uid, (tickets) => {
      const waitingCount = tickets.filter(t => t.status === 'esperando_respuesta').length;
      setNotificationCount(waitingCount);
    });

    return () => unsubTickets();
  }, [user, userRole]);

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

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly) return userRole?.name === "Administrador";
    if (!userRole) return false;
    return userRole.permissions.includes(item.href);
  });

  if (loading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg md:shadow-sm p-6 flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg md:shadow-sm p-6 flex flex-col gap-6 overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">PROP-IA</span>
          </Link>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg md:hidden" aria-label="Cerrar menú">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 text-gray-600 flex-1">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={onClose}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className="flex-1">{item.label}</span>
                {item.href === '/dashboard/soporte' && notificationCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {notificationCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t space-y-2">
            {/* Main Page Link */}


            {/* User Profile Menu */}
            {user && (
              <div className="relative pt-1" ref={profileRef}>
                {profileOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <Link
                      href="/dashboard/cuenta"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => { setProfileOpen(false); onClose?.(); }}
                    >
                      <UserIcon size={16} />
                      Ver Perfil / Cuenta
                    </Link>
                    <button
                      onClick={() => { if (auth) signOut(auth); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50"
                    >
                      <LogOut size={16} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center justify-between w-full p-2 rounded-xl border transition-all duration-200 ${profileOpen ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs">{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">
                        {user.displayName?.split(' ')[0] || "Usuario"}
                      </span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[100px]" title={user.email || ""}>
                        {user.email}
                      </span>
                    </div>
                  </div>
                  {profileOpen ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
