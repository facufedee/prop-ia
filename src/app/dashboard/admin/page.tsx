"use client";

import { useState, useEffect } from "react";
import { adminService } from "@/infrastructure/services/adminService";
import { User } from "@/domain/models/User";
import { Users, CreditCard, Activity, DollarSign, Search, Shield } from "lucide-react";

export default function PlatformAdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubscriptions: 0,
        mrr: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, statsData] = await Promise.all([
                    adminService.getAllUsers(),
                    adminService.getPlatformStats()
                ]);
                setUsers(usersData);
                setStats(statsData);
            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'trial': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando panel de administración...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Administración de Plataforma</h1>
                <p className="text-gray-500 mt-2">Visión general de usuarios, planes y métricas.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Usuarios Totales</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Suscripciones Activas</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeSubscriptions}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                        <Activity size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">MRR Estimado</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">${stats.mrr.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Usuarios Free</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            {users.filter(u => !u.subscription || u.subscription.planId === 'free').length}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                        <Shield size={24} />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Usuarios Registrados</h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar usuario por nombre o email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {user.photoURL ? (
                                                        <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                            {user.displayName?.charAt(0) || user.email?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sin nombre'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 capitalize">
                                                {user.subscription?.planId || 'Free'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user.subscription?.billingPeriod ? `${user.subscription.billingPeriod}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.subscription?.status)}`}>
                                                {user.subscription?.status ? user.subscription.status.toUpperCase() : 'FREE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.roleId || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
