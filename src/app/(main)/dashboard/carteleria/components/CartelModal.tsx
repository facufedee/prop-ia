"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Camera } from "lucide-react";
import { carteleriaService } from "@/infrastructure/services/carteleriaService";
import {
    Cartel,
    CartelEstado,
    CartelTipo,
    CartelMaterial,
    CartelMedida,
    CARTEL_ESTADO_LABELS,
    CARTEL_TIPO_LABELS,
    CARTEL_MATERIAL_LABELS,
    CARTEL_MEDIDA_LABELS,
} from "@/domain/models/Cartel";
import CartelPropertySelector from "./CartelPropertySelector";
import { useBranchContext } from "@/infrastructure/context/BranchContext";

interface CartelModalProps {
    userId: string;
    editingCartel: Cartel | null;
    onClose: () => void;
    onSaved: () => void;
}

const ESTADOS_INICIALES: CartelEstado[] = ["almacen", "instalado", "reparacion"];

export default function CartelModal({ userId, editingCartel, onClose, onSaved }: CartelModalProps) {
    const { branches, selectedBranchId } = useBranchContext();
    const [saving, setSaving] = useState(false);
    const [suggestedCodigo, setSuggestedCodigo] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const [form, setForm] = useState({
        codigo: "",
        tipo: "venta" as CartelTipo,
        material: "plastico_corrugado" as CartelMaterial,
        materialPersonalizado: "",
        medida: "50x70" as CartelMedida,
        medidaPersonalizada: "",
        estado: "almacen" as CartelEstado,
        propiedadId: "",
        propiedadDireccion: "",
        ubicacionAlmacen: "",
        branchId: selectedBranchId !== "all" ? selectedBranchId : "",
        costoAdquisicion: "",
        proveedor: "",
        costoInstalacion: "",
        notas: "",
    });

    useEffect(() => {
        if (editingCartel) {
            setForm({
                codigo: editingCartel.codigo,
                tipo: editingCartel.tipo,
                material: editingCartel.material,
                materialPersonalizado: editingCartel.materialPersonalizado || "",
                medida: editingCartel.medida,
                medidaPersonalizada: editingCartel.medidaPersonalizada || "",
                estado: editingCartel.estado,
                propiedadId: editingCartel.propiedadId || "",
                propiedadDireccion: editingCartel.propiedadDireccion || "",
                ubicacionAlmacen: editingCartel.ubicacionAlmacen || "",
                branchId: editingCartel.branchId || "",
                costoAdquisicion: editingCartel.costoAdquisicion?.toString() || "",
                proveedor: editingCartel.proveedor || "",
                costoInstalacion: editingCartel.costoInstalacion?.toString() || "",
                notas: editingCartel.notas || "",
            });
            if (editingCartel.fotos?.[0]) setPhotoPreview(editingCartel.fotos[0]);
        } else {
            carteleriaService.getNextCodigo(userId).then((codigo) => {
                setSuggestedCodigo(codigo);
                setForm((f) => ({ ...f, codigo }));
            });
        }
    }, [editingCartel, userId]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        setSaving(true);

        try {
            const codigo = form.codigo.trim() || suggestedCodigo;

            // Guard against two signs sharing the same internal label — it's
            // the code used to physically tag the sign, it must be unique.
            if (!editingCartel || codigo.toLowerCase() !== editingCartel.codigo.toLowerCase()) {
                const existing = await carteleriaService.getCarteles(userId);
                const collision = existing.find(
                    (c) => c.codigo.toLowerCase() === codigo.toLowerCase() && c.id !== editingCartel?.id
                );
                if (collision) {
                    alert(`Ya existe un cartel con el código "${codigo}". Elegí otro.`);
                    setSaving(false);
                    return;
                }
            }

            // Fields NOT tied to the location/estado — those go through
            // cambiarEstado() below so the change lands in the audit history.
            const baseData = {
                userId,
                branchId: form.branchId || null,
                codigo,
                tipo: form.tipo,
                material: form.material,
                materialPersonalizado: form.material === "otro" ? form.materialPersonalizado : undefined,
                medida: form.medida,
                medidaPersonalizada: form.medida === "personalizada" ? form.medidaPersonalizada : undefined,
                costoAdquisicion: form.costoAdquisicion ? Number(form.costoAdquisicion) : undefined,
                proveedor: form.proveedor || undefined,
                costoInstalacion: form.costoInstalacion ? Number(form.costoInstalacion) : undefined,
                notas: form.notas || undefined,
            };

            let cartelId = editingCartel?.id;

            if (editingCartel) {
                await carteleriaService.updateCartel(editingCartel.id, baseData);

                const locationChanged =
                    form.estado !== editingCartel.estado ||
                    (form.estado === "instalado" && form.propiedadId !== (editingCartel.propiedadId || "")) ||
                    (form.estado === "almacen" && form.ubicacionAlmacen !== (editingCartel.ubicacionAlmacen || ""));

                if (locationChanged) {
                    await carteleriaService.cambiarEstado(editingCartel.id, form.estado, {
                        propiedadId: form.estado === "instalado" ? form.propiedadId || null : null,
                        propiedadDireccion: form.estado === "instalado" ? form.propiedadDireccion || null : null,
                        ubicacionAlmacen: form.estado === "almacen" ? form.ubicacionAlmacen || null : null,
                        nota: "Editado desde el formulario",
                    });
                }
            } else {
                cartelId = await carteleriaService.createCartel({
                    ...baseData,
                    estado: form.estado,
                    propiedadId: form.estado === "instalado" ? form.propiedadId || null : null,
                    propiedadDireccion: form.estado === "instalado" ? form.propiedadDireccion || null : null,
                    ubicacionAlmacen: form.estado === "almacen" ? form.ubicacionAlmacen || undefined : undefined,
                    fotos: [],
                    fechaAdquisicion: null,
                    fechaInstalacion: null,
                } as any);
            }

            if (photoFile && cartelId) {
                const url = await carteleriaService.uploadFoto(photoFile, cartelId);
                // Prepend — the photo shown in this form's preview slot becomes
                // the cover photo (fotos[0]) used everywhere else (list card,
                // detail header), matching what the user just saw and picked.
                const fotos = [url, ...(editingCartel?.fotos || [])];
                await carteleriaService.updateCartel(cartelId, { fotos });
            }

            onSaved();
        } catch (error) {
            console.error("Error saving cartel:", error);
            alert("Error al guardar el cartel");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        {editingCartel ? `Editar ${editingCartel.codigo}` : "Nuevo Cartel"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Photo */}
                    <div className="flex items-center gap-4">
                        <label className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 overflow-hidden bg-gray-50 flex-shrink-0">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-6 h-6 text-gray-400" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </label>
                        <p className="text-xs text-gray-500">Foto del cartel o de dónde está ubicado (opcional)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código interno</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.codigo}
                                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                            />
                        </div>
                        {branches.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.branchId}
                                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                >
                                    <option value="">Sin asignar</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value as CartelTipo })}
                            >
                                {Object.entries(CARTEL_TIPO_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value as CartelEstado })}
                            >
                                {(editingCartel ? Object.keys(CARTEL_ESTADO_LABELS) as CartelEstado[] : ESTADOS_INICIALES).map((value) => (
                                    <option key={value} value={value}>{CARTEL_ESTADO_LABELS[value]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.material}
                                onChange={(e) => setForm({ ...form, material: e.target.value as CartelMaterial })}
                            >
                                {Object.entries(CARTEL_MATERIAL_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            {form.material === "otro" && (
                                <input
                                    type="text"
                                    placeholder="Especificar material"
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.materialPersonalizado}
                                    onChange={(e) => setForm({ ...form, materialPersonalizado: e.target.value })}
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medida</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.medida}
                                onChange={(e) => setForm({ ...form, medida: e.target.value as CartelMedida })}
                            >
                                {Object.entries(CARTEL_MEDIDA_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            {form.medida === "personalizada" && (
                                <input
                                    type="text"
                                    placeholder="Ej: 60x90 cm"
                                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.medidaPersonalizada}
                                    onChange={(e) => setForm({ ...form, medidaPersonalizada: e.target.value })}
                                />
                            )}
                        </div>
                    </div>

                    {form.estado === "instalado" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad asociada</label>
                            <CartelPropertySelector
                                userId={userId}
                                value={form.propiedadId}
                                onSelect={(id, direccion) => setForm({ ...form, propiedadId: id, propiedadDireccion: direccion })}
                            />
                        </div>
                    )}

                    {form.estado === "almacen" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en el almacén</label>
                            <input
                                type="text"
                                placeholder="Ej: Depósito Oeste, estante 3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                value={form.ubicacionAlmacen}
                                onChange={(e) => setForm({ ...form, ubicacionAlmacen: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inversión (opcional)</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo adquisición</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="$"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.costoAdquisicion}
                                    onChange={(e) => setForm({ ...form, costoAdquisicion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo instalación</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="$"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.costoInstalacion}
                                    onChange={(e) => setForm({ ...form, costoInstalacion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Imprenta Lugones"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                                    value={form.proveedor}
                                    onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                            value={form.notas}
                            onChange={(e) => setForm({ ...form, notas: e.target.value })}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm shadow-indigo-200 disabled:opacity-60 flex items-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingCartel ? "Guardar Cambios" : "Crear Cartel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
