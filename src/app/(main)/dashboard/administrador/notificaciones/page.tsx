"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
    Bell,
    Check,
    CheckCircle2,
    Clock,
    Filter,
    LogOut,
    Search,
    Settings,
    Trash2,
    X
} from "lucide-react";
import { notificationService, AppNotification } from "@/infrastructure/services/notificationService";
import { roleService } from "@/infrastructure/services/roleService";

export default function NotificationsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const router = useRouter();

    // 1. Auth & Role Check
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/dashboard/administrador/notificaciones");
                return;
            }

            // Check role
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.roleId) {
                    const role = await roleService.getRoleById(userData.roleId);
                    if (role?.name !== 'Administrador') {
                        router.push("/dashboard");
                        return;
                    }
                }
            }

            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // 2. Subscribe to Notifications
    useEffect(() => {
        if (!user) return;

        // We subscribe as 'Administrador'
        const unsubscribe = notificationService.subscribeToNotifications(user.uid, 'Administrador', (data) => {
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAllRead = async () => {
        if (!user) return;
        const unread = notifications.filter(n => !n.readBy.includes(user.uid));
        if (unread.length === 0) return;

        // Optimistic update could go here, but realtime subscription handles it fast enough
        await Promise.all(unread.map(n => notificationService.markAsRead(n.id, user.uid)));
    };

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!user) return;
        await notificationService.markAsRead(notification.id, user.uid);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') {
            return !n.readBy.includes(user?.uid || '');
        }
        return true;
    });

    const unreadCount = notifications.filter(n => !n.readBy.includes(user?.uid || '')).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Bell className="w-8 h-8 text-indigo-600" />
                            Notificaciones
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Centro de alertas y avisos del sistema
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Marcar todo como leído
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${filter === 'all'
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Todas
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {notifications.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${filter === 'unread'
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            No leídas
                            {unreadCount > 0 && (
                                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="divide-y divide-gray-100">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                    {filter === 'unread' ? 'Estás al día' : 'No hay notificaciones'}
                                </h3>
                                <p className="text-sm">
                                    {filter === 'unread'
                                        ? 'No tienes notificaciones pendientes de leer.'
                                        : 'Aún no has recibido ninguna notificación.'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif) => {
                                const isUnread = !notif.readBy.includes(user?.uid || '');
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-6 flex gap-4 transition-colors cursor-pointer group ${isUnread ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'bg-white hover:bg-gray-50'
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                                notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                    notif.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {notif.type === 'success' ? <Check className="w-6 h-6" /> :
                                                notif.type === 'warning' ? <LogOut className="w-6 h-6" /> :
                                                    notif.type === 'error' ? <X className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className={`text-base font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap ml-2">
                                                    <Clock className="w-3 h-3" />
                                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${isUnread ? 'text-gray-800' : 'text-gray-600'} leading-relaxed`}>
                                                {notif.message}
                                            </p>
                                        </div>

                                        {/* Status Indicator */}
                                        {isUnread && (
                                            <div className="shrink-0 self-center">
                                                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
