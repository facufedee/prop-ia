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
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] shadow-sm p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                            <Building2 strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)]" />
                            Datos de la Inmobiliaria
                        </h2>
                        <p className="text-sm text-[var(--color-muted)] mt-1">
                            Estos datos aparecerán en el encabezado de los recibos y comprobantes.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-all ${saved ? 'bg-[var(--color-positive)] text-[var(--color-paper)]' : 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)]'} disabled:opacity-60`}
                    >
                        {saved ? <Check strokeWidth={1.5} className="w-4 h-4" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
                        {saved ? 'Guardado' : 'Guardar'}
                    </button>
                </div>

                {/* Logo Upload */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-3">Logo</label>
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper)] flex items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                        >
                            {logoUrl ? (
                                <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" />
                            ) : (
                                <div className="text-center text-[var(--color-neutral)] group-hover:text-[var(--color-accent-2)] transition-colors">
                                    <Upload strokeWidth={1.5} className="w-6 h-6 mx-auto mb-1" />
                                    <span className="text-[10px] font-medium">Subir</span>
                                </div>
                            )}
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-[var(--color-paper-2)]/80 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-[var(--color-muted)] space-y-1">
                            <p>PNG o JPG, preferiblemente con fondo transparente.</p>
                            <p>Se usará como encabezado y marca de agua en los recibos.</p>
                            {logoUrl && (
                                <button
                                    onClick={() => { setLogoUrl(undefined); updateDoc(doc(db, "users", user!.uid), { logoUrl: null }); }}
                                    className="flex items-center gap-1 text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium"
                                >
                                    <X strokeWidth={1.5} className="w-3 h-3" /> Quitar logo
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
                            <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Nombre Comercial</label>
                            <input
                                type="text"
                                value={profile.nombreComercial ?? ""}
                                onChange={e => handleChange("nombreComercial", e.target.value)}
                                placeholder="Ej: Inmobiliaria Müller"
                                className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">CUIT</label>
                            <input
                                type="text"
                                value={profile.cuit ?? ""}
                                onChange={e => handleChange("cuit", e.target.value)}
                                placeholder="20-37083028-3"
                                className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Condición frente al IVA</label>
                        <select
                            value={profile.condicionIva ?? ""}
                            onChange={e => handleChange("condicionIva", e.target.value)}
                            className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none bg-[var(--color-paper-2)]"
                        >
                            <option value="">Seleccionar...</option>
                            {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Dirección</label>
                        <input
                            type="text"
                            value={profile.direccion ?? ""}
                            onChange={e => handleChange("direccion", e.target.value)}
                            placeholder="Av. San Martín 1543, Ituzaingó"
                            className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Teléfono</label>
                        <input
                            type="tel"
                            value={profile.telefono ?? ""}
                            onChange={e => handleChange("telefono", e.target.value)}
                            placeholder="(0342) 154-56902"
                            className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-[var(--color-rule-2)]">
                        <h3 className="text-sm font-bold text-[var(--color-ink-2)] mb-4">Firma del Recibo</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Nombre del Firmante</label>
                                <input
                                    type="text"
                                    value={profile.firmante ?? ""}
                                    onChange={e => handleChange("firmante", e.target.value)}
                                    placeholder="Ej: Nahuel Müller"
                                    className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Cargo</label>
                                <input
                                    type="text"
                                    value={profile.cargoFirmante ?? ""}
                                    onChange={e => handleChange("cargoFirmante", e.target.value)}
                                    placeholder="Ej: Administrador / Martillero"
                                    className="w-full px-3 py-2.5 border border-[var(--color-rule)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                {(profile.nombreComercial || logoUrl) && (
                    <div className="mt-8 pt-6 border-t border-[var(--color-rule-2)]">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-neutral)] mb-3">Vista previa del encabezado del recibo</p>
                        <div className="border border-[var(--color-rule)] rounded-xl p-4 bg-[var(--color-paper)] flex items-start gap-4">
                            {logoUrl && (
                                <div className="relative w-16 h-16 flex-shrink-0">
                                    <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-[var(--color-ink)] text-lg leading-tight">{profile.nombreComercial}</p>
                                {profile.cuit && <p className="text-xs text-[var(--color-muted)]">CUIT: {profile.cuit}</p>}
                                {profile.condicionIva && <p className="text-xs text-[var(--color-muted)]">{profile.condicionIva}</p>}
                                {profile.direccion && <p className="text-xs text-[var(--color-muted)]">{profile.direccion}</p>}
                                {profile.telefono && <p className="text-xs text-[var(--color-muted)]">Tel: {profile.telefono}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
