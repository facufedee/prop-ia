"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    Bell,
    User as UserIcon,
    LogOut,
    ChevronDown,
    ChevronUp,
    Menu
} from "lucide-react";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { roleService, Role } from "@/infrastructure/services/roleService";

interface DashboardHeaderProps {
    onMobileMenuClick?: () => void;
}

export default function DashboardHeader({ onMobileMenuClick }: DashboardHeaderProps) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const profileRef = useRef<HTMLDivElement>(null);

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

    // Notifications Listener
    useEffect(() => {
        if (!user) return;
        const unsubTickets = ticketsService.subscribeToUserTickets(user.uid, (tickets) => {
            const waitingCount = tickets.filter(t => t.status === 'esperando_respuesta').length;
            setNotificationCount(waitingCount);
        });
        return () => unsubTickets();
    }, [user]);

    // Click Outside Handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Left Section: Mobile Menu & Title/Breadcrumb placeholder */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuClick}
                    className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Right Section: Notifications & User Profile */}
            <div className="flex items-center gap-4 md:gap-6">

                {/* Notifications */}
                <Link
                    href="/dashboard/soporte"
                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group"
                    aria-label="Notificaciones"
                >
                    <Bell className="w-6 h-6 group-hover:text-indigo-600" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                    )}
                </Link>

                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

                {/* User Menu */}
                {user && (
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-100">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm">{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="hidden md:flex flex-col items-start pr-2">
                                <span className="text-sm font-semibold text-gray-800 leading-none">
                                    {user.displayName?.split(' ')[0] || "Usuario"}
                                </span>
                                <span className="text-xs text-gray-500 mt-1 max-w-[120px] truncate">
                                    {userRole?.name || "Sin rol"}
                                </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-50">
                                <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                                    <p className="text-sm font-semibold text-gray-900">{user.displayName || "Usuario"}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>

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
