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
  Globe,
  Palette,
  Signpost,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Wordmark from "@/ui/components/brand/Wordmark";
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
  { href: "/dashboard", label: "Menú Principal", icon: LayoutDashboard, description: "Resumen general de tu inmobiliaria" },
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
  { href: "/dashboard/carteleria", label: "Cartelería", icon: Signpost, permission: "/dashboard/carteleria", description: "Inventario y seguimiento de carteles" },

  // Divider
  { href: "divider-1", label: "", icon: LayoutDashboard, isDivider: true },

  {
    href: "/dashboard/mi-sitio",
    label: "Mi Sitio Web",
    icon: Globe,
    description: "Tu portal inmobiliario público",
    subItems: [
      { href: "/dashboard/mi-sitio?tab=plantilla", label: "Plantilla", icon: Sparkles, description: "Elegí el diseño de tu sitio" },
      { href: "/dashboard/mi-sitio?tab=identidad", label: "Identidad y Logo", icon: Building2, description: "Nombre, logo e imagen de portada" },
      { href: "/dashboard/mi-sitio?tab=colores", label: "Colores", icon: Palette, description: "Personalizá los colores" },
      { href: "/dashboard/mi-sitio?tab=contacto", label: "Contacto y Redes", icon: MessageSquare, description: "WhatsApp, email y redes sociales" },
      { href: "/dashboard/mi-sitio?tab=dominio", label: "Dominio", icon: Globe, description: "Subdominio y dominio propio" },
      { href: "/dashboard/mi-sitio?tab=seo", label: "SEO", icon: TrendingUp, description: "Título, descripción y metadatos" },
    ],
  },
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
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const fullPath = currentTab ? `${pathname}?tab=${currentTab}` : pathname;
  const router = useRouter();
  const { userRole, userPermissions, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // State for unread messages badge
  const [ticketCount, setTicketCount] = useState(0); // Tickets badge

  // Fetch badge counts for leads and tickets
  useEffect(() => {
    if (!user?.uid && userRole?.name !== 'Super Admin') return;

    const fetchBadges = async () => {
      try {
        const { leadsService } = await import("@/infrastructure/services/leadsService");

        if (userRole?.name === 'Super Admin') {
          const newLeads = await leadsService.getLeadsByEstado('SYSTEM_ZETA_PROP', 'nuevo');
          setUnreadCount(newLeads.length);

          const { ticketsService } = await import("@/infrastructure/services/ticketsService");
          const pendingTickets = await ticketsService.getAdminPendingTickets();
          setTicketCount(pendingTickets.length);
        } else if (user?.uid) {
          const newLeads = await leadsService.getLeadsByEstado(user.uid, 'nuevo');
          setUnreadCount(newLeads.length);
        }
      } catch (e) {
        console.error("Error fetching badge counts", e);
      }
    };

    fetchBadges();
    // Skip polling while the tab is in the background — refresh immediately
    // when it becomes visible again instead of wasting reads while unattended.
    const interval = setInterval(() => {
      if (!document.hidden) fetchBadges();
    }, 60000);
    const handleVisibility = () => { if (!document.hidden) fetchBadges(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.uid, userRole]);


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

    // Full access roles bypass the permissions array, consistent with
    // PermissionGuard/AdminGuard/RoleProtection
    if (userRole?.name === "Super Admin" || userRole?.name === "Administrador") return true;

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
          "fixed top-0 left-0 z-50 h-screen bg-[var(--color-paper)] border-r border-[var(--color-rule)] transition-all duration-300 ease-in-out flex flex-col lg:relative font-sans",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Branding & Header */}
        <div className={cn(
          "flex flex-col border-b border-[var(--color-rule)] relative",
          collapsed ? "py-4 items-center" : "p-6"
        )}>
          {!collapsed ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                {/* Agency Logo */}
                <div className="h-12 flex items-center justify-start">
                  {(userRole as any)?.logoUrl ? (
                    <img
                      src={(userRole as any).logoUrl}
                      alt="Logo Inmobiliaria"
                      className="h-10 w-auto max-w-full object-contain dark:brightness-0 dark:invert"
                    />
                  ) : (
                    <Link href="/dashboard" aria-label="Ir al inicio del panel">
                      <Wordmark size="md" />
                    </Link>
                  )}
                </div>

                {/* Desktop Collapse Toggle */}
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="hidden lg:flex p-1.5 hover:bg-[var(--color-paper-2)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Mobile Close Button */}
                <button
                  onClick={onClose}
                  className="lg:hidden p-1 hover:bg-[var(--color-paper-2)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Identity */}
              <div className="flex items-center gap-3 p-3 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] shadow-sm">
                <div className="w-10 h-10 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent)] font-bold shrink-0 overflow-hidden">
                   {user?.photoURL ? (
                     <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                   ) : (
                     user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"
                   )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[var(--color-ink)] truncate">
                    {user?.displayName || "Mi Inmobiliaria"}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest font-medium">
                    {userRole?.name || "Panel de Gestión"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {(userRole as any)?.logoUrl ? (
                <img
                  src={(userRole as any).logoUrl}
                  alt="Logo"
                  className="w-8 h-8 object-contain dark:brightness-0 dark:invert"
                />
              ) : (
                <Link
                  href="/dashboard"
                  aria-label="Ir al inicio del panel"
                  className="flex w-10 h-10 items-center justify-center rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)]"
                >
                  <Wordmark size="sm" compact />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Collapsed expand button */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex mx-auto mt-3 p-1.5 hover:bg-[var(--color-paper-2)] rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-none space-y-0.5 pb-20">
          {MENU_ITEMS.filter(hasPermission).map((item) => {
            if (item.isDivider) {
              return <div key={item.href} className="my-2 mx-2 border-t border-[var(--color-rule)]"></div>;
            }

            const isActive = pathname === item.href || (item.subItems && item.subItems.some(s => fullPath === s.href || pathname === s.href));
            const isExpanded = expandedMenus.includes(item.href);

            return (
              <div key={item.href} className="flex flex-col">
                <Link
                  href={item.subItems ? "#" : item.href}
                  onClick={(e) => handleItemClick(e, item)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 w-full group",
                    isActive
                      ? "bg-[var(--color-paper-3)] text-[var(--color-accent)] font-semibold border-l-2 border-[var(--color-accent)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]",
                    collapsed ? "justify-center px-0" : ""
                  )}
                >
                  <item.icon
                    size={18}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted)] group-hover:text-[var(--color-ink-2)]"
                    )}
                  />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between min-w-0">
                      <span className="truncate text-sm font-medium">{item.label}</span>

                      {item.subItems && (
                        <ChevronDown size={14} className={cn("transition-transform text-[var(--color-neutral)] flex-shrink-0", isExpanded && "rotate-180")} />
                      )}

                      {item.href === '/dashboard/leads' && unreadCount > 0 && (
                        <span className="bg-[var(--color-accent)] text-[var(--color-paper)] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                          {unreadCount}
                        </span>
                      )}

                      {!isActive && item.href === '/dashboard/soporte/ticketera' && ticketCount > 0 && (
                        <span className="bg-[var(--color-accent)] text-[var(--color-paper)] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2">
                          {ticketCount}
                        </span>
                      )}
                    </div>
                  )}
                </Link>

                {/* Submenu Items */}
                {item.subItems && isExpanded && !collapsed && (
                  <div className="ml-4 pl-4 mt-0.5 mb-1 space-y-0.5 border-l border-[var(--color-rule)]">
                    {item.subItems.map(sub => {
                      const isSubActive = fullPath === sub.href || pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => onClose && onClose()}
                          className={cn(
                            "flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all w-full",
                            isSubActive
                              ? "text-[var(--color-accent)] font-semibold bg-[var(--color-paper-3)]"
                              : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]"
                          )}
                        >
                          <sub.icon size={15} className={cn(isSubActive ? "text-[var(--color-accent)]" : "text-[var(--color-neutral)]")} />
                          <span className="truncate">{sub.label}</span>
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
        <div className="p-3 border-t border-[var(--color-rule)]">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-danger)] transition-colors",
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
