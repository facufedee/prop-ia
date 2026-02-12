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
  Sparkles,
  BookOpen,
  Mail,
  Shield,
  UserCog,
  Package,
  Crown,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth } from "@/infrastructure/firebase/client";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useAuth } from "@/ui/context/AuthContext";


// Types
type MenuItem = {
  href: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  permission?: string;
};

// Menu Configuration - Flat list
const MENU_ITEMS: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

  // Core Business (User requested order: Alquileres, Propiedades, Clientes, Finanzas, Noticias, Tutoriales, Soporte)
  { href: "/dashboard/alquileres", label: "Alquileres", icon: Key },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Home },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/finanzas", label: "Finanzas", icon: DollarSign },
  { href: "/dashboard/novedades", label: "Noticias", icon: Sparkles },

  // Support & Education (Prioritized)
  { href: "/dashboard/tutoriales", label: "Tutoriales", icon: GraduationCap },
  { href: "/dashboard/soporte", label: "Soporte", icon: Headphones },

  // Other Tools
  { href: "/dashboard/tasacion", label: "Tasación IA", icon: Calculator },
  { href: "/dashboard/emprendimientos", label: "Emprendimientos", icon: Building2 },
  { href: "/dashboard/chat", label: "Chat Zeta Prop", icon: Bot },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone },
  { href: "/dashboard/blog", label: "Blog / Novedades", icon: FileText },
  { href: "/dashboard/mensajes", label: "Mensajes", icon: Mail },
  { href: "/dashboard/calendario", label: "Agenda", icon: Calendar },

  // Pro Tools
  { href: "/dashboard/agentes", label: "Agentes", icon: Users },
  { href: "/dashboard/leads", label: "Leads / Consultas", icon: MessageSquare },
  { href: "/dashboard/sucursales", label: "Multi Sucursal", icon: Building2, permission: "/dashboard/sucursales" },
  { href: "/dashboard/gestion-plataforma", label: "Gestión Plataforma", icon: Shield, permission: "/dashboard/gestion-plataforma" },

  // Admin & Config
  { href: "/dashboard/soporte/ticketera", label: "Ticketera", icon: Ticket, adminOnly: true },
  { href: "/dashboard/bitacora", label: "Bitácora", icon: BookOpen, adminOnly: true },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: UserCog, adminOnly: true },
  { href: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", icon: Package, adminOnly: true },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: Database, adminOnly: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

// Features that are locked for Free users with Custom Info
const LOCKED_FEATURES_INFO: Record<string, { title: string, description: string }> = {
  "/dashboard/agentes": {
    title: "Gestión de Agentes",
    description: "Gestiona tu equipo de ventas, asigna propiedades, comisiones y monitorea su rendimiento en tiempo real."
  },
  "/dashboard/leads": {
    title: "Central de Leads",
    description: "Centraliza todas las consultas de portales (Zonaprop, Argenprop, etc.) en un solo lugar y automatiza respuestas con IA."
  },
  "/dashboard/sucursales": {
    title: "Multi Sucursal",
    description: "Administra múltiples oficinas o puntos de venta desde un único panel centralizado de control."
  }
};

const LOCKED_FOR_FREE = Object.keys(LOCKED_FEATURES_INFO);

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userPermissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // State for unread messages badge
  const [ticketCount, setTicketCount] = useState(0); // Tickets badge

  // Fetch unread messages for Super Admin
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userRole?.name === 'Super Admin') {
        try {
          // Fetch Leads
          const { leadsService } = await import("@/infrastructure/services/leadsService");
          const newLeads = await leadsService.getLeadsByEstado('SYSTEM_ZETA_PROP', 'nuevo');
          setUnreadCount(newLeads.length);

          // Fetch Tickets
          const { ticketsService } = await import("@/infrastructure/services/ticketsService");
          const pendingTickets = await ticketsService.getAdminPendingTickets();
          setTicketCount(pendingTickets.length);
        } catch (e) {
          console.error("Error fetching notifications", e);
        }
      }
    };

    fetchNotifications();

    // Optional: Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [userRole]);

  // State for Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<{ title: string, description: string } | null>(null);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const isFreeUser = userRole?.name === "Cliente Free";

  const isItemLocked = (href: string) => {
    if (!isFreeUser) return false;
    return LOCKED_FOR_FREE.includes(href);
  };

  const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
    if (isItemLocked(item.href)) {
      e.preventDefault();
      e.stopPropagation();
      const info = LOCKED_FEATURES_INFO[item.href];
      setSelectedFeatureInfo(info || { title: item.label, description: "Funcionalidad exclusiva para usuarios PRO." });
      setIsUpgradeModalOpen(true);
    } else if (onClose) {
      onClose(); // Close mobile menu if not locked
    }
  };

  const hasPermission = (item: MenuItem) => {
    // If it's a locked item for free users, user requested NOT to show them grayed out in the list.
    // So we effectively HIDE them if they are locked and user is free.
    if (isFreeUser && LOCKED_FOR_FREE.includes(item.href)) {
      return false; // Hide completely
    }

    // Always allow Tutorials
    if (item.href === "/dashboard/tutoriales") return true;

    if (isFreeUser) {
      // STRICT CHECK: check if href is in userPermissions
      return userPermissions.includes(item.href);
    }

    // First check if it's admin only
    // Logic update request by user: Strictly follow permissions.
    // If permission system is robust, we don't need this hardcoded bypass.
    // But we must ensure Admin/Super Admin HAVE the permissions in the DB.

    // Then check if user has permission for this specific route
    const requiredPermission = item.permission || item.href;

    // Check if user's permissions include this route
    if (userPermissions.length > 0 && !userPermissions.includes(requiredPermission)) return false;

    return true;
  };

  return (
    <>
      {/* Upgrade Modal */}
      {isUpgradeModalOpen && selectedFeatureInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Decorative background element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                {selectedFeatureInfo.title}
              </h3>

              <p className="text-gray-600">
                {selectedFeatureInfo.description}
                <br /><br />
                <span className="font-semibold text-indigo-600 block">Disponible en Versión PRO</span>
              </p>

              <div className="w-full pt-4 space-y-3">
                <button
                  onClick={() => router.push('/precios')}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-200"
                >
                  Contratar Versión PRO
                </button>
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <span className="text-gray-900">Zeta</span>
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Prop</span>
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
                    <div className="text-gray-900">Z</div>
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">P</div>
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
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none space-y-1">
          {MENU_ITEMS.filter(hasPermission).map((item) => {
            const isActive = pathname === item.href;
            const locked = isItemLocked(item.href);

            return (
              <Link
                key={item.href}
                href={locked ? "#" : item.href}
                onClick={(e) => handleItemClick(e, item)}
                title={collapsed ? item.label : undefined}
                id={`nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-white hover:text-gray-900",
                  locked ? "opacity-60" : "",
                  collapsed ? "justify-center px-0" : ""
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "transition-colors flex-shrink-0",
                    isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-700",
                    locked ? "text-gray-400" : ""
                  )}
                />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {locked && (
                      <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 ml-2">PRO</span>
                    )}

                    {!locked && !isActive && item.href === '/dashboard/leads' && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-2 shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}

                    {!locked && !isActive && item.href === '/dashboard/soporte/ticketera' && ticketCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-2 shadow-sm animate-pulse">
                        {ticketCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {/* Upgrade CTA for Free Users */}
          {isFreeUser && !collapsed && (
            <div className="relative group rounded-xl p-[1px] overflow-hidden mb-2 shadow-lg hover:shadow-indigo-500/25 transition-shadow">
              {/* Animated Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-75 group-hover:opacity-100 animate-border-flow" style={{ backgroundSize: '200% 100%' }}></div>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 animate-gradient-xy opacity-50"></div>

              <div className="relative bg-gray-900 rounded-xl p-4 text-white overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Crown size={60} />
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-sm mb-1 text-indigo-200 flex items-center gap-2">
                    Plan Básico
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  </h4>
                  <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                    Desbloqueá todas las funciones PRO hoy mismo.
                  </p>
                  <button
                    onClick={() => router.push('/precios')}
                    className="w-full bg-white text-gray-900 text-xs font-bold py-2 rounded-lg hover:bg-gray-100 transition shadow-sm flex items-center justify-center gap-1 group-hover:scale-[1.02] transform duration-200"
                  >
                    <Sparkles size={12} className="text-indigo-600 animate-pulse" />
                    Mejorar Plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {isFreeUser && collapsed && (
            <button
              onClick={() => router.push('/precios')}
              className="w-full flex justify-center mb-2 p-2 bg-gray-900 rounded-xl text-white hover:bg-black transition"
              title="Mejorar a PRO"
            >
              <Crown size={20} className="text-amber-400" />
            </button>
          )}

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
