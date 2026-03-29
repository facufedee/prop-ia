"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Globe, Palette, Building2, CheckCircle2, AlertCircle, Loader2,
    Eye, EyeOff, ExternalLink, Copy, Check, Sparkles, Smartphone,
    Instagram, Facebook, Phone, Mail, MapPin, Save, Upload, X, ImageIcon,
} from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { storage } from "@/infrastructure/firebase/client";
import { siteService } from "@/infrastructure/services/siteService";
import { Site, SiteTemplate, DEFAULT_SITE } from "@/domain/models/Site";
import { toast } from "sonner";

// ── Template options ──────────────────────────────────────────────────────────

const TEMPLATES: { id: SiteTemplate; label: string; desc: string; preview: string }[] = [
    {
        id: "moderno",
        label: "Moderno",
        desc: "Diseño limpio con colores vibrantes y tarjetas flotantes.",
        preview: "bg-gradient-to-br from-indigo-500 to-purple-600",
    },
    {
        id: "clasico",
        label: "Clásico",
        desc: "Estilo profesional y sobrio, ideal para inmobiliarias consolidadas.",
        preview: "bg-gradient-to-br from-slate-700 to-slate-900",
    },
    {
        id: "minimalista",
        label: "Minimalista",
        desc: "Negro y blanco. Máxima claridad, sin distracciones.",
        preview: "bg-gradient-to-br from-gray-900 to-black",
    },
];

const PRESET_COLORS = [
    "#4f46e5", "#7c3aed", "#0ea5e9", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#1e293b",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type FormData = Omit<Site, "id" | "userId" | "createdAt" | "updatedAt">;
type Tab = "plantilla" | "identidad" | "colores" | "contacto";

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "plantilla", label: "Plantilla", icon: Sparkles },
    { id: "identidad", label: "Identidad", icon: Building2 },
    { id: "colores", label: "Colores", icon: Palette },
    { id: "contacto", label: "Contacto", icon: Phone },
];

// ── Image upload helper ───────────────────────────────────────────────────────

