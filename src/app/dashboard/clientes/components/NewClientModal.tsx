import { useState } from "react";
import { X, Users, Building2, UserPlus, Save, Loader2 } from "lucide-react";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { auth } from "@/infrastructure/firebase/client";
import LimitReachedModal from "@/ui/components/modals/LimitReachedModal";

interface NewClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (type: 'inquilinos' | 'propietarios' | 'leads') => void;
    initialType?: 'inquilinos' | 'propietarios' | 'leads';
}

type ClientType = 'inquilinos' | 'propietarios' | 'leads';

export default function NewClientModal({ isOpen, onClose, onSuccess, initialType = 'inquilinos' }: NewClientModalProps) {
    const [clientType, setClientType] = useState<ClientType>(initialType);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Limit modal state
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [currentLimit, setCurrentLimit] = useState<number | string>(5);

    // Common fields
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [dni, setDni] = useState(""); // Only for Inquilino/Propietario
    const [direccion, setDireccion] = useState(""); // Only for Propietario/Inquilino sometimes

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!auth?.currentUser) {
            setError("No hay sesión activa");
            return;
        }

        const uid = auth.currentUser.uid;
        setLoading(true);

        try {
            // Check limits first (only for Inquilinos and Propietarios, assuming Leads might be different or same)
            // Assuming 'clients' limit covers Inquilinos and Propietarios. Leads usually have different limits or none.
            // User said "5 propiedades y 5 clientes". Leads are usually distinct.
            // Let's assume Inquilinos + Propietarios = Clients. Leads might be exempt or have own limit.
            // For now, applying to all types to be safe as "New Client"

            if (clientType !== 'leads') { // Leads might trigger too, but usually "Leads" are pre-clients.
                const limitCheck = await subscriptionService.checkUsageLimit(uid, 'clients');
                if (!limitCheck.allowed) {
                    setCurrentLimit(limitCheck.limit);
                    setShowLimitModal(true);
                    setLoading(false);
                    return;
                }
            } else {
                // If Leads should also count, remove the if check.
                // "ambas es hasta 5" refering to Properties and Clients (Inquilinos/Propietarios).
                // Leads are potential clients. Often treated differently. I'll stick to Inquilinos/Propietarios for now unless specified.
            }

            if (clientType === 'inquilinos') {
                await inquilinosService.createInquilino({
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    dni,
                    domicilio: "", // Default empty as it's required
                    datosGarante: { nombre: '', telefono: '', email: '', dni: '' }, // Required structure
                    documentos: [],
                });
            } else if (clientType === 'propietarios') {
                await propietariosService.createPropietario({
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    dni,
                    domicilio: direccion, // Mapped to domicilio
                    propiedades: [],
                    comision: 0,
                    documentos: []
                });
            } else if (clientType === 'leads') {
                await leadsService.createLead({
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    estado: 'nuevo',
                    origen: 'web',
                    tipo: 'consulta',
                    mensaje: 'Creado manualmente desde dashboard',
                    notas: [],
                });
            }

            onSuccess(clientType);
            onClose();
            // Reset form
            setNombre("");
            setEmail("");
            setTelefono("");
            setDni("");
            setDireccion("");
        } catch (err: any) {
            console.error("Error creating client:", err);
            setError(err.message || "Error al crear el cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <LimitReachedModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                resource="clientes"
                limit={currentLimit}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Type Selection */}
                    <div className="p-2 grid grid-cols-3 gap-1 bg-gray-50 m-6 rounded-xl border border-gray-100">
                        <button
                            onClick={() => setClientType('inquilinos')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'inquilinos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            Inquilino
                        </button>
                        <button
                            onClick={() => setClientType('propietarios')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'propietarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Building2 className="w-5 h-5" />
                            Propietario
                        </button>
                        <button
                            onClick={() => setClientType('leads')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'leads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <UserPlus className="w-5 h-5" />
                            Lead
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <X className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="juan@ejemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        required
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                            </div>

                            {/* Fields specific to Inquilino/Propietario */}
                            {clientType !== 'leads' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI / Identificación</label>
                                    <input
                                        type="text"
                                        required
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="12.345.678"
                                    />
                                </div>
                            )}

                            {/* Fields specific to Propietario */}
                            {clientType === 'propietarios' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="Av. Principal 123"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 shadow-sm shadow-indigo-200"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Guardar Cliente
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
