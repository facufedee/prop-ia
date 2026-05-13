"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Globe, Palette, Building2, CheckCircle2, AlertCircle, Loader2,
    Eye, EyeOff, ExternalLink, Copy, Check, Sparkles, Smartphone,
    Instagram, Facebook, Phone, Mail, MapPin, Save, Upload, X, ImageIcon,
    TrendingUp, Link2, Menu, Plus, Trash2, ArrowUp, ArrowDown, MessageCircle,
    FileText,
} from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { storage } from "@/infrastructure/firebase/client";
import { siteService } from "@/infrastructure/services/siteService";
import { Site, SiteTemplate, DEFAULT_SITE, NavItem, DEFAULT_NAV_ITEMS, SitePage } from "@/domain/models/Site";
import SitePagesEditor from "./SitePagesEditor";
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
type Tab = "plantilla" | "identidad" | "colores" | "menu" | "paginas" | "contacto" | "dominio" | "seo";

const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "plantilla", label: "Plantilla", icon: Sparkles },
    { id: "identidad", label: "Identidad", icon: Building2 },
    { id: "colores", label: "Colores", icon: Palette },
    { id: "menu", label: "Menú", icon: Menu },
    { id: "paginas", label: "Páginas", icon: FileText },
    { id: "contacto", label: "Contacto", icon: Phone },
    { id: "dominio", label: "Dominio", icon: Link2 },
    { id: "seo", label: "SEO", icon: TrendingUp },
];

const VALID_TABS: Tab[] = ["plantilla", "identidad", "colores", "menu", "paginas", "contacto", "dominio", "seo"];

