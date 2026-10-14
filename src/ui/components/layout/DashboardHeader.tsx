"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    Bell,
    User as UserIcon,
    LogOut,
    ChevronDown,
    Menu,
    Settings,
    Check,
    X,
    Store,
} from "lucide-react";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { notificationService, AppNotification } from "@/infrastructure/services/notificationService";
import { useBranchContext } from "@/infrastructure/context/BranchContext";

interface DashboardHeaderProps {
    onMobileMenuClick?: () => void;
}

export default function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Branch Selector State
    const [branchMenuOpen, setBranchMenuOpen] = useState(false);
    const branchRef = useRef<HTMLDivElement>(null);
    const { branches, selectedBranchId, setSelectedBranchId, currentContextLabel } = useBranchContext();

    // Notification State
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Auth & Role Listener
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) setUserRole(null);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                if (data.roleId) {
                    try {
                        const role = await roleService.getRoleById(data.roleId);
                        setUserRole(role);
                    } catch (error) {
                        console.error('Error fetching role details:', error);
                    }
                }
            }
        });

        // Setup subscription listener
        const subQuery = query(collection(db, "subscriptions"), where("userId", "==", user.uid));
        const unsubscribeSub = onSnapshot(subQuery, (snap) => {
            if (!snap.empty) {
                setSubscription(snap.docs[0].data());
            } else {
                setSubscription(null);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeSub();
        };
    }, [user]);

    // Notifications Listener
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        let roleToSubscribe = userRole?.name || 'Usuario';
        if (roleToSubscribe === 'Super Admin') roleToSubscribe = 'Administrador';

        const unsubscribe = notificationService.subscribeToNotifications(user.uid, roleToSubscribe, (data) => {
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    // Click Outside Handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
            }
            if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
                setBranchMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!user) return;
        await notificationService.markAsRead(notification.id, user.uid);
        if (notification.link) {
            router.push(notification.link);
            setNotifOpen(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.readBy.includes(user?.uid || '')).length;

    return (
        <header className="bg-[var(--color-paper)]/90 backdrop-blur-md border-b border-[var(--color-rule)] h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden p-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] rounded-lg"
                    aria-label="Abrir menú"
                >
                    <Menu size={20} strokeWidth={1.5} />
                </button>

                {/* Branch Context Selector */}
                {branches.length > 0 && (
                    <div className="hidden md:flex items-center gap-2 border-l border-[var(--color-rule)] pl-4 ml-4">
                        <span className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">Sucursal:</span>
                        <div className="relative" ref={branchRef}>
                            <button
                                onClick={() => setBranchMenuOpen(!branchMenuOpen)}
                                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)] transition-colors"
                            >
                                <Store size={16} strokeWidth={1.5} className="text-[var(--color-muted)]" />
                                {currentContextLabel}
                                {(userRole?.name === 'Super Admin' || userRole?.permissions?.includes('/dashboard/sucursales')) && (
                                    <ChevronDown size={14} strokeWidth={1.5} className={`text-[var(--color-muted)] transition-transform ${branchMenuOpen ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            {/* Dropdown */}
                            {(userRole?.name === 'Super Admin' || userRole?.permissions?.includes('/dashboard/sucursales')) && branchMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--color-paper-2)] rounded-lg shadow-lg shadow-black/40 border border-[var(--color-rule)] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => {
                                            setSelectedBranchId('all');
                                            setBranchMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-paper-3)] flex items-center justify-between ${selectedBranchId === 'all' ? 'text-[var(--color-ink)] font-medium bg-[var(--color-paper-3)]' : 'text-[var(--color-muted)]'}`}
                                    >
                                        Todas las Sucursales
                                        {selectedBranchId === 'all' && <Check size={14} strokeWidth={1.5} className="text-[var(--color-accent)]" />}
                                    </button>
                                    <div className="border-t border-[var(--color-rule)] my-1"></div>
                                    {branches.map(branch => (
                                        <button
                                            key={branch.id}
                                            onClick={() => {
                                                setSelectedBranchId(branch.id);
                                                setBranchMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-paper-3)] flex items-center justify-between ${selectedBranchId === branch.id ? 'text-[var(--color-ink)] font-medium bg-[var(--color-paper-3)]' : 'text-[var(--color-muted)]'}`}
                                        >
                                            <span className="truncate">{branch.name}</span>
                                            {selectedBranchId === branch.id && <Check size={14} strokeWidth={1.5} className="text-[var(--color-accent)]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="relative p-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] rounded-full transition-colors"
                        aria-label="Notificaciones"
                    >
                        <Bell size={20} strokeWidth={1.5} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--color-accent)] text-[var(--color-accent-ink)] text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[var(--color-paper)] animate-in zoom-in">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {notifOpen && (
                        <div className="fixed left-4 right-4 top-[70px] w-auto sm:absolute sm:right-0 sm:top-full sm:left-auto sm:w-96 sm:mt-3 bg-[var(--color-paper-2)] rounded-md shadow-xl shadow-black/40 border border-[var(--color-rule)] animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="hidden sm:block absolute -top-2 right-3 w-4 h-4 bg-[var(--color-paper-2)] border-t border-l border-[var(--color-rule)] transform rotate-45"></div>

                            {/* Header */}
                            <div className="relative px-4 py-3 border-b border-[var(--color-rule)] flex justify-between items-center bg-[var(--color-paper-2)] rounded-t-md z-10">
                                <h3 className="font-heading font-semibold text-[var(--color-ink)] text-base">Notificaciones</h3>
                                <div className="flex gap-2">
                                    {notifications.filter(n => !n.readBy.includes(user?.uid || '')).length > 0 && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!user) return;
                                                const unread = notifications.filter(n => !n.readBy.includes(user.uid));
                                                await Promise.all(unread.map(n => notificationService.markAsRead(n.id, user.uid)));
                                            }}
                                            className="text-[var(--color-ink-2)] hover:text-[var(--color-ink)] text-xs font-semibold px-2 py-1 border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] rounded transition-colors"
                                            title="Marcar todas como leídas"
                                        >
                                            Marcar leídas
                                        </button>
                                    )}
                                    <button className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors" aria-label="Ajustes de notificaciones">
                                        <Settings size={18} strokeWidth={1.5} />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="relative max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-[var(--color-paper-2)] rounded-b-md z-10">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center text-[var(--color-muted)] flex flex-col items-center">
                                        <Bell size={28} strokeWidth={1.5} className="text-[var(--color-neutral)] mb-4" />
                                        <p className="font-medium text-[var(--color-ink-2)] mb-1">No tienes notificaciones</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => {
                                        const isRead = notif.readBy.includes(user?.uid || '');
                                        const toneClass = notif.type === 'success' ? 'text-[var(--color-positive)]' :
                                            notif.type === 'warning' ? 'text-[var(--color-warning)]' :
                                                notif.type === 'error' ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]';
                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`px-4 py-4 cursor-pointer border-b border-[var(--color-rule)] last:border-b-0 transition-colors flex gap-3 hover:bg-[var(--color-paper-3)] ${isRead ? '' : 'border-l-2 border-l-[var(--color-accent)] bg-[var(--color-paper-3)]/50'}`}
                                            >
                                                <div className={`shrink-0 mt-0.5 ${toneClass}`}>
                                                    {notif.type === 'success' ? <Check size={18} strokeWidth={1.5} /> :
                                                        notif.type === 'warning' ? <LogOut size={18} strokeWidth={1.5} /> :
                                                            notif.type === 'error' ? <X size={18} strokeWidth={1.5} /> : <Bell size={18} strokeWidth={1.5} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-[var(--color-ink)] line-clamp-1 pr-2">{notif.title}</h4>
                                                    <p className="text-sm text-[var(--color-muted)] line-clamp-3 leading-relaxed">{notif.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer Link */}
                            <div className="p-3 bg-[var(--color-paper-3)] border-t border-[var(--color-rule)] text-center rounded-b-md">
                                <Link
                                    href="/dashboard/notificaciones"
                                    className="text-sm text-[var(--color-accent)] font-medium hover:underline block w-full"
                                    onClick={() => setNotifOpen(false)}
                                >
                                    Ver todas las notificaciones
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-[var(--color-rule)] hidden md:block"></div>

                {/* User Menu */}
                {user && (
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[var(--color-paper-2)] transition-colors border border-transparent hover:border-[var(--color-rule)]"
                        >
                            <div className="w-9 h-9 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink)] overflow-hidden">
                                {userData?.logoUrl ? (
                                    <img src={userData.logoUrl} alt="Logo Inmobiliaria" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <span className="font-heading font-semibold text-sm">{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col items-start pr-2">
                                <span className="text-sm font-semibold text-[var(--color-ink)] leading-none">{user.displayName?.split(' ')[0] || "Usuario"}</span>
                                <span className="text-xs text-[var(--color-muted)] mt-1 max-w-[120px] truncate">
                                    {subscription?.planTier
                                        ? `Plan ${subscription.planTier.charAt(0).toUpperCase() + subscription.planTier.slice(1)}`
                                        : (userRole?.name || "Sin rol")}
                                </span>
                            </div>
                            <ChevronDown size={16} strokeWidth={1.5} className={`text-[var(--color-muted)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Profile Dropdown */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-[var(--color-paper-2)] rounded-xl shadow-xl shadow-black/40 border border-[var(--color-rule)] py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
                                <Link
                                    href="/dashboard/cuenta"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <UserIcon size={16} strokeWidth={1.5} className="text-[var(--color-muted)]" />
                                    Mi Perfil / Inmobiliaria
                                </Link>
                                <div className="border-t border-[var(--color-rule)] my-1"></div>
                                <button
                                    onClick={async () => {
                                        if (auth) {
                                            await signOut(auth);
                                            router.push('/login');
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
                                >
                                    <LogOut size={16} strokeWidth={1.5} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
