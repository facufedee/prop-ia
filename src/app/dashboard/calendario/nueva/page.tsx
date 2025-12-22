"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { visitasService } from "@/infrastructure/services/visitasService";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Property {
    id: string;
    direccion: string;
    property_type: string;
}

export default function NuevaVisitaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        propiedadId: "",
        clienteNombre: "",
        clienteEmail: "",
        clienteTelefono: "",
        agenteId: "",
        fecha: "",
        hora: "",
        duracion: "60",
        notasPrevias: "",
    });

    useEffect(() => {
        fetchProperties();
        fetchAgents();
    }, []);

    const fetchProperties = async () => {
        if (!auth?.currentUser || !db) return;

        try {
            const q = query(
                collection(db, "properties"),
                where("userId", "==", auth.currentUser.uid)
            );
            const snapshot = await getDocs(q);
            const props = snapshot.docs.map(doc => ({
                id: doc.id,
                direccion: `${doc.data().calle} ${doc.data().altura}, ${doc.data().localidad}`,
                property_type: doc.data().property_type,
            }));
            setProperties(props);
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    const fetchAgents = async () => {
        if (!auth?.currentUser || !db) return;

        try {
            // Get users with Agente or Administrador role
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            const users = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    nombre: doc.data().displayName || doc.data().email,
                    email: doc.data().email,
                }))
                .filter(u => u.id === auth?.currentUser?.uid); // For now, only current user

            setAgents([...users, { id: auth.currentUser.uid, nombre: "Yo", email: auth.currentUser.email }]);
        } catch (error) {
            console.error("Error fetching agents:", error);
            // Fallback: use current user
            setAgents([{
                id: auth.currentUser.uid,
                nombre: auth.currentUser.displayName || "Yo",
                email: auth.currentUser.email
            }]);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser) return;

        try {
            setLoading(true);

            const selectedProperty = properties.find(p => p.id === formData.propiedadId);
            const selectedAgent = agents.find(a => a.id === formData.agenteId);

            if (!selectedProperty || !selectedAgent) {
                alert("Por favor selecciona una propiedad y un agente");
                return;
            }

            // Combine date and time
            const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);

            await visitasService.createVisita({
                propiedadId: formData.propiedadId,
                propiedadDireccion: selectedProperty.direccion,
                propiedadTipo: selectedProperty.property_type,
                clienteNombre: formData.clienteNombre,
                clienteEmail: formData.clienteEmail,
                clienteTelefono: formData.clienteTelefono,
                agenteId: formData.agenteId,
                agenteNombre: selectedAgent.nombre,
                fechaHora,
                duracion: parseInt(formData.duracion),
                estado: 'programada',
                notasPrevias: formData.notasPrevias,
                recordatorioEnviado: false,
                userId: auth.currentUser.uid,
            });

            router.push("/dashboard/calendario");
        } catch (error) {
            console.error("Error creating visita:", error);
            alert("Error al crear la visita");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/calendario"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver al calendario
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Nueva Visita</h1>
                <p className="text-gray-500">Agendar una visita a una propiedad</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Propiedad */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Propiedad *
                    </label>
                    <select
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.propiedadId}
                        onChange={(e) => handleChange("propiedadId", e.target.value)}
                    >
                        <option value="">Seleccionar propiedad...</option>
                        {properties.map(prop => (
                            <option key={prop.id} value={prop.id}>
                                {prop.direccion} - {prop.property_type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Datos del Cliente */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.clienteNombre}
                                onChange={(e) => handleChange("clienteNombre", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.clienteEmail}
                                onChange={(e) => handleChange("clienteEmail", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.clienteTelefono}
                                onChange={(e) => handleChange("clienteTelefono", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Agente Asignado *
                            </label>
                            <select
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.agenteId}
                                onChange={(e) => handleChange("agenteId", e.target.value)}
                            >
                                <option value="">Seleccionar agente...</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fecha y Hora */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fecha y Hora</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.fecha}
                                onChange={(e) => handleChange("fecha", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hora *
                            </label>
                            <input
                                type="time"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.hora}
                                onChange={(e) => handleChange("hora", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duración (minutos) *
                            </label>
                            <select
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.duracion}
                                onChange={(e) => handleChange("duracion", e.target.value)}
                            >
                                <option value="30">30 minutos</option>
                                <option value="60">1 hora</option>
                                <option value="90">1.5 horas</option>
                                <option value="120">2 horas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notas */}
                <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas Previas
                    </label>
                    <textarea
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Información adicional sobre la visita..."
                        value={formData.notasPrevias}
                        onChange={(e) => handleChange("notasPrevias", e.target.value)}
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Link
                        href="/dashboard/calendario"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creando..." : "Agendar Visita"}
                    </button>
                </div>
            </form>
        </div>
    );
}
