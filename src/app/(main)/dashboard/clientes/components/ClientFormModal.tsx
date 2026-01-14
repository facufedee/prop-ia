import { useState, useEffect } from "react";
import { X, Users, Building2, UserPlus, Save, Loader2, CreditCard, Shield, User } from "lucide-react";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { auth } from "@/infrastructure/firebase/client";
import LimitReachedModal from "@/ui/components/modals/LimitReachedModal";
import { Inquilino } from "@/domain/models/Inquilino";
import { Propietario } from "@/domain/models/Propietario";
import { Lead } from "@/domain/models/Lead";

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (type: 'inquilinos' | 'propietarios' | 'leads', id?: string) => void;
    initialType?: 'inquilinos' | 'propietarios' | 'leads';
    initialData?: Inquilino | Propietario | Lead | null;
}

type ClientType = 'inquilinos' | 'propietarios' | 'leads';

export default function ClientFormModal({ isOpen, onClose, onSuccess, initialType = 'inquilinos', initialData }: ClientFormModalProps) {
    const [clientType, setClientType] = useState<ClientType>(initialType);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Helpers
    const handleNameChange = (val: string) => {
        // Allow letters, spaces, accents. No numbers or special chars (mostly).
        const filtered = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        setNombre(filtered);
    };

    const handlePhoneChange = (val: string) => {
        // Only numbers
        const filtered = val.replace(/[^0-9]/g, "");
        setTelefono(filtered);
    };

    const handleDniChange = (val: string) => {
        const filtered = val.replace(/[^0-9]/g, "");
        setDni(filtered);
    };

    // Limit modal state
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [currentLimit, setCurrentLimit] = useState<number | string>(5);

    // Form States
    // Common
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [dni, setDni] = useState("");
    const [cuit, setCuit] = useState("");
    const [domicilio, setDomicilio] = useState("");

    // Lead Specific
    const [leadData, setLeadData] = useState({
        mensaje: "",
        origen: "manual",
        estado: "nuevo"
    });

    // Load initial data for editing
    useEffect(() => {
        if (initialData) {
            setIsEditing(true);
            setClientType(initialType);

            // Common mapping
            setNombre(initialData.nombre || "");
            setEmail(initialData.email || "");
            setTelefono(initialData.telefono || "");

            if ('dni' in initialData) setDni(initialData.dni || "");
            // Some models might not have these fields typed yet or optionally
            if ('cuit' in initialData) setCuit((initialData as any).cuit || "");
            if ('domicilio' in initialData) setDomicilio((initialData as any).domicilio || "");

            // Specific mappings
            if (initialType === 'inquilinos') {
                const inq = initialData as Inquilino;
                if (inq.datosGarante) {
                    // Legacy or unused in UI
                }
            } else if (initialType === 'propietarios') {
                const prop = initialData as Propietario;
                if (prop.cuentaBancaria) {
                    // Legacy or unused in UI
                }
            } else if (initialType === 'leads') {
                const lead = initialData as Lead;
                setLeadData({
                    mensaje: lead.mensaje || "",
                    origen: lead.origen || "manual",
                    estado: lead.estado || "nuevo"
                });
            }

        } else {
            setIsEditing(false);
            setClientType(initialType);
            resetForm();
        }
    }, [initialData, initialType, isOpen]);

    const resetForm = () => {
        setNombre("");
        setEmail("");
        setTelefono("");
        setDni("");
        setCuit("");
        setDomicilio("");
        setDni("");
        setCuit("");
        setDomicilio("");
        setLeadData({ mensaje: "", origen: "manual", estado: "nuevo" });
    };

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
            // Validations
            if (telefono && telefono.length > 20) {
                setError("El teléfono es muy largo.");
                setLoading(false);
                return;
            }
            if (dni && dni.length > 15) {
                setError("El DNI es demasiado largo.");
                setLoading(false);
                return;
            }
            if (cuit && cuit.length > 15) {
                setError("El CUIT es demasiado largo.");
                setLoading(false);
                return;
            }

            // Check limits only if creating new (not editing)
            if (!isEditing && clientType !== 'leads') {
                const limitCheck = await subscriptionService.checkUsageLimit(uid, 'clients');
                if (!limitCheck.allowed) {
                    setCurrentLimit(limitCheck.limit);
                    setShowLimitModal(true);
                    setLoading(false);
                    return;
                }
            }

            let resultId = initialData?.id;

            if (clientType === 'inquilinos') {
                const data = {
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    dni,
                    cuit,
                    domicilio,
                    // datosGarante: undefined, // Removed from UI
                    documentos: (initialData as Inquilino)?.documentos || [],
                };

                if (isEditing && initialData) {
                    await inquilinosService.updateInquilino(initialData.id, data);
                } else {
                    resultId = await inquilinosService.createInquilino(data as any);
                }

            } else if (clientType === 'propietarios') {
                const data = {
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    dni,
                    cuit,
                    domicilio,
                    // cuentaBancaria: undefined, // Removed from UI
                    // Preserve existing relations
                    propiedades: (initialData as Propietario)?.propiedades || [],
                    comision: (initialData as Propietario)?.comision || 0,
                    documentos: (initialData as Propietario)?.documentos || []
                };

                if (isEditing && initialData) {
                    await propietariosService.updatePropietario(initialData.id, data);
                } else {
                    resultId = await propietariosService.createPropietario(data as any);
                }

            } else if (clientType === 'leads') {
                const data = {
                    userId: uid,
                    nombre,
                    email,
                    telefono,
                    ...leadData,
                    notas: (initialData as Lead)?.notas || [],
                };

                if (isEditing && initialData) {
                    await leadsService.updateLead(initialData.id, data as any);
                } else {
                    // Leads service requires specific fields
                    resultId = await leadsService.createLead({
                        ...data,
                        tipo: (initialData as Lead)?.tipo || 'consulta'
                    } as any);
                }
            }

            // Pass back the ID and the type
            // @ts-ignore - onSuccess signature might need update or we cast
            onSuccess(clientType, resultId);
            onClose();
        } catch (err: any) {
            console.error("Error saving client:", err);
            setError(err.message || "Error al guardar el cliente");
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

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Editar' : 'Nuevo'} {
                                clientType === 'inquilinos' ? 'Inquilino' :
                                    clientType === 'propietarios' ? 'Propietario' : 'Lead'
                            }
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Type Selector (Only if NOT editing) */}
                    {!isEditing && (
                        <div className="p-2 grid grid-cols-3 gap-1 bg-gray-50 m-6 mb-0 rounded-xl border border-gray-100 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setClientType('inquilinos')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'inquilinos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Users className="w-5 h-5" /> Inquilino
                            </button>
                            <button
                                type="button"
                                onClick={() => setClientType('propietarios')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'propietarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Building2 className="w-5 h-5" /> Propietario
                            </button>
                            <button
                                type="button"
                                onClick={() => setClientType('leads')}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all ${clientType === 'leads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <UserPlus className="w-5 h-5" /> Lead
                            </button>
                        </div>
                    )}

                    {/* Form Content - Scrollable */}
                    <div className="overflow-y-auto p-6 flex-1">
                        <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <X className="w-4 h-4" /> {error}
                                </div>
                            )}

                            {/* --- Sección: Datos Personales --- */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                                    <User className="w-4 h-4" /> Datos Personales
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input type="text" required value={nombre} onChange={(e) => handleNameChange(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Ej: Facundo Flores" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="facundo@zetaprop.com.ar" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Solo números)</label>
                                        <input type="tel" required value={telefono} onChange={(e) => handlePhoneChange(e.target.value)} maxLength={20} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="1112345678" />
                                    </div>

                                    {clientType !== 'leads' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI (Solo números)</label>
                                                <input type="text" value={dni} onChange={(e) => handleDniChange(e.target.value)} maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="12345678" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">CUIT / CUIL</label>
                                                <input type="text" value={cuit} onChange={(e) => setCuit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="20-12345678-9" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Domicilio Real / Legal</label>
                                                <input type="text" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" placeholder="Dr Monte 800 - Moron" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>



                            {/* --- Sección: Lead Details --- */}
                            {clientType === 'leads' && (
                                <section className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                            <select value={leadData.estado} onChange={(e) => setLeadData(prev => ({ ...prev, estado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900">
                                                <option value="nuevo">Nuevo</option>
                                                <option value="contactado">Contactado</option>
                                                <option value="interesado">Interesado</option>
                                                <option value="reservado">Reservado</option>
                                                <option value="convertido">Convertido (Cliente)</option>
                                                <option value="perdido">Perdido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                                            <input type="text" value={leadData.origen} onChange={(e) => setLeadData(prev => ({ ...prev, origen: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje / Consulta</label>
                                            <textarea rows={3} value={leadData.mensaje} onChange={(e) => setLeadData(prev => ({ ...prev, mensaje: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" />
                                        </div>
                                    </div>
                                </section>
                            )}

                        </form>
                    </div>

                    {/* Footer - Actions */}
                    <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
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
                            form="client-form"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 shadow-sm shadow-indigo-200"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
