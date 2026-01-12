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
    ExternalLink,
    Building2
} from "lucide-react";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { notificationService, AppNotification } from "@/infrastructure/services/notificationService";
import { useBranchContext } from "@/infrastructure/context/BranchContext";

interface DashboardHeaderProps {
    onMobileMenuClick?: () => void;
}

export default function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
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
        });
        return () => unsubscribe();
    }, [user]);

    // Admin Notifications Listener
    useEffect(() => {
        if (!user || (userRole?.name !== 'Administrador' && userRole?.name !== 'Super Admin')) {
            setNotifications([]);
            return;
        }

        // Subscribe as 'Administrador' even if Super Admin to receive admin alerts, 
        // or check if service supports 'Super Admin'. Assuming 'Administrador' channel is what we want.
        const roleToSubscribe = userRole.name === 'Super Admin' ? 'Administrador' : 'Administrador';

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
        <header className="bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Branch Context Selector */}
                {branches.length > 0 && (
                    <div className="hidden md:flex items-center gap-2 border-l border-gray-200 pl-4 ml-4">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Sucursal:</span>
                        <div className="relative" ref={branchRef}>
                            <button
                                onClick={() => setBranchMenuOpen(!branchMenuOpen)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
                            >
                                <Building2 className="w-4 h-4" />
                                {currentContextLabel}
                                {(userRole?.name === 'Super Admin' || userRole?.permissions?.includes('/dashboard/sucursales')) && (
                                    <ChevronDown className={`w-3 h-3 transition-transform ${branchMenuOpen ? 'rotate-180' : ''}`} />
                                )}
                            </button>

                            {/* Dropdown */}
                            {(userRole?.name === 'Super Admin' || userRole?.permissions?.includes('/dashboard/sucursales')) && branchMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => {
                                            setSelectedBranchId('all');
                                            setBranchMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedBranchId === 'all' ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-600'}`}
                                    >
                                        Todas las Sucursales
                                        {selectedBranchId === 'all' && <Check className="w-3 h-3" />}
                                    </button>
                                    <div className="border-t border-gray-50 my-1"></div>
                                    {branches.map(branch => (
                                        <button
                                            key={branch.id}
                                            onClick={() => {
                                                setSelectedBranchId(branch.id);
                                                setBranchMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedBranchId === branch.id ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-600'}`}
                                        >
                                            <span className="truncate">{branch.name}</span>
                                            {selectedBranchId === branch.id && <Check className="w-3 h-3" />}
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
                {/* Admin Notifications */}
                {(userRole?.name === 'Administrador' || userRole?.name === 'Super Admin') && (
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setNotifOpen(!notifOpen)}
                            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group"
                        >
                            <Bell className="w-6 h-6 group-hover:text-indigo-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {notifOpen && (
                            <div className="fixed left-4 right-4 top-[70px] w-auto sm:absolute sm:right-0 sm:top-full sm:left-auto sm:w-96 sm:mt-3 bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 animate-in fade-in zoom-in-95 duration-200 z-50">
                                <div className="hidden sm:block absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

                                {/* Header */}
                                <div className="relative px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-md z-10">
                                    <h3 className="font-medium text-gray-900 text-base">Notificaciones</h3>
                                    <div className="flex gap-2">
                                        {notifications.filter(n => !n.readBy.includes(user?.uid || '')).length > 0 && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!user) return;
                                                    const unread = notifications.filter(n => !n.readBy.includes(user.uid));
                                                    await Promise.all(unread.map(n => notificationService.markAsRead(n.id, user.uid)));
                                                }}
                                                className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                                                title="Marcar todas como leídas"
                                            >
                                                Marcar leídas
                                            </button>
                                        )}
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="relative max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar bg-white rounded-b-md z-10">
                                    {notifications.length === 0 ? (
                                        <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Bell size={32} className="text-gray-300" />
                                            </div>
                                            <p className="font-medium text-gray-900 mb-1">No tienes notificaciones</p>
                                        </div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`px-4 py-4 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex gap-4 ${notif.readBy.includes(user?.uid || '') ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
                                            >
                                                <div className="shrink-0 mt-1">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                                        notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                            notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {notif.type === 'success' ? <Check size={20} /> :
                                                            notif.type === 'warning' ? <LogOut size={20} /> :
                                                                notif.type === 'error' ? <X size={20} /> : <Bell size={20} />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 pr-2">{notif.title}</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{notif.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer Lnk */}
                                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center rounded-b-md">
                                    <Link
                                        href="/dashboard/administrador/notificaciones"
                                        className="text-sm text-blue-600 font-medium hover:underline block w-full"
                                        onClick={() => setNotifOpen(false)}
                                    >
                                        Ver todas las notificaciones
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                {/* User Menu */}
                {user && (
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white overflow-hidden ring-2 ring-white shadow-sm">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <span className="font-bold text-sm">{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col items-start pr-2">
                                <span className="text-sm font-semibold text-gray-800 leading-none">{user.displayName?.split(' ')[0] || "Usuario"}</span>
                                <span className="text-xs text-gray-500 mt-1 max-w-[120px] truncate">{userRole?.name || "Sin rol"}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Profile Dropdown */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
                                <Link
                                    href="/dashboard/cuenta"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <UserIcon size={16} />
                                    Mi Perfil / Inmobiliaria
                                </Link>
                                <div className="border-t border-gray-50 my-1"></div>
                                <button
                                    onClick={() => { if (auth) signOut(auth); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} />
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