async function uploadSiteImage(userId: string, type: "logo" | "cover", file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const storageRef = ref(storage, `sites/${userId}/${type}.${ext}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MiSitioPage() {
    const { user } = useAuth();

    const [site, setSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("plantilla");
    const [copied, setCopied] = useState(false);
    const [slugError, setSlugError] = useState("");
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormData>({ ...DEFAULT_SITE });

    // ── Load existing site ──────────────────────────────────────────────────

    useEffect(() => {
        if (!user?.uid) return;
        siteService.getSiteByUserId(user.uid).then((s) => {
            if (s) {
                setSite(s);
                setForm({
                    slug: s.slug,
                    template: s.template,
                    nombre: s.nombre,
                    descripcion: s.descripcion,
                    logoUrl: s.logoUrl,
                    coverUrl: s.coverUrl,
                    colorPrimario: s.colorPrimario,
                    colorSecundario: s.colorSecundario,
                    whatsapp: s.whatsapp ?? "",
                    email: s.email ?? "",
                    instagram: s.instagram ?? "",
                    facebook: s.facebook ?? "",
                    direccion: s.direccion ?? "",
                    published: s.published,
                });
            }
            setLoading(false);
        });
    }, [user?.uid]);

    // ── Slug validation ─────────────────────────────────────────────────────

    const validateSlug = useCallback(
        async (slug: string) => {
            if (!slug) { setSlugError("El subdominio es requerido"); return false; }
            if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
                setSlugError("Solo letras minúsculas, números y guiones (3-30 caracteres)");
                return false;
            }
            setCheckingSlug(true);
            const available = await siteService.isSlugAvailable(slug, site?.id);
            setCheckingSlug(false);
            if (!available) { setSlugError("Este subdominio ya está en uso"); return false; }
            setSlugError("");
            return true;
        },
        [site?.id]
    );

    // ── Image uploads ───────────────────────────────────────────────────────

    const handleLogoUpload = async (file: File) => {
        if (!user?.uid) return;
        setUploadingLogo(true);
        try {
            const url = await uploadSiteImage(user.uid, "logo", file);
            set("logoUrl", url);
            toast.success("Logo subido");
        } catch {
            toast.error("Error al subir el logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCoverUpload = async (file: File) => {
        if (!user?.uid) return;
        setUploadingCover(true);
        try {
            const url = await uploadSiteImage(user.uid, "cover", file);
            set("coverUrl", url);
            toast.success("Imagen de portada subida");
        } catch {
            toast.error("Error al subir la imagen");
        } finally {
            setUploadingCover(false);
        }
    };

    // ── Save ────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!user?.uid) return;
        const slugOk = await validateSlug(form.slug);
        if (!slugOk) { setActiveTab("identidad"); return; }

        setSaving(true);
        try {
            if (site) {
                await siteService.updateSite(site.id, form);
                setSite((prev) => prev ? { ...prev, ...form } : prev);
                toast.success("Cambios guardados");
            } else {
                await siteService.createSite({ ...form, userId: user.uid });
                const newSite = await siteService.getSiteByUserId(user.uid);
                setSite(newSite);
                toast.success("¡Sitio creado!");
            }
        } catch {
            toast.error("Error al guardar. Intentá de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    // ── Publish toggle ──────────────────────────────────────────────────────

    const handlePublish = async () => {
        if (!site) { toast.error("Guardá el sitio primero."); return; }
        setPublishing(true);
        try {
            await siteService.publishSite(site.id, !site.published);
            setSite((prev) => prev ? { ...prev, published: !prev.published } : prev);
            setForm((prev) => ({ ...prev, published: !prev.published }));
            toast.success(site.published ? "Sitio despublicado" : "¡Sitio publicado!");
        } catch {
            toast.error("Error al cambiar el estado.");
        } finally {
            setPublishing(false);
        }
    };

    // ── Copy URL ────────────────────────────────────────────────────────────

    const siteUrl = site?.slug ? `https://${site.slug}.zetaprop.com.ar` : null;

    const copyUrl = () => {
        if (!siteUrl) return;
        navigator.clipboard.writeText(siteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Helpers ─────────────────────────────────────────────────────────────

    const set = (field: keyof FormData, value: any) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe className="w-6 h-6 text-indigo-500" /> Mi Sitio Web
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Creá tu portal inmobiliario público con tus propiedades y tu identidad.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {site && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                site.published
                                    ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                        >
                            {publishing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : site.published ? (
                                <><Eye className="w-4 h-4" /> Publicado</>
                            ) : (
                                <><EyeOff className="w-4 h-4" /> Despublicado</>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {site ? "Guardar cambios" : "Crear sitio"}
                    </button>
                </div>
            </div>

            {/* ── Site URL banner ── */}
            {site?.published && siteUrl && (
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400 flex-1 font-medium">{siteUrl}</span>
                    <button onClick={copyUrl} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-600">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-600">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            )}

            {/* ── Main grid: tabs + preview ── */}
            <div className="grid lg:grid-cols-5 gap-6">

                {/* Left: editor (3/5) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">

                        {/* ── PLANTILLA ── */}
                        {activeTab === "plantilla" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Elegí tu plantilla</h3>
                                <div className="grid gap-3">
                                    {TEMPLATES.map((tpl) => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => set("template", tpl.id)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                                                form.template === tpl.id
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                                            }`}
                                        >
                                            <div className={`w-14 h-14 rounded-xl ${tpl.preview} flex-shrink-0`} />
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{tpl.label}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tpl.desc}</p>
                                            </div>
                                            {form.template === tpl.id && (
                                                <CheckCircle2 className="w-5 h-5 text-indigo-500 ml-auto flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── IDENTIDAD ── */}
                        {activeTab === "identidad" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Identidad</h3>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Subdominio *
                                    </label>
                                    <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <span className="px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">
                                            https://
                                        </span>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => {
                                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                                set("slug", val);
                                                setSlugError("");
                                            }}
                                            onBlur={() => form.slug && validateSlug(form.slug)}
                                            placeholder="mi-inmobiliaria"
                                            className="flex-1 px-3 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                                        />
                                        <span className="px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-sm border-l border-gray-300 dark:border-gray-600 whitespace-nowrap">
                                            .zetaprop.com.ar
                                        </span>
                                    </div>
                                    {checkingSlug && (
                                        <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando disponibilidad...
                                        </p>
                                    )}
                                    {slugError && (
                                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> {slugError}
                                        </p>
                                    )}
                                    {!slugError && !checkingSlug && form.slug.length >= 3 && (
                                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Disponible
                                        </p>
                                    )}
                                </div>

                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Nombre de la inmobiliaria *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.nombre}
                                        onChange={(e) => set("nombre", e.target.value)}
                                        placeholder="Rodríguez Propiedades"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Descripción / slogan
                                    </label>
                                    <textarea
                                        value={form.descripcion}
                                        onChange={(e) => set("descripcion", e.target.value)}
                                        placeholder="Tu inmobiliaria de confianza en Palermo y Belgrano..."
                                        rows={3}
                                        maxLength={200}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1 text-right">{form.descripcion?.length ?? 0}/200</p>
                                </div>

                                {/* Logo upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Logo
                                    </label>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleLogoUpload(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    {form.logoUrl ? (
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 inline-flex">
                                                <Image src={form.logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={uploadingLogo}
                                                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                                >
                                                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Cambiar logo
                                                </button>
                                                <button
                                                    onClick={() => set("logoUrl", "")}
                                                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
                                                >
                                                    <X className="w-3 h-3" /> Quitar logo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                            className="flex items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm"
                                        >
                                            {uploadingLogo ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                                            ) : (
                                                <><Upload className="w-4 h-4" /> Subir logo</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Cover upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Imagen de portada <span className="text-gray-400 font-normal">(hero)</span>
                                    </label>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleCoverUpload(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    {form.coverUrl ? (
                                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <Image src={form.coverUrl} alt="Cover" width={600} height={200} className="w-full h-32 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => coverInputRef.current?.click()}
                                                    disabled={uploadingCover}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 text-xs font-semibold rounded-lg"
                                                >
                                                    {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Cambiar
                                                </button>
                                                <button
                                                    onClick={() => set("coverUrl", undefined)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg"
                                                >
                                                    <X className="w-3 h-3" /> Quitar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => coverInputRef.current?.click()}
                                            disabled={uploadingCover}
                                            className="flex flex-col items-center justify-center gap-2 w-full py-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm"
                                        >
                                            {uploadingCover ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> <span>Subiendo...</span></>
                                            ) : (
                                                <><ImageIcon className="w-5 h-5" /> <span>Subir imagen de portada</span><span className="text-xs text-gray-400">Recomendado: 1920×600px</span></>
                                            )}
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Si no subís una imagen, se usa el degradado de colores como fondo.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── COLORES ── */}
                        {activeTab === "colores" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Colores</h3>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    {/* Primary */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Color primario
                                        </label>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: form.colorPrimario }} />
                                            <input type="color" value={form.colorPrimario} onChange={(e) => set("colorPrimario", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_COLORS.map((c) => (
                                                <button key={c} onClick={() => set("colorPrimario", c)}
                                                    className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                                                    style={{ backgroundColor: c, borderColor: form.colorPrimario === c ? "white" : "transparent", boxShadow: form.colorPrimario === c ? `0 0 0 2px ${c}` : undefined }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Secondary */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Color secundario
                                        </label>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: form.colorSecundario }} />
                                            <input type="color" value={form.colorSecundario} onChange={(e) => set("colorSecundario", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_COLORS.map((c) => (
                                                <button key={c} onClick={() => set("colorSecundario", c)}
                                                    className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                                                    style={{ backgroundColor: c, borderColor: form.colorSecundario === c ? "white" : "transparent", boxShadow: form.colorSecundario === c ? `0 0 0 2px ${c}` : undefined }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Gradient preview */}
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa del hero</p>
                                    <div
                                        className="h-20 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
                                        style={{ background: `linear-gradient(135deg, ${form.colorPrimario}, ${form.colorSecundario})` }}
                                    >
                                        {form.nombre || "Mi Inmobiliaria"}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── CONTACTO ── */}
                        {activeTab === "contacto" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Información de contacto</h3>

                                {[
                                    { field: "whatsapp", label: "WhatsApp", placeholder: "+54 9 11 1234-5678", icon: Phone },
                                    { field: "email", label: "Email", placeholder: "info@miinmobiliaria.com", icon: Mail },
                                    { field: "instagram", label: "Instagram", placeholder: "@miinmobiliaria", icon: Instagram },
                                    { field: "facebook", label: "Facebook", placeholder: "https://facebook.com/...", icon: Facebook },
                                    { field: "direccion", label: "Dirección", placeholder: "Av. Corrientes 1234, CABA", icon: MapPin },
                                ].map(({ field, label, placeholder, icon: Icon }) => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                            <div className="pl-3 text-gray-400"><Icon className="w-4 h-4" /></div>
                                            <input
                                                type="text"
                                                value={(form as any)[field] ?? ""}
                                                onChange={(e) => set(field as keyof FormData, e.target.value)}
                                                placeholder={placeholder}
                                                className="flex-1 px-3 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Right: preview (2/5) */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Smartphone className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vista previa</span>
                        </div>

                        {/* Mini browser frame */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="bg-gray-200 dark:bg-gray-700 px-3 py-2 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 bg-white dark:bg-gray-600 rounded-md px-2 py-1 text-xs text-gray-400 dark:text-gray-300 truncate">
                                    {form.slug ? `${form.slug}.zetaprop.com.ar` : "tu-sitio.zetaprop.com.ar"}
                                </div>
                            </div>

                            <div className="overflow-hidden">
                                {/* Mini hero */}
                                <div
                                    className="h-28 flex flex-col items-center justify-center px-4 text-white text-center relative overflow-hidden"
                                    style={{
                                        background: form.coverUrl
                                            ? undefined
                                            : `linear-gradient(135deg, ${form.colorPrimario}, ${form.colorSecundario})`,
                                    }}
                                >
                                    {form.coverUrl && (
                                        <Image src={form.coverUrl} alt="" fill className="object-cover" />
                                    )}
                                    {form.coverUrl && <div className="absolute inset-0 bg-black/50" />}
                                    <div className="relative z-10 flex flex-col items-center">
                                        {form.logoUrl ? (
                                            <Image src={form.logoUrl} alt="" width={80} height={24} className="h-6 w-auto object-contain mb-1" />
                                        ) : (
                                            <p className="text-sm font-bold leading-tight line-clamp-1">
                                                {form.nombre || "Mi Inmobiliaria"}
                                            </p>
                                        )}
                                        {form.descripcion && (
                                            <p className="text-[10px] text-white/80 mt-1 line-clamp-1">{form.descripcion}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Mini property cards */}
                                <div className="bg-white dark:bg-gray-900 p-3">
                                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-2">Propiedades disponibles</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                                                <div className="h-10 bg-gray-100 dark:bg-gray-800" />
                                                <div className="p-1.5">
                                                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-3/4" />
                                                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-900 px-3 py-2 flex items-center justify-between">
                                    <p className="text-[9px] text-gray-400 truncate">{form.nombre || "Mi Inmobiliaria"}</p>
                                    <p className="text-[8px] text-gray-600">Zeta Prop</p>
                                </div>
                            </div>
                        </div>

                        {/* Info card */}
                        <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 text-xs text-indigo-700 dark:text-indigo-300 space-y-1.5">
                            <p className="font-semibold">¿Cómo funciona?</p>
                            <p>1. Completá los datos y guardá.</p>
                            <p>2. Publicá el sitio con el botón de arriba.</p>
                            <p>3. Tu portal queda en <strong>{form.slug || "tu-slug"}.zetaprop.com.ar</strong></p>
                            <p className="text-indigo-500 dark:text-indigo-400 mt-2">
                                Dominio propio próximamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
