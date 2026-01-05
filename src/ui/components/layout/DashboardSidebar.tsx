"use client";

import {
  LayoutDashboard,
  Users,
  Home,
  Settings,
  LogOut,
  CreditCard,
  Ticket,
  MessageSquare,
  Key,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Calculator,
  Menu,
  X,
  Bot,
  Megaphone,
  FileText,
  DollarSign,
  Calendar,
  Headphones,
  ClipboardList,
  BookOpen,
  Mail,
  Shield,
  UserCog,
  Package
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth } from "@/infrastructure/firebase/client";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";

// Types
type MenuItem = {
  href: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  permission?: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

// Menu Configuration
const MENU_GROUPS: MenuGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/tasacion", label: "Tasación Inteligente", icon: Calculator },
    ]
  },
  {
    title: "Inmobiliaria",
    items: [
      { href: "/dashboard/propiedades", label: "Propiedades", icon: Home },
      { href: "/dashboard/alquileres", label: "Alquileres", icon: Key },
      { href: "/dashboard/agentes", label: "Agentes", icon: Users },
    ]
  },
  {
    title: "CRM",
    items: [
      { href: "/dashboard/leads", label: "Leads / Consultas", icon: MessageSquare },
      { href: "/dashboard/clientes", label: "Clientes", icon: Users },
      { href: "/dashboard/chat", label: "Chat Prop-IA", icon: Bot },
    ]
  },
  {
    title: "Marketing",
    items: [
      { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone },
      { href: "/dashboard/blog", label: "Blog / Novedades", icon: FileText },
    ]
  },
  {
    title: "Gestión",
    items: [
      { href: "/dashboard/finanzas", label: "Finanzas", icon: DollarSign },
      { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
    ]
  },
  {
    title: "Soporte",
    items: [
      { href: "/dashboard/soporte", label: "Soporte", icon: Headphones },
      { href: "/dashboard/soporte/ticketera", label: "Ticketera", icon: Ticket, adminOnly: true },
      { href: "/dashboard/bitacora", label: "Bitácora", icon: BookOpen, adminOnly: true },
      { href: "/dashboard/mensajes", label: "Mensajes", icon: Mail },
    ]
  },
  {
    title: "Configuración",
    items: [
      { href: "/dashboard/gestion-plataforma", label: "Gestión Plataforma", icon: Shield, adminOnly: true },
      { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
      { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: UserCog, adminOnly: true },
      { href: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", icon: Package, adminOnly: true },
      { href: "/dashboard/configuracion/backup", label: "Backup", icon: Database, adminOnly: true },
      { href: "/dashboard/sucursales", label: "Sucursales", icon: Building2, permission: "/dashboard/sucursales" },
    ]
  }
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { userRole, userPermissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const hasPermission = (item: MenuItem) => {
    // First check if it's admin only
    if (item.adminOnly && userRole?.name !== "Administrador") return false;

    // Then check if user has permission for this specific route
    // If item has a specific permission field, use that, otherwise use the href
    const requiredPermission = item.permission || item.href;

    // Check if user's permissions include this route
    if (!userPermissions.includes(requiredPermission)) return false;

    return true;
  };

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col lg:relative",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64", // Mobile width always full
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 min-h-[64px]">
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent truncate">
              Prop-IA
            </h1>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  if (!hasPermission(item)) return null;

                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose} // Close on mobile navigation
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        collapsed ? "justify-center px-0" : ""
                      )}
                    >
                      <item.icon
                        size={20}
                        className={cn(
                          "transition-colors flex-shrink-0",
                          isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
              {/* Separator between groups if not collapsed */}
              {!collapsed && idx < MENU_GROUPS.length - 1 && (
                <div className="mt-4 mx-3 border-b border-gray-100" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
