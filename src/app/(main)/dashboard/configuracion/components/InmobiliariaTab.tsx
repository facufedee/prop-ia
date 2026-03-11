"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Check, Building2, Upload, X } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/infrastructure/firebase/client";
import { InmobiliariaProfile } from "@/domain/models/User";
import Image from "next/image";
import { toast } from "sonner";

const CONDICIONES_IVA = [
    "Responsable Inscripto",
    "Responsable Monotributo",
    "Exento",
    "No Responsable",
    "Consumidor Final",
];

export default function InmobiliariaTab() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<InmobiliariaProfile>({});
    const [logoUrl, setLogoUrl] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.uid || !db) return;
        getDoc(doc(db, "users", user.uid)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setProfile(data.inmobiliariaProfile ?? {});
                setLogoUrl(data.logoUrl ?? undefined);
            }
        });
    }, [user?.uid]);

    const handleChange = (field: keyof InmobiliariaProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.uid) return;
        setUploadingLogo(true);
        try {
            const storageRef = ref(storage, `logos/${user.uid}/logo_inmobiliaria`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setLogoUrl(url);
            await updateDoc(doc(db, "users", user.uid), { logoUrl: url });
            toast.success("Logo subido correctamente");
        } catch (err) {
            toast.error("Error al subir el logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        if (!user?.uid || !db) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                inmobiliariaProfile: profile,
            });
            setSaved(true);
            toast.success("Perfil guardado");
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            toast.error("Error al guardar el perfil");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            Datos de la Inmobiliaria
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Estos datos aparecerán en el encabezado de los recibos y comprobantes.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white hover:bg-black'} disabled:opacity-60`}
                    >
                        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Guardado' : 'Guardar'}
                    </button>
                </div>

                {/* Logo Upload */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Logo</label>
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                        >
                            {logoUrl ? (
                                <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" />
                            ) : (
                                <div className="text-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                                    <Upload className="w-6 h-6 mx-auto mb-1" />
                                    <span className="text-[10px] font-medium">Subir</span>
                                </div>
                            )}
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>PNG o JPG, preferiblemente con fondo transparente.</p>
                            <p>Se usará como encabezado y marca de agua en los recibos.</p>
                            {logoUrl && (
                                <button
                                    onClick={() => { setLogoUrl(undefined); updateDoc(doc(db, "users", user!.uid), { logoUrl: null }); }}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
                                >
                                    <X className="w-3 h-3" /> Quitar logo
                                </button>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                </div>

                {/* Fields */}
                <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Comercial</label>
                            <input
                                type="text"
                                value={profile.nombreComercial ?? ""}
                                onChange={e => handleChange("nombreComercial", e.target.value)}
                                placeholder="Ej: Inmobiliaria Müller"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">CUIT</label>
                            <input
                                type="text"
                                value={profile.cuit ?? ""}
                                onChange={e => handleChange("cuit", e.target.value)}
                                placeholder="20-37083028-3"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condición frente al IVA</label>
                        <select
                            value={profile.condicionIva ?? ""}
                            onChange={e => handleChange("condicionIva", e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="">Seleccionar...</option>
                            {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección</label>
                        <input
                            type="text"
                            value={profile.direccion ?? ""}
                            onChange={e => handleChange("direccion", e.target.value)}
                            placeholder="Av. San Martín 1543, Ituzaingó"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                        <input
                            type="tel"
                            value={profile.telefono ?? ""}
                            onChange={e => handleChange("telefono", e.target.value)}
                            placeholder="(0342) 154-56902"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Firma del Recibo</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del Firmante</label>
                                <input
                                    type="text"
                                    value={profile.firmante ?? ""}
                                    onChange={e => handleChange("firmante", e.target.value)}
                                    placeholder="Ej: Nahuel Müller"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cargo</label>
                                <input
                                    type="text"
                                    value={profile.cargoFirmante ?? ""}
                                    onChange={e => handleChange("cargoFirmante", e.target.value)}
                                    placeholder="Ej: Administrador / Martillero"
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                {(profile.nombreComercial || logoUrl) && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Vista previa del encabezado del recibo</p>
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-start gap-4">
                            {logoUrl && (
                                <div className="relative w-16 h-16 flex-shrink-0">
                                    <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-900 text-lg leading-tight">{profile.nombreComercial}</p>
                                {profile.cuit && <p className="text-xs text-gray-500">CUIT: {profile.cuit}</p>}
                                {profile.condicionIva && <p className="text-xs text-gray-500">{profile.condicionIva}</p>}
                                {profile.direccion && <p className="text-xs text-gray-500">{profile.direccion}</p>}
                                {profile.telefono && <p className="text-xs text-gray-500">Tel: {profile.telefono}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
