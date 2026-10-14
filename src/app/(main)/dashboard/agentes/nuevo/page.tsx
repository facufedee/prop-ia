"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { agentesService } from "@/infrastructure/services/agentesService";
import { branchService } from "@/infrastructure/services/branchService";
import { invitationService } from "@/infrastructure/services/invitationService";
import { Agente } from "@/domain/models/Agente";
import { ArrowLeft, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";

export default function NuevoAgentePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);

    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        comisionVenta: "",
        comisionAlquiler: "",
        comisionPropiedadPropia: "",
        activo: true,
        branchId: "",
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        if (!auth?.currentUser) return;

        try {
            // Get Organization ID from User Profile
            const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            const userData = userDoc.data();
            const organizationId = userData?.organizationId || auth.currentUser.uid;

            // Fetch Config & Branches using Org ID
            const data = await agentesService.getConfiguracion(organizationId);
            const branchList = await branchService.getBranches(organizationId);

            if (data) {
                setConfig({ ...data, branches: branchList });
                setFormData(prev => ({
                    ...prev,
                    comisionVenta: data.comisionVentaDefault.toString(),
                    comisionAlquiler: data.comisionAlquilerDefault.toString(),
                    comisionPropiedadPropia: data.comisionPropiedadPropiaDefault.toString(),
                }));
            } else {
                // If no config, still show branches if any
                setConfig({ branches: branchList });

                // Defaults
                setFormData(prev => ({
                    ...prev,
                    comisionVenta: "3",
                    comisionAlquiler: "50",
                    comisionPropiedadPropia: "2",
                }));
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const [successData, setSuccessData] = useState<{ token: string, agentName: string } | null>(null);

    // ... (existing code)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser) return;

        try {
            setLoading(true);

            const agenteId = await agentesService.createAgente({
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                comisionVenta: parseFloat(formData.comisionVenta),
                comisionAlquiler: parseFloat(formData.comisionAlquiler),
                comisionPropiedadPropia: parseFloat(formData.comisionPropiedadPropia),
                totalVentas: 0,
                totalAlquileres: 0,
                totalVisitas: 0,
                totalComisiones: 0,
                propiedadesPropias: [],
                propiedadesAsignadas: [],
                activo: formData.activo,
                fechaIngreso: new Date(),
                userId: auth.currentUser.uid,
                branchId: formData.branchId || undefined,
                tipo: 'interno',
            });

            // Create Invitation
            const token = await invitationService.createInvitation(
                agenteId,
                formData.email,
                formData.branchId || "",
                auth.currentUser.uid
            );

            setSuccessData({ token, agentName: formData.nombre });

        } catch (error) {
            console.error("Error creating agente:", error);
            alert("Error al crear el agente");
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-[var(--color-paper-3)] p-4 rounded-full mb-6">
                    <CheckCircle strokeWidth={1.5} className="w-12 h-12 text-[var(--color-muted)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">¡Agente Creado Exitósamente!</h2>
                <p className="text-[var(--color-ink-2)] mb-8">
                    El agente <strong>{successData.agentName}</strong> ha sido registrado.
                    Comparte este enlace para que pueda configurar su acceso.
                </p>

                <div className="w-full bg-[var(--color-paper)] p-4 rounded-lg border border-[var(--color-rule)] flex items-center gap-3 mb-6">
                    <code className="flex-1 text-sm text-[var(--color-ink)] break-all">
                        {`${window.location.origin}/invitacion/${successData.token}`}
                    </code>
                    <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invitacion/${successData.token}`)}
                        className="p-2 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-lg transition-colors"
                        title="Copiar enlace"
                    >
                        <Copy strokeWidth={1.5} className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/dashboard/agentes"
                        className="px-6 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)]"
                    >
                        Volver a la lista
                    </Link>
                    <button
                        onClick={() => setSuccessData(null)}
                        className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)]"
                    >
                        Crear otro
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/agentes"
                    className="flex items-center gap-2 text-[var(--color-ink-2)] hover:text-[var(--color-ink)] mb-4"
                >
                    <ArrowLeft strokeWidth={1.5} className="w-5 h-5" />
                    Volver a agentes
                </Link>
                <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Nuevo Agente</h1>
                <p className="text-[var(--color-muted)]">Agregar un nuevo agente al equipo</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6 space-y-6">
                {/* Datos Personales */}
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.nombre}
                                onChange={(e) => handleChange("nombre", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.telefono}
                                onChange={(e) => handleChange("telefono", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Estado
                            </label>
                            <select
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                value={formData.activo ? "true" : "false"}
                                onChange={(e) => handleChange("activo", e.target.value === "true")}
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>

                        {/* Branch Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Sucursal Asignada
                            </label>
                            <select
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                value={formData.branchId}
                                onChange={(e) => handleChange("branchId", e.target.value)}
                            >
                                <option value="">-- Sin asignar (Central) --</option>
                                {config?.branches?.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-[var(--color-neutral)] mt-1">El agente solo verá datos de esta sucursal.</p>
                        </div>
                    </div>
                </div>

                {/* Comisiones */}
                <div className="border-t border-[var(--color-rule)] pt-6">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Configuración de Comisiones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Comisión Venta (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.comisionVenta}
                                onChange={(e) => handleChange("comisionVenta", e.target.value)}
                            />
                            <p className="text-xs text-[var(--color-muted)] mt-1">Ej: 3% = 3</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Comisión Alquiler (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.comisionAlquiler}
                                onChange={(e) => handleChange("comisionAlquiler", e.target.value)}
                            />
                            <p className="text-xs text-[var(--color-muted)] mt-1">Ej: 50% del primer mes</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Comisión Propiedad Propia (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                value={formData.comisionPropiedadPropia}
                                onChange={(e) => handleChange("comisionPropiedadPropia", e.target.value)}
                            />
                            <p className="text-xs text-[var(--color-muted)] mt-1">Extra si trae la propiedad</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-2">Ejemplo de Cálculo</h4>
                        <div className="text-sm text-[var(--color-accent)] space-y-1">
                            <p>• Venta de $100,000 (propiedad de la inmobiliaria):</p>
                            <p className="ml-4">Comisión = $100,000 × {formData.comisionVenta || 0}% = ${(100000 * parseFloat(formData.comisionVenta || "0") / 100).toLocaleString()}</p>

                            <p className="mt-2">• Venta de $100,000 (propiedad del agente):</p>
                            <p className="ml-4">Comisión Base = ${(100000 * parseFloat(formData.comisionVenta || "0") / 100).toLocaleString()}</p>
                            <p className="ml-4">Comisión Extra = ${(100000 * parseFloat(formData.comisionPropiedadPropia || "0") / 100).toLocaleString()}</p>
                            <p className="ml-4 font-semibold">Total = ${(100000 * (parseFloat(formData.comisionVenta || "0") + parseFloat(formData.comisionPropiedadPropia || "0")) / 100).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-rule)]">
                    <Link
                        href="/dashboard/agentes"
                        className="px-6 py-3 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creando..." : "Crear Agente"}
                    </button>
                </div>
            </form>
        </div>
    );
}
