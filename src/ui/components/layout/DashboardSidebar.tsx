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

// Menu Configuration - Flat list of all menu items
const MENU_ITEMS: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasacion", label: "Tasación Inteligente", icon: Calculator },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Home },
  { href: "/dashboard/alquileres", label: "Alquileres", icon: Key },
  { href: "/dashboard/agentes", label: "Agentes", icon: Users },
  { href: "/dashboard/leads", label: "Leads / Consultas", icon: MessageSquare },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/chat", label: "Chat Prop-IA", icon: Bot },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone },
  { href: "/dashboard/blog", label: "Blog / Novedades", icon: FileText },
  { href: "/dashboard/finanzas", label: "Finanzas", icon: DollarSign },
  { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
  { href: "/dashboard/soporte", label: "Soporte", icon: Headphones },
  { href: "/dashboard/soporte/ticketera", label: "Ticketera", icon: Ticket, adminOnly: true },
  { href: "/dashboard/bitacora", label: "Bitácora", icon: BookOpen, adminOnly: true },
  { href: "/dashboard/mensajes", label: "Mensajes", icon: Mail },
  { href: "/dashboard/gestion-plataforma", label: "Gestión Plataforma", icon: Shield, adminOnly: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: UserCog, adminOnly: true },
  { href: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", icon: Package, adminOnly: true },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: Database, adminOnly: true },
  { href: "/dashboard/sucursales", label: "Sucursales", icon: Building2, permission: "/dashboard/sucursales" },
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
          "fixed top-0 left-0 z-50 h-screen bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col lg:relative",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64", // Mobile width always full
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 min-h-[64px] bg-white">
          {!collapsed && (
            <>
              {(userRole as any)?.logoUrl ? (
                <div className="flex items-center justify-center flex-1 min-w-0 py-2">
                  <img
                    src={(userRole as any).logoUrl}
                    alt="Logo Inmobiliaria"
                    className="h-12 w-auto max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold truncate">
                  <span className="text-gray-900">Prop</span>
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">IA</span>
                </h1>
              )}
            </>
          )}
          {collapsed && (
            <div className="w-full flex justify-center py-2">
              {(userRole as any)?.logoUrl ? (
                <div className="w-12 h-12 flex items-center justify-center">
                  <img
                    src={(userRole as any).logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-bold leading-none">
                    <div className="text-gray-900">P</div>
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">IA</div>
                  </div>
                </div>
              )}
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
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none">
          <div className="space-y-1">
            {MENU_ITEMS.filter(hasPermission).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-600 hover:bg-white hover:text-gray-900",
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
