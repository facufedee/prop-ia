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
  User,
  Settings,
  X,
  Shield,
  FileText,
  ScrollText,
  HardDrive,
  Headphones,
  Ticket,
  CreditCard
} from "lucide-react";
import { app } from "@/infrastructure/firebase/client";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { onAuthStateChanged, getAuth } from "firebase/auth";

const auth = getAuth(app);

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
  { href: "/dashboard/cuenta", label: "Cuenta", icon: User },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: HardDrive, adminOnly: true },
];

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const role = await roleService.getUserRole(user.uid);
          setUserRole(role);
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter menu items based on user permissions
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    // If item is admin-only, check if user is admin
    if (item.adminOnly) {
      return userRole?.name === "Administrador";
    }

    // Otherwise, check if user has permission for this route
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
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg md:hidden">
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
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-6 border-t">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
              <Home className="w-5 h-5" /> Volver al Inicio
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
