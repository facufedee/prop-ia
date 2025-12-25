"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Settings,
  X,
  Shield,
  FileText,
  ScrollText,
  HardDrive,
  Headphones,
  Ticket,
  CreditCard,
} from "lucide-react";
import { auth, db } from "@/infrastructure/firebase/client";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
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
  { href: "/dashboard/admin", label: "Gestión Plataforma", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", icon: CreditCard, adminOnly: true },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: HardDrive, adminOnly: true },
];

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [user]);

  // Effect for Notifications (Tickets)
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user || !userRole) return;

    // Subscribe to tickets for notifications
    const unsubTickets = ticketsService.subscribeToUserTickets(user.uid, (tickets) => {
      const waitingCount = tickets.filter(t => t.status === 'esperando_respuesta').length;
      setNotificationCount(waitingCount);
    });

    return () => unsubTickets();
  }, [user, userRole]);

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly) return userRole?.name === "Administrador";
    if (!userRole) return false;
    return userRole.permissions.includes(item.href);
  });

  if (loading) {
    return null; // Let the main dashboard loading screen handle this
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
            <img
              src="/assets/img/logo_web_propia.png"
              alt="PROP-IA Logo"
              className="h-8 w-auto"
            />
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
        </nav>
      </aside>
    </>
  );
}

