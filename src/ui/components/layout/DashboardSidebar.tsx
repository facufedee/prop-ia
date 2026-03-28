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
  GraduationCap,
  PieChart,
  ChevronDown,
  UserPlus,
  ClipboardList,
  Handshake,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { auth } from "@/infrastructure/firebase/client";
import { signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { addDays, format } from "date-fns";


// Types
type MenuItem = {
  href: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
  permission?: string;
  description?: string;
  isDivider?: boolean;
  subItems?: MenuItem[];
};

// Menu Configuration - Main list
const MENU_ITEMS: MenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Resumen general de tu inmobiliaria" },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Home, description: "Gestión de tu catálogo de inmuebles" },

  {
    href: "/dashboard/alquileres",
    label: "Alquileres",
    icon: Key,
    description: "Administra contratos, cuotas y renovaciones",
    subItems: [
      { href: "/dashboard/alquileres", label: "Panel de Contratos", icon: Key, description: "Todos los contratos activos" },
      { href: "/dashboard/agenda-cobros", label: "Agenda de Cobros", icon: ClipboardList, description: "Cobros pendientes de todos los contratos" },
      { href: "/dashboard/liquidaciones", label: "Liquidaciones", icon: DollarSign, description: "Pagos pendientes a propietarios" },
      { href: "/dashboard/finanzas", label: "Reportes", icon: PieChart, description: "Ingresos, honorarios y movimientos" },
    ]
  },
  {
    href: "/dashboard/ventas",
    label: "Ventas",
    icon: Handshake,
    description: "Operaciones de compraventa",
    subItems: [
      { href: "/dashboard/ventas", label: "Pipeline de Operaciones", icon: Handshake, description: "Todas las operaciones en curso" },
      { href: "/dashboard/ventas/reportes", label: "Reportes de Ventas", icon: TrendingUp, description: "Volumen, comisiones y cierres" },
    ]
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
    description: "Directorio de tus contactos",
    subItems: [
      { href: "/dashboard/clientes?tab=inquilinos", label: "Inquilinos", icon: Users, description: "Lista de Inquilinos" },
      { href: "/dashboard/clientes?tab=propietarios", label: "Propietarios", icon: Building2, description: "Lista de Propietarios" },
      { href: "/dashboard/clientes?tab=leads", label: "Leads", icon: UserPlus, description: "Lista de Leads" }
    ]
  },
  { href: "/dashboard/leads", label: "Consultas", icon: MessageSquare, description: "Central de consultas y mensajes (Leads)" },
  { href: "/dashboard/calendario", label: "Agenda", icon: Calendar, description: "Calendario de citas y eventos" },

  // Divider
  { href: "divider-1", label: "", icon: LayoutDashboard, isDivider: true },

  { href: "/dashboard/novedades", label: "Noticias", icon: Sparkles, description: "Novedades y actualizaciones del rubro" },
  { href: "/dashboard/tutoriales", label: "Tutoriales", icon: GraduationCap, description: "Aprende a usar la plataforma al máximo" },
  { href: "/dashboard/soporte", label: "Soporte", icon: Headphones, description: "Mesa de ayuda y contacto directo" },

  // Other Tools (Hidden in standard flow or kept for Pro admins, but grouped below)
  { href: "divider-2", label: "", icon: LayoutDashboard, isDivider: true, adminOnly: true },
  { href: "/dashboard/tasacion", label: "Tasación IA", icon: Calculator, description: "Herramienta de tasación inteligente" },
  { href: "/dashboard/emprendimientos", label: "Emprendimientos", icon: Building2, description: "Proyectos en pozo o desarrollo" },
  { href: "/dashboard/chat", label: "Chat Zeta Prop", icon: Bot, description: "Asistente virtual inmobiliario" },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone, description: "Distribución en portales" },
  { href: "/dashboard/marketing", label: "Marketing", icon: Mail, permission: "/dashboard/marketing", description: "Emails automáticos y campañas" },
  { href: "/dashboard/blog", label: "Blog / Novedades", icon: FileText, description: "Artículos y notas" },
  { href: "/dashboard/mensajes", label: "Mensajes", icon: Mail, description: "Mensajería interna" },

  // Pro Tools
  { href: "/dashboard/agentes", label: "Agentes", icon: Users, description: "Gestión de equipo de ventas", adminOnly: true },
  { href: "/dashboard/sucursales", label: "Multi Sucursal", icon: Building2, permission: "/dashboard/sucursales", description: "Manejo de múltiples oficinas" },
  { href: "/dashboard/gestion-plataforma", label: "Gestión Plataforma", icon: Shield, permission: "/dashboard/gestion-plataforma", description: "Control total (SuperAdmin)" },

  // Admin & Config
  { href: "/dashboard/soporte/ticketera", label: "Ticketera", icon: Ticket, adminOnly: true, description: "Sistema de tickets" },
  { href: "/dashboard/bitacora", label: "Bitácora", icon: BookOpen, adminOnly: true, description: "Historial de acciones del sistema" },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: UserCog, adminOnly: true, description: "Gestión de roles" },
  { href: "/dashboard/configuracion/suscripciones", label: "Suscripciones", icon: Package, adminOnly: true, description: "Planes activos" },
  { href: "/dashboard/configuracion/backup", label: "Backup", icon: Database, adminOnly: true, description: "Respaldo y seguridad" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, description: "Ajustes de la inmobiliaria" },
];


interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userPermissions, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
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


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
    if (item.subItems) {
      e.preventDefault();
      setExpandedMenus(prev =>
        prev.includes(item.href) ? prev.filter(h => h !== item.href) : [...prev, item.href]
      );
      if (collapsed) setCollapsed(false); // Auto-expand sidebar if collapsed
      return;
    }

    if (onClose) {
      onClose(); // Close mobile menu
    }
  };

  const hasPermission = (item: MenuItem) => {
    // Always allow Tutorials
    if (item.href === "/dashboard/tutoriales") return true;

    // First check if user has permission for this specific route
    const requiredPermission = item.permission || item.href;

    // STRICT CHECK: check if href is in userPermissions array
    // This removes the need for checking "adminOnly" since admins
    // will just have those permissions included in their array
    if (userPermissions && userPermissions.length > 0) {
      return userPermissions.includes(requiredPermission);
    }

    return false;
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
          "fixed top-0 left-0 z-50 h-screen bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-transparent transition-all duration-300 ease-in-out flex flex-col lg:relative",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 min-h-[64px]",
          collapsed ? "px-0 justify-center" : ""
        )}>
          {!collapsed && (
            <>
              {(userRole as any)?.logoUrl ? (
                <div className="flex items-center justify-center flex-1 min-w-0 py-2">
                  <img
                    src={(userRole as any).logoUrl}
                    alt="Logo Inmobiliaria"
                    className="h-10 w-auto max-w-[180px] object-contain dark:brightness-0 dark:invert"
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold truncate">
                  <span className="text-gray-900 dark:text-white">Zeta</span>
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">Prop</span>
                </h1>
              )}
            </>
          )}
          {collapsed && (
            <div className="w-full flex justify-center py-2">
              {(userRole as any)?.logoUrl ? (
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src={(userRole as any).logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain dark:brightness-0 dark:invert"
                  />
                </div>
              ) : (
                <div className="text-lg font-bold leading-none text-center">
                  <div className="text-gray-900 dark:text-white">Z</div>
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">P</div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Collapsed expand button */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex mx-auto mt-3 p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-none space-y-0.5 pb-20">
          {MENU_ITEMS.filter(hasPermission).map((item) => {
            if (item.isDivider) {
              return <div key={item.href} className="my-2 mx-2 border-t border-gray-200 dark:border-white/10"></div>;
            }

            const isActive = pathname === item.href || (item.subItems && item.subItems.some(s => pathname === s.href));
            const isExpanded = expandedMenus.includes(item.href);

            return (
              <div key={item.href} className="flex flex-col">
                <Link
                  href={item.subItems ? "#" : item.href}
                  onClick={(e) => handleItemClick(e, item)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 w-full group",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white",
                    collapsed ? "justify-center px-0" : ""
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    )}
                  />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate text-sm font-medium">{item.label}</span>

                      {item.subItems && (
                        <ChevronDown size={14} className={cn("transition-transform text-gray-400 dark:text-gray-600 flex-shrink-0", isExpanded && "rotate-180")} />
                      )}

                      {item.href === '/dashboard/leads' && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                          {unreadCount}
                        </span>
                      )}

                      {!isActive && item.href === '/dashboard/soporte/ticketera' && ticketCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                          {ticketCount}
                        </span>
                      )}
                    </div>
                  )}
                </Link>

                {/* Submenu Items */}
                {item.subItems && isExpanded && !collapsed && (
                  <div className="ml-4 pl-4 mt-0.5 mb-1 space-y-0.5 border-l border-gray-200 dark:border-white/10">
                    {item.subItems.map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => onClose && onClose()}
                          className={cn(
                            "flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all w-full",
                            isSubActive
                              ? "bg-indigo-600/80 text-white"
                              : "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                          )}
                        >
                          <sub.icon size={14} className={cn("flex-shrink-0", isSubActive ? "text-white" : "text-gray-400 dark:text-gray-600")} />
                          <span className="font-medium">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-500 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-white/8 hover:text-red-600 dark:hover:text-red-400 transition-colors",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Cerrar Sesión" : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