const HREF_PRESETS = [
    { label: "Inicio", value: "/" },
    { label: "Propiedades", value: "/propiedades" },
    { label: "Venta", value: "/propiedades?operacion=venta" },
    { label: "Alquiler", value: "/propiedades?operacion=alquiler" },
    { label: "Alquiler temporal", value: "/propiedades?operacion=temporal" },
    { label: "Nosotros", value: "#nosotros" },
    { label: "Contacto", value: "#contacto" },
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
    const searchParams = useSearchParams();

    const [site, setSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const tabFromUrl = searchParams.get("tab") as Tab | null;
    const [activeTab, setActiveTab] = useState<Tab>(
        tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "plantilla"
    );

    // Sync tab when URL changes (sidebar navigation)
    useEffect(() => {
        if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);
    const [copied, setCopied] = useState(false);
    const [slugError, setSlugError] = useState("");
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

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
                    customDomain: s.customDomain ?? "",
                    customDomainVerified: s.customDomainVerified ?? false,
                    navItems: s.navItems ?? DEFAULT_NAV_ITEMS,
                    navbarBg: s.navbarBg ?? "#ffffff",
                    navbarText: s.navbarText ?? "#111827",
                    whatsappFloat: s.whatsappFloat ?? false,
                    faviconUrl: s.faviconUrl ?? "",
                    pages: s.pages ?? [],
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

    const handleFaviconUpload = async (file: File) => {
        if (!user?.uid) return;
        setUploadingFavicon(true);
        try {
            const url = await uploadSiteImage(user.uid, "favicon" as any, file);
            set("faviconUrl", url);
            toast.success("Favicon subido");
        } catch {
            toast.error("Error al subir el favicon");
        } finally {
            setUploadingFavicon(false);
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

    // ── Nav items helpers ────────────────────────────────────────────────────

    const navItems: NavItem[] = form.navItems ?? DEFAULT_NAV_ITEMS;

    const setNavItems = (items: NavItem[]) => set("navItems", items);

    const updateNavItem = (idx: number, field: keyof NavItem, value: any) => {
        const updated = navItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
        setNavItems(updated);
    };

    const toggleNavItem = (idx: number) =>
        updateNavItem(idx, "enabled", !navItems[idx].enabled);

    const moveNavItem = (idx: number, dir: -1 | 1) => {
        const next = idx + dir;
        if (next < 0 || next >= navItems.length) return;
        const updated = [...navItems];
        [updated[idx], updated[next]] = [updated[next], updated[idx]];
        setNavItems(updated);
    };

    const removeNavItem = (idx: number) =>
        setNavItems(navItems.filter((_, i) => i !== idx));

    const addNavItem = () =>
        setNavItems([...navItems, { label: "Nuevo ítem", href: "/propiedades", enabled: true }]);

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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" /> Mi Sitio Web
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Creá tu portal inmobiliario público con tus propiedades y tu identidad.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {site && (
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
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
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 whitespace-nowrap"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {site ? "Guardar" : "Crear sitio"}
                    </button>
                </div>
            </div>

            {/* ── Site URL banner ── */}
            {site?.published && siteUrl && (
                <div className="flex items-center gap-2 sm:gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 sm:px-5 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-green-700 dark:text-green-400 flex-1 font-medium truncate">{siteUrl}</span>
                    <button onClick={copyUrl} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-600 flex-shrink-0">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-green-600 flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            )}
            {site && !site.published && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 flex-1">
                        Tu sitio está guardado pero no publicado. Usá el botón <strong>Despublicado</strong> para activarlo.
                    </p>
                </div>
            )}

            {/* ── Main grid: tabs + preview ── */}
            <div className="grid lg:grid-cols-5 gap-6 items-start">

                {/* Left: editor (3/5) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 overflow-x-auto scrollbar-none">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="hidden xs:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-5">

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
                                        <span className="px-2 sm:px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs sm:text-sm border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">
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
                                            className="flex-1 min-w-0 px-2 sm:px-3 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                                        />
                                        <span className="px-2 sm:px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs sm:text-sm border-l border-gray-300 dark:border-gray-600 whitespace-nowrap">
                                            <span className="hidden sm:inline">.zetaprop.com.ar</span>
                                            <span className="sm:hidden">.zetaprop</span>
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
                                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <div className="relative">
                                                <Image src={form.coverUrl} alt="Cover" width={600} height={200} className="w-full h-32 object-cover" />
                                            </div>
                                            <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                                <button
                                                    onClick={() => coverInputRef.current?.click()}
                                                    disabled={uploadingCover}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                    Cambiar
                                                </button>
                                                <button
                                                    onClick={() => set("coverUrl", undefined)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
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

                                {/* Favicon upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Favicon <span className="text-gray-400 font-normal">(ícono de pestaña)</span>
                                    </label>
                                    <input
                                        ref={faviconInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFaviconUpload(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <div className="flex items-center gap-3">
                                        {form.faviconUrl ? (
                                            <>
                                                <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                    <Image src={form.faviconUrl} alt="Favicon" width={32} height={32} className="w-8 h-8 object-contain" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}
                                                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                                        {uploadingFavicon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                        Cambiar favicon
                                                    </button>
                                                    <button onClick={() => set("faviconUrl", "")}
                                                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium">
                                                        <X className="w-3 h-3" /> Quitar
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}
                                                className="flex items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm">
                                                {uploadingFavicon ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</>
                                                ) : (
                                                    <><Upload className="w-4 h-4" /> Subir favicon (PNG/ICO 32×32)</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Se muestra en la pestaña del navegador. Recomendado: PNG cuadrado de 32×32px o 64×64px.
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

                                {/* Navbar colors */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Colores del menú de navegación</h4>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Fondo del menú
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: form.navbarBg || "#ffffff" }} />
                                                <input type="color" value={form.navbarBg || "#ffffff"} onChange={(e) => set("navbarBg", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {["#ffffff", "#111827", "#1e293b", "#0f172a", "#f8fafc", "#fffbeb"].map((c) => (
                                                    <button key={c} onClick={() => set("navbarBg", c)}
                                                        className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                                                        style={{ backgroundColor: c, borderColor: form.navbarBg === c ? "#6366f1" : "#e5e7eb" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Texto del menú
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: form.navbarText || "#111827" }} />
                                                <input type="color" value={form.navbarText || "#111827"} onChange={(e) => set("navbarText", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {["#111827", "#ffffff", "#4f46e5", "#6b7280", "#0ea5e9", "#10b981"].map((c) => (
                                                    <button key={c} onClick={() => set("navbarText", c)}
                                                        className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                                                        style={{ backgroundColor: c, borderColor: form.navbarText === c ? "#6366f1" : "#e5e7eb" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Navbar preview */}
                                    <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="px-4 h-12 flex items-center justify-between gap-3 border-b"
                                            style={{ backgroundColor: form.navbarBg || "#ffffff", borderColor: `${form.navbarText || "#111827"}15` }}>
                                            <span className="font-bold text-sm" style={{ color: form.navbarText || "#111827" }}>{form.nombre || "Mi Inmobiliaria"}</span>
                                            <div className="flex gap-4">
                                                {["Inicio", "Propiedades", "Contacto"].map(l => (
                                                    <span key={l} className="text-xs font-semibold hidden sm:block" style={{ color: form.navbarText || "#111827" }}>{l}</span>
                                                ))}
                                            </div>
                                            <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: form.colorPrimario }}>WhatsApp</div>
                                        </div>
                                        <div className="h-8 bg-gray-50 dark:bg-gray-800" />
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

                        {/* ── MENÚ ── */}
                        {activeTab === "menu" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Menú principal</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                                    Activá, renombrá o reordená los ítems del menú de tu sitio.
                                </p>

                                {/* ── Items list ── */}
                                <div className="space-y-2">
                                    {navItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                                item.enabled
                                                    ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 opacity-60"
                                            }`}
                                        >
                                            {/* Visible toggle */}
                                            <button
                                                onClick={() => toggleNavItem(idx)}
                                                title={item.enabled ? "Ocultar" : "Mostrar"}
                                                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                                    item.enabled
                                                        ? "text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>

                                            {/* Label */}
                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => updateNavItem(idx, "label", e.target.value)}
                                                className="w-24 sm:w-32 flex-shrink-0 text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-400 outline-none pb-0.5 transition-colors"
                                                placeholder="Nombre"
                                            />

                                            {/* Href select */}
                                            <select
                                                value={HREF_PRESETS.some(p => p.value === item.href) ? item.href : "__custom"}
                                                onChange={(e) => {
                                                    if (e.target.value !== "__custom") updateNavItem(idx, "href", e.target.value);
                                                }}
                                                className="flex-1 min-w-0 text-xs text-gray-500 dark:text-gray-400 bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 cursor-pointer"
                                            >
                                                {HREF_PRESETS.map(p => (
                                                    <option key={p.value} value={p.value}>{p.label}</option>
                                                ))}
                                                {!HREF_PRESETS.some(p => p.value === item.href) && (
                                                    <option value="__custom">Personalizado</option>
                                                )}
                                            </select>

                                            {/* Custom href input if not in presets */}
                                            {!HREF_PRESETS.some(p => p.value === item.href) && (
                                                <input
                                                    type="text"
                                                    value={item.href}
                                                    onChange={(e) => updateNavItem(idx, "href", e.target.value)}
                                                    placeholder="/ruta"
                                                    className="w-24 text-xs text-gray-500 dark:text-gray-400 bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                                                />
                                            )}

                                            {/* Move up/down */}
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button
                                                    onClick={() => moveNavItem(idx, -1)}
                                                    disabled={idx === 0}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => moveNavItem(idx, 1)}
                                                    disabled={idx === navItems.length - 1}
                                                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => removeNavItem(idx)}
                                                className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add item */}
                                <button
                                    onClick={addNavItem}
                                    className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Agregar ítem
                                </button>

                                {/* ── Navbar preview ── */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                                        <Smartphone className="w-3.5 h-3.5" /> Vista previa del menú
                                    </p>

                                    {/* Desktop navbar */}
                                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                        {/* Browser bar */}
                                        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                            </div>
                                            <div className="flex-1 bg-white dark:bg-gray-700 rounded px-2 py-0.5 text-[10px] text-gray-400 truncate">
                                                {form.slug || "tu-sitio"}.zetaprop.com.ar
                                            </div>
                                        </div>

                                        {/* Navbar */}
                                        <div className="bg-white dark:bg-gray-900 px-4 h-14 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800">
                                            {/* Logo / nombre */}
                                            <div className="flex-shrink-0">
                                                {form.logoUrl ? (
                                                    <Image src={form.logoUrl} alt={form.nombre} width={100} height={32}
                                                        className="h-8 w-auto object-contain" />
                                                ) : (
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                                        {form.nombre || "Mi Inmobiliaria"}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Nav links */}
                                            <nav className="hidden sm:flex items-center gap-4 overflow-hidden">
                                                {navItems.filter(n => n.enabled).map((item, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs font-medium whitespace-nowrap transition-colors"
                                                        style={{ color: i === 0 ? form.colorPrimario : "#6b7280" }}
                                                    >
                                                        {item.label}
                                                    </span>
                                                ))}
                                            </nav>

                                            {/* CTA button */}
                                            <div
                                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                                                style={{ background: form.colorPrimario }}
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                <span className="hidden sm:inline">Consultar</span>
                                            </div>
                                        </div>

                                        {/* Mobile nav (icons scroll) */}
                                        <div className="sm:hidden bg-white dark:bg-gray-900 px-4 pb-3 flex gap-4 overflow-x-auto border-b border-gray-100 dark:border-gray-800">
                                            {navItems.filter(n => n.enabled).map((item, i) => (
                                                <span key={i} className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap py-1">
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Page content hint */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex flex-col gap-1.5">
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3" />
                                            <div className="h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full w-1/2" />
                                        </div>
                                    </div>

                                    {navItems.filter(n => n.enabled).length === 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Activá al menos un ítem para que aparezca el menú.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── CONTACTO ── */}
                        {activeTab === "contacto" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Información de contacto</h3>

                                {/* WhatsApp flotante toggle */}
                                {form.whatsapp && (
                                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Botón flotante de WhatsApp</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Aparece en todas las páginas de tu sitio para que te contacten más fácil.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => set("whatsappFloat", !form.whatsappFloat)}
                                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.whatsappFloat ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.whatsappFloat ? "translate-x-6" : "translate-x-0.5"}`} />
                                        </button>
                                    </div>
                                )}

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

                        {/* ── DOMINIO ── */}
                        {activeTab === "dominio" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Dominio</h3>

                                {/* Subdominio actual */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Subdominio en Zeta Prop
                                    </label>
                                    <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                        <span className="px-2 sm:px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs sm:text-sm border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">
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
                                            className="flex-1 min-w-0 px-2 sm:px-3 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                                        />
                                        <span className="px-2 sm:px-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs sm:text-sm border-l border-gray-300 dark:border-gray-600 whitespace-nowrap">
                                            <span className="hidden sm:inline">.zetaprop.com.ar</span>
                                            <span className="sm:hidden">.zetaprop</span>
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

                                {/* Dominio propio — funcional */}
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="w-5 h-5 text-indigo-500" />
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Dominio propio</h4>
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Conectá tu propio dominio (ej: <strong>inmobiliariarojas.com</strong>) para que tu sitio sea profesional.
                                    </p>

                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500 transition-all overflow-hidden">
                                        <input
                                            type="text"
                                            value={form.customDomain || ""}
                                            onChange={(e) => set("customDomain", e.target.value.toLowerCase().trim())}
                                            placeholder="ej: miinmobiliaria.com"
                                            className="w-full px-4 py-3 text-sm bg-transparent text-gray-900 dark:text-white outline-none"
                                        />
                                    </div>

                                    {form.customDomain && (
                                        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Configuración Pendiente</p>
                                                    <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-1">
                                                        Recordá apuntar tu dominio a los registros DNS de Zeta Prop para que funcione.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!form.customDomainVerified}
                                                        onChange={(e) => set("customDomainVerified", e.target.checked)}
                                                        className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                                    />
                                                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                                                        Ya configuré los DNS en mi proveedor
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                        * Nota: La activación puede tardar hasta 24hs dependiendo de tu proveedor de dominio.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── SEO ── */}
                        {activeTab === "seo" && (
                            <>
                                <h3 className="font-semibold text-gray-900 dark:text-white">SEO</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                                    Estos datos ya se generan automáticamente con la información de tu sitio.
                                </p>

                                {/* Vista previa del resultado en Google */}
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-medium">Vista previa en Google</p>
                                    <p className="text-[#1a0dab] dark:text-blue-400 text-base font-medium leading-tight line-clamp-1">
                                        {form.nombre ? `${form.nombre} | Portal Inmobiliario` : "Nombre de tu inmobiliaria | Portal Inmobiliario"}
                                    </p>
                                    <p className="text-green-700 dark:text-green-500 text-xs mt-0.5">
                                        https://{form.slug || "tu-slug"}.zetaprop.com.ar
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                                        {form.descripcion || "Descripción de tu inmobiliaria. Se muestra en los resultados de búsqueda."}
                                    </p>
                                </div>

                                {/* Open Graph preview */}
                                <div>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen al compartir en redes (Open Graph)</p>
                                    {form.coverUrl ? (
                                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                            <Image src={form.coverUrl} alt="OG Image" width={600} height={200} className="w-full h-32 object-cover" />
                                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{form.nombre || "Mi Inmobiliaria"}</p>
                                                <p className="text-xs text-gray-400 truncate">{form.slug || "tu-slug"}.zetaprop.com.ar</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-center text-xs text-gray-400">
                                            <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                            Subí una imagen de portada en la tab "Identidad" para que aparezca al compartir el sitio.
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">¿Qué se indexa automáticamente?</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Título: nombre de la inmobiliaria</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Descripción: slogan / descripción</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Imagen: imagen de portada (si subiste una)</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> URL canónica: tu subdominio</p>
                                </div>
                            </>
                        )}

                        {/* ── PÁGINAS ── */}
                        {activeTab === "paginas" && (
                            <SitePagesEditor
                                pages={form.pages || []}
                                onChange={(pages) => set("pages", pages)}
                            />
                        )}
                    </div>
                </div>

                {/* Right: preview (2/5) — hidden on mobile */}
                <div className="hidden lg:block lg:col-span-2">
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
                            {siteUrl && (
                                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 mt-2 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                    <ExternalLink className="w-3.5 h-3.5" /> Ver mi sitio
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
