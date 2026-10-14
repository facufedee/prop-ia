"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    Globe, Palette, Building2, CheckCircle2, AlertCircle, Loader2,
    Eye, EyeOff, ExternalLink, Copy, Check, LayoutTemplate, Smartphone,
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
        preview: "",
    },
    {
        id: "clasico",
        label: "Clásico",
        desc: "Estilo profesional y sobrio, ideal para inmobiliarias consolidadas.",
        preview: "",
    },
    {
        id: "minimalista",
        label: "Minimalista",
        desc: "Negro y blanco. Máxima claridad, sin distracciones.",
        preview: "",
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
    { id: "plantilla", label: "Plantilla", icon: LayoutTemplate },
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
                <Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-xl sm:text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Globe strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-accent)]" /> Mi Sitio Web
                    </h1>
                    <p className="text-[var(--color-muted)] text-sm mt-1">
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
                                    ? "bg-[var(--color-positive-soft)] text-[var(--color-positive)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                                    : "bg-[var(--color-paper-3)] text-[var(--color-ink-2)] hover:bg-[var(--color-positive-soft)] hover:text-[var(--color-positive)]"
                            }`}
                        >
                            {publishing ? (
                                <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
                            ) : site.published ? (
                                <><Eye strokeWidth={1.5} className="w-4 h-4" /> Publicado</>
                            ) : (
                                <><EyeOff strokeWidth={1.5} className="w-4 h-4" /> Despublicado</>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 flex-1 sm:flex-none px-5 py-2.5 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-sm font-semibold transition-all disabled:opacity-60 whitespace-nowrap"
                    >
                        {saving ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
                        {site ? "Guardar" : "Crear sitio"}
                    </button>
                </div>
            </div>

            {/* ── Site URL banner ── */}
            {site?.published && siteUrl && (
                <div className="flex items-center gap-2 sm:gap-3 bg-[var(--color-positive-soft)] border border-[var(--color-positive)]/30 rounded-2xl px-4 sm:px-5 py-3">
                    <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-[var(--color-positive)] flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-[var(--color-positive)] flex-1 font-medium truncate">{siteUrl}</span>
                    <button onClick={copyUrl} className="p-1.5 rounded-lg hover:bg-[var(--color-positive-soft)] transition-colors text-[var(--color-positive)] flex-shrink-0">
                        {copied ? <Check strokeWidth={1.5} className="w-4 h-4" /> : <Copy strokeWidth={1.5} className="w-4 h-4" />}
                    </button>
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-positive-soft)] transition-colors text-[var(--color-positive)] flex-shrink-0">
                        <ExternalLink strokeWidth={1.5} className="w-4 h-4" />
                    </a>
                </div>
            )}
            {site && !site.published && (
                <div className="flex items-center gap-3 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 rounded-2xl px-4 py-3">
                    <AlertCircle strokeWidth={1.5} className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-[var(--color-warning)] flex-1">
                        Tu sitio está guardado pero no publicado. Usá el botón <strong>Despublicado</strong> para activarlo.
                    </p>
                </div>
            )}

            {/* ── Main grid: tabs + preview ── */}
            <div className="grid lg:grid-cols-5 gap-6 items-start">

                {/* Left: editor (3/5) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Tabs */}
                    <div className="flex bg-[var(--color-paper-3)] rounded-xl p-1 gap-1 overflow-x-auto scrollbar-none">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === tab.id
                                            ? "bg-[var(--color-paper-2)] text-[var(--color-ink)] shadow-sm"
                                            : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"
                                    }`}
                                >
                                    <Icon strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="hidden xs:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-4 sm:p-6 space-y-5">

                        {/* ── PLANTILLA ── */}
                        {activeTab === "plantilla" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">Elegí tu plantilla</h3>
                                <div className="grid gap-3">
                                    {TEMPLATES.map((tpl) => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => set("template", tpl.id)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                                                form.template === tpl.id
                                                    ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                                                    : "border-[var(--color-rule)] hover:border-[var(--color-accent)]/30"
                                            }`}
                                        >
                                            <div className={`w-14 h-14 rounded-xl ${tpl.preview} flex-shrink-0`} />
                                            <div>
                                                <p className="font-semibold text-[var(--color-ink)]">{tpl.label}</p>
                                                <p className="text-xs text-[var(--color-muted)] mt-0.5">{tpl.desc}</p>
                                            </div>
                                            {form.template === tpl.id && (
                                                <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)] ml-auto flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── IDENTIDAD ── */}
                        {activeTab === "identidad" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">Identidad</h3>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Subdominio *
                                    </label>
                                    <div className="flex items-center rounded-xl border border-[var(--color-rule)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-accent)]/40">
                                        <span className="px-2 sm:px-3 py-3 bg-[var(--color-paper)] text-[var(--color-muted)] text-xs sm:text-sm border-r border-[var(--color-rule)] whitespace-nowrap">
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
                                            className="flex-1 min-w-0 px-2 sm:px-3 py-3 text-sm bg-[var(--color-paper-2)] text-[var(--color-ink)] outline-none"
                                        />
                                        <span className="px-2 sm:px-3 py-3 bg-[var(--color-paper)] text-[var(--color-muted)] text-xs sm:text-sm border-l border-[var(--color-rule)] whitespace-nowrap">
                                            <span className="hidden sm:inline">.zetaprop.com.ar</span>
                                            <span className="sm:hidden">.zetaprop</span>
                                        </span>
                                    </div>
                                    {checkingSlug && (
                                        <p className="mt-1 text-xs text-[var(--color-neutral)] flex items-center gap-1">
                                            <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> Verificando disponibilidad...
                                        </p>
                                    )}
                                    {slugError && (
                                        <p className="mt-1 text-xs text-[var(--color-danger)] flex items-center gap-1">
                                            <AlertCircle strokeWidth={1.5} className="w-3 h-3" /> {slugError}
                                        </p>
                                    )}
                                    {!slugError && !checkingSlug && form.slug.length >= 3 && (
                                        <p className="mt-1 text-xs text-[var(--color-positive)] flex items-center gap-1">
                                            <CheckCircle2 strokeWidth={1.5} className="w-3 h-3" /> Disponible
                                        </p>
                                    )}
                                </div>

                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Nombre de la inmobiliaria *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.nombre}
                                        onChange={(e) => set("nombre", e.target.value)}
                                        placeholder="Rodríguez Propiedades"
                                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Descripción / slogan
                                    </label>
                                    <textarea
                                        value={form.descripcion}
                                        onChange={(e) => set("descripcion", e.target.value)}
                                        placeholder="Tu inmobiliaria de confianza en Palermo y Belgrano..."
                                        rows={3}
                                        maxLength={200}
                                        className="w-full px-4 py-3 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-ink)] text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 resize-none"
                                    />
                                    <p className="text-xs text-[var(--color-neutral)] mt-1 text-right">{form.descripcion?.length ?? 0}/200</p>
                                </div>

                                {/* Logo upload */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
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
                                            <div className="p-3 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)] inline-flex">
                                                <Image src={form.logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto object-contain" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={uploadingLogo}
                                                    className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-2)] font-medium"
                                                >
                                                    {uploadingLogo ? <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> : <Upload strokeWidth={1.5} className="w-3 h-3" />}
                                                    Cambiar logo
                                                </button>
                                                <button
                                                    onClick={() => set("logoUrl", "")}
                                                    className="flex items-center gap-1.5 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium"
                                                >
                                                    <X strokeWidth={1.5} className="w-3 h-3" /> Quitar logo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                            className="flex items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-2)] transition-colors text-sm"
                                        >
                                            {uploadingLogo ? (
                                                <><Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> Subiendo...</>
                                            ) : (
                                                <><Upload strokeWidth={1.5} className="w-4 h-4" /> Subir logo</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Cover upload */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Imagen de portada <span className="text-[var(--color-neutral)] font-normal">(hero)</span>
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
                                        <div className="rounded-xl overflow-hidden border border-[var(--color-rule)]">
                                            <div className="relative">
                                                <Image src={form.coverUrl} alt="Cover" width={600} height={200} className="w-full h-32 object-cover" />
                                            </div>
                                            <div className="flex gap-2 p-2 bg-[var(--color-paper)] border-t border-[var(--color-rule)]">
                                                <button
                                                    onClick={() => coverInputRef.current?.click()}
                                                    disabled={uploadingCover}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink-2)] text-xs font-semibold rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                                                >
                                                    {uploadingCover ? <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> : <Upload strokeWidth={1.5} className="w-3 h-3" />}
                                                    Cambiar
                                                </button>
                                                <button
                                                    onClick={() => set("coverUrl", undefined)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-semibold rounded-lg hover:bg-[var(--color-danger-soft)] transition-colors"
                                                >
                                                    <X strokeWidth={1.5} className="w-3 h-3" /> Quitar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => coverInputRef.current?.click()}
                                            disabled={uploadingCover}
                                            className="flex flex-col items-center justify-center gap-2 w-full py-10 rounded-xl border-2 border-dashed border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-2)] transition-colors text-sm"
                                        >
                                            {uploadingCover ? (
                                                <><Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin" /> <span>Subiendo...</span></>
                                            ) : (
                                                <><ImageIcon strokeWidth={1.5} className="w-5 h-5" /> <span>Subir imagen de portada</span><span className="text-xs text-[var(--color-neutral)]">Recomendado: 1920×600px</span></>
                                            )}
                                        </button>
                                    )}
                                    <p className="text-xs text-[var(--color-neutral)] mt-1.5">
                                        Si no subís una imagen, se usa el degradado de colores como fondo.
                                    </p>
                                </div>

                                {/* Favicon upload */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Favicon <span className="text-[var(--color-neutral)] font-normal">(ícono de pestaña)</span>
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
                                                <div className="w-10 h-10 rounded-xl border border-[var(--color-rule)] overflow-hidden bg-[var(--color-paper)] flex items-center justify-center flex-shrink-0">
                                                    <Image src={form.faviconUrl} alt="Favicon" width={32} height={32} className="w-8 h-8 object-contain" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}
                                                        className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-2)] font-medium">
                                                        {uploadingFavicon ? <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> : <Upload strokeWidth={1.5} className="w-3 h-3" />}
                                                        Cambiar favicon
                                                    </button>
                                                    <button onClick={() => set("faviconUrl", "")}
                                                        className="flex items-center gap-1.5 text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium">
                                                        <X strokeWidth={1.5} className="w-3 h-3" /> Quitar
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}
                                                className="flex items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed border-[var(--color-rule)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent-2)] transition-colors text-sm">
                                                {uploadingFavicon ? (
                                                    <><Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> Subiendo...</>
                                                ) : (
                                                    <><Upload strokeWidth={1.5} className="w-4 h-4" /> Subir favicon (PNG/ICO 32×32)</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--color-neutral)] mt-1.5">
                                        Se muestra en la pestaña del navegador. Recomendado: PNG cuadrado de 32×32px o 64×64px.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── COLORES ── */}
                        {activeTab === "colores" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">Colores</h3>

                                <div className="grid sm:grid-cols-2 gap-5">
                                    {/* Primary */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Color primario
                                        </label>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl border-2 border-[var(--color-paper-2)] shadow-md flex-shrink-0" style={{ backgroundColor: form.colorPrimario }} />
                                            <input type="color" value={form.colorPrimario} onChange={(e) => set("colorPrimario", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_COLORS.map((c) => (
                                                <button key={c} onClick={() => set("colorPrimario", c)}
                                                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${form.colorPrimario === c ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper-2)] border-[var(--color-paper-2)]" : "border-transparent"}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Secondary */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Color secundario
                                        </label>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl border-2 border-[var(--color-paper-2)] shadow-md flex-shrink-0" style={{ backgroundColor: form.colorSecundario }} />
                                            <input type="color" value={form.colorSecundario} onChange={(e) => set("colorSecundario", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {PRESET_COLORS.map((c) => (
                                                <button key={c} onClick={() => set("colorSecundario", c)}
                                                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${form.colorSecundario === c ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper-2)] border-[var(--color-paper-2)]" : "border-transparent"}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Navbar colors */}
                                <div className="pt-4 border-t border-[var(--color-rule-2)]">
                                    <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-4">Colores del menú de navegación</h4>
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                Fondo del menú
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border-2 border-[var(--color-paper-2)] shadow-md flex-shrink-0" style={{ backgroundColor: form.navbarBg || "#ffffff" }} />
                                                <input type="color" value={form.navbarBg || "#ffffff"} onChange={(e) => set("navbarBg", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {["#ffffff", "#111827", "#1e293b", "#0f172a", "#f8fafc", "#fffbeb"].map((c) => (
                                                    <button key={c} onClick={() => set("navbarBg", c)}
                                                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${form.navbarBg === c ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper-2)] border-[var(--color-paper-2)]" : "border-[var(--color-rule)]"}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                Texto del menú
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl border-2 border-[var(--color-paper-2)] shadow-md flex-shrink-0" style={{ backgroundColor: form.navbarText || "#111827" }} />
                                                <input type="color" value={form.navbarText || "#111827"} onChange={(e) => set("navbarText", e.target.value)} className="w-full h-10 rounded-xl cursor-pointer" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {["#111827", "#ffffff", "#4f46e5", "#6b7280", "#0ea5e9", "#10b981"].map((c) => (
                                                    <button key={c} onClick={() => set("navbarText", c)}
                                                        className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${form.navbarText === c ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper-2)] border-[var(--color-paper-2)]" : "border-[var(--color-rule)]"}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Navbar preview */}
                                    <div className="mt-4 rounded-xl border border-[var(--color-rule)] overflow-hidden">
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
                                        <div className="h-8 bg-[var(--color-paper)]" />
                                    </div>
                                </div>

                                {/* Gradient preview */}
                                <div>
                                    <p className="text-xs text-[var(--color-muted)] mb-2">Vista previa del hero</p>
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
                                <h3 className="font-semibold text-[var(--color-ink)]">Menú principal</h3>
                                <p className="text-xs text-[var(--color-muted)] -mt-2">
                                    Activá, renombrá o reordená los ítems del menú de tu sitio.
                                </p>

                                {/* ── Items list ── */}
                                <div className="space-y-2">
                                    {navItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                                item.enabled
                                                    ? "bg-[var(--color-paper-2)] border-[var(--color-rule)]"
                                                    : "bg-[var(--color-paper)] border-[var(--color-rule-2)] opacity-60"
                                            }`}
                                        >
                                            {/* Visible toggle */}
                                            <button
                                                onClick={() => toggleNavItem(idx)}
                                                title={item.enabled ? "Ocultar" : "Mostrar"}
                                                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                                    item.enabled
                                                        ? "text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
                                                        : "text-[var(--color-neutral)] hover:bg-[var(--color-paper-3)]"
                                                }`}
                                            >
                                                {item.enabled ? <Eye strokeWidth={1.5} className="w-4 h-4" /> : <EyeOff strokeWidth={1.5} className="w-4 h-4" />}
                                            </button>

                                            {/* Label */}
                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => updateNavItem(idx, "label", e.target.value)}
                                                className="w-24 sm:w-32 flex-shrink-0 text-sm font-medium text-[var(--color-ink)] bg-transparent border-b border-transparent hover:border-[var(--color-neutral)] focus:border-[var(--color-accent)] outline-none pb-0.5 transition-colors"
                                                placeholder="Nombre"
                                            />

                                            {/* Href select */}
                                            <select
                                                value={HREF_PRESETS.some(p => p.value === item.href) ? item.href : "__custom"}
                                                onChange={(e) => {
                                                    if (e.target.value !== "__custom") updateNavItem(idx, "href", e.target.value);
                                                }}
                                                className="flex-1 min-w-0 text-xs text-[var(--color-muted)] bg-transparent border border-[var(--color-rule)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--color-accent)] cursor-pointer"
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
                                                    className="w-24 text-xs text-[var(--color-muted)] bg-transparent border border-[var(--color-rule)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--color-accent)]"
                                                />
                                            )}

                                            {/* Move up/down */}
                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                <button
                                                    onClick={() => moveNavItem(idx, -1)}
                                                    disabled={idx === 0}
                                                    className="p-0.5 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ArrowUp strokeWidth={1.5} className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => moveNavItem(idx, 1)}
                                                    disabled={idx === navItems.length - 1}
                                                    className="p-0.5 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <ArrowDown strokeWidth={1.5} className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => removeNavItem(idx)}
                                                className="flex-shrink-0 p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                            >
                                                <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add item */}
                                <button
                                    onClick={addNavItem}
                                    className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[var(--color-rule)] text-sm font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent-2)] transition-colors"
                                >
                                    <Plus strokeWidth={1.5} className="w-4 h-4" /> Agregar ítem
                                </button>

                                {/* ── Navbar preview ── */}
                                <div>
                                    <p className="text-xs font-medium text-[var(--color-muted)] mb-3 flex items-center gap-1.5">
                                        <Smartphone strokeWidth={1.5} className="w-3.5 h-3.5" /> Vista previa del menú
                                    </p>

                                    {/* Desktop navbar */}
                                    <div className="rounded-xl border border-[var(--color-rule)] overflow-hidden shadow-sm">
                                        {/* Browser bar */}
                                        <div className="bg-[var(--color-paper-3)] px-3 py-2 flex items-center gap-2 border-b border-[var(--color-rule)]">
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]/30" />
                                                <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]/30" />
                                                <div className="w-2 h-2 rounded-full bg-[var(--color-positive)]/30" />
                                            </div>
                                            <div className="flex-1 bg-[var(--color-paper-2)] rounded px-2 py-0.5 text-[10px] text-[var(--color-neutral)] truncate">
                                                {form.slug || "tu-sitio"}.zetaprop.com.ar
                                            </div>
                                        </div>

                                        {/* Navbar */}
                                        <div className="bg-[var(--color-paper-2)] px-4 h-14 flex items-center justify-between gap-3 border-b border-[var(--color-rule-2)]">
                                            {/* Logo / nombre */}
                                            <div className="flex-shrink-0">
                                                {form.logoUrl ? (
                                                    <Image src={form.logoUrl} alt={form.nombre} width={100} height={32}
                                                        className="h-8 w-auto object-contain" />
                                                ) : (
                                                    <span className="font-bold text-sm text-[var(--color-ink)]">
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
                                                <MessageCircle strokeWidth={1.5} className="w-3 h-3" />
                                                <span className="hidden sm:inline">Consultar</span>
                                            </div>
                                        </div>

                                        {/* Mobile nav (icons scroll) */}
                                        <div className="sm:hidden bg-[var(--color-paper-2)] px-4 pb-3 flex gap-4 overflow-x-auto border-b border-[var(--color-rule-2)]">
                                            {navItems.filter(n => n.enabled).map((item, i) => (
                                                <span key={i} className="text-xs text-[var(--color-ink-2)] whitespace-nowrap py-1">
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Page content hint */}
                                        <div className="bg-[var(--color-paper)] px-4 py-3 flex flex-col gap-1.5">
                                            <div className="h-2 bg-[var(--color-paper-4)] rounded-full w-2/3" />
                                            <div className="h-1.5 bg-[var(--color-paper-3)] rounded-full w-1/2" />
                                        </div>
                                    </div>

                                    {navItems.filter(n => n.enabled).length === 0 && (
                                        <p className="text-xs text-[var(--color-warning)] mt-2 flex items-center gap-1.5">
                                            <AlertCircle strokeWidth={1.5} className="w-3.5 h-3.5" />
                                            Activá al menos un ítem para que aparezca el menú.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── CONTACTO ── */}
                        {activeTab === "contacto" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">Información de contacto</h3>

                                {/* WhatsApp flotante toggle */}
                                {form.whatsapp && (
                                    <div className="flex items-center justify-between p-4 bg-[var(--color-positive-soft)] border border-[var(--color-positive)]/30 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <MessageCircle strokeWidth={1.5} className="w-5 h-5 text-[var(--color-positive)] flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-ink)]">Botón flotante de WhatsApp</p>
                                                <p className="text-xs text-[var(--color-muted)]">Aparece en todas las páginas de tu sitio para que te contacten más fácil.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => set("whatsappFloat", !form.whatsappFloat)}
                                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.whatsappFloat ? "bg-[var(--color-positive)]" : "bg-[var(--color-paper-4)]"}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-[var(--color-paper-2)] rounded-full shadow transition-transform ${form.whatsappFloat ? "translate-x-6" : "translate-x-0.5"}`} />
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
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">{label}</label>
                                        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-rule)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-accent)]/40">
                                            <div className="pl-3 text-[var(--color-neutral)]"><Icon strokeWidth={1.5} className="w-4 h-4" /></div>
                                            <input
                                                type="text"
                                                value={(form as any)[field] ?? ""}
                                                onChange={(e) => set(field as keyof FormData, e.target.value)}
                                                placeholder={placeholder}
                                                className="flex-1 px-3 py-3 text-sm bg-[var(--color-paper-2)] text-[var(--color-ink)] outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* ── DOMINIO ── */}
                        {activeTab === "dominio" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">Dominio</h3>

                                {/* Subdominio actual */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">
                                        Subdominio en Zeta Prop
                                    </label>
                                    <div className="flex items-center rounded-xl border border-[var(--color-rule)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-accent)]/40">
                                        <span className="px-2 sm:px-3 py-3 bg-[var(--color-paper)] text-[var(--color-muted)] text-xs sm:text-sm border-r border-[var(--color-rule)] whitespace-nowrap">
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
                                            className="flex-1 min-w-0 px-2 sm:px-3 py-3 text-sm bg-[var(--color-paper-2)] text-[var(--color-ink)] outline-none"
                                        />
                                        <span className="px-2 sm:px-3 py-3 bg-[var(--color-paper)] text-[var(--color-muted)] text-xs sm:text-sm border-l border-[var(--color-rule)] whitespace-nowrap">
                                            <span className="hidden sm:inline">.zetaprop.com.ar</span>
                                            <span className="sm:hidden">.zetaprop</span>
                                        </span>
                                    </div>
                                    {checkingSlug && (
                                        <p className="mt-1 text-xs text-[var(--color-neutral)] flex items-center gap-1">
                                            <Loader2 strokeWidth={1.5} className="w-3 h-3 animate-spin" /> Verificando disponibilidad...
                                        </p>
                                    )}
                                    {slugError && (
                                        <p className="mt-1 text-xs text-[var(--color-danger)] flex items-center gap-1">
                                            <AlertCircle strokeWidth={1.5} className="w-3 h-3" /> {slugError}
                                        </p>
                                    )}
                                    {!slugError && !checkingSlug && form.slug.length >= 3 && (
                                        <p className="mt-1 text-xs text-[var(--color-positive)] flex items-center gap-1">
                                            <CheckCircle2 strokeWidth={1.5} className="w-3 h-3" /> Disponible
                                        </p>
                                    )}
                                </div>

                                {/* Dominio propio — funcional */}
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)]" />
                                        <h4 className="text-sm font-bold text-[var(--color-ink)]">Dominio propio</h4>
                                    </div>
                                    
                                    <p className="text-xs text-[var(--color-muted)]">
                                        Conectá tu propio dominio (ej: <strong>inmobiliariarojas.com</strong>) para que tu sitio sea profesional.
                                    </p>

                                    <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]/40 transition-all overflow-hidden">
                                        <input
                                            type="text"
                                            value={form.customDomain || ""}
                                            onChange={(e) => set("customDomain", e.target.value.toLowerCase().trim())}
                                            placeholder="ej: miinmobiliaria.com"
                                            className="w-full px-4 py-3 text-sm bg-transparent text-[var(--color-ink)] outline-none"
                                        />
                                    </div>

                                    {form.customDomain && (
                                        <div className="rounded-xl bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 p-4 space-y-3">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle strokeWidth={1.5} className="w-4 h-4 text-[var(--color-warning)] mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-[var(--color-warning)]">Configuración Pendiente</p>
                                                    <p className="text-[11px] text-[var(--color-warning)] mt-1">
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
                                                        className="w-4 h-4 rounded border-[var(--color-warning)]/30 text-[var(--color-warning)] focus:ring-[var(--color-warning)]"
                                                    />
                                                    <span className="text-[11px] font-medium text-[var(--color-warning)]">
                                                        Ya configuré los DNS en mi proveedor
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-[var(--color-neutral)] leading-relaxed italic">
                                        * Nota: La activación puede tardar hasta 24hs dependiendo de tu proveedor de dominio.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ── SEO ── */}
                        {activeTab === "seo" && (
                            <>
                                <h3 className="font-semibold text-[var(--color-ink)]">SEO</h3>
                                <p className="text-xs text-[var(--color-muted)] -mt-2">
                                    Estos datos ya se generan automáticamente con la información de tu sitio.
                                </p>

                                {/* Vista previa del resultado en Google */}
                                <div className="rounded-xl border border-[var(--color-rule)] p-4 bg-[var(--color-paper-2)]">
                                    <p className="text-xs text-[var(--color-neutral)] mb-3 font-medium">Vista previa en Google</p>
                                    <p className="text-[var(--color-accent)] text-base font-medium leading-tight line-clamp-1">
                                        {form.nombre ? `${form.nombre} | Portal Inmobiliario` : "Nombre de tu inmobiliaria | Portal Inmobiliario"}
                                    </p>
                                    <p className="text-[var(--color-positive)] text-xs mt-0.5">
                                        https://{form.slug || "tu-slug"}.zetaprop.com.ar
                                    </p>
                                    <p className="text-[var(--color-ink-2)] text-xs mt-1 line-clamp-2">
                                        {form.descripcion || "Descripción de tu inmobiliaria. Se muestra en los resultados de búsqueda."}
                                    </p>
                                </div>

                                {/* Open Graph preview */}
                                <div>
                                    <p className="text-xs font-medium text-[var(--color-ink-2)] mb-2">Imagen al compartir en redes (Open Graph)</p>
                                    {form.coverUrl ? (
                                        <div className="rounded-xl overflow-hidden border border-[var(--color-rule)]">
                                            <Image src={form.coverUrl} alt="OG Image" width={600} height={200} className="w-full h-32 object-cover" />
                                            <div className="px-3 py-2 bg-[var(--color-paper)] border-t border-[var(--color-rule)]">
                                                <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{form.nombre || "Mi Inmobiliaria"}</p>
                                                <p className="text-xs text-[var(--color-neutral)] truncate">{form.slug || "tu-slug"}.zetaprop.com.ar</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-[var(--color-rule)] p-4 text-center text-xs text-[var(--color-neutral)]">
                                            <ImageIcon strokeWidth={1.5} className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                            Subí una imagen de portada en la tab "Identidad" para que aparezca al compartir el sitio.
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl bg-[var(--color-paper)] border border-[var(--color-rule)] p-4 space-y-2 text-xs text-[var(--color-ink-2)]">
                                    <p className="font-semibold text-[var(--color-ink-2)]">¿Qué se indexa automáticamente?</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-positive)] flex-shrink-0" /> Título: nombre de la inmobiliaria</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-positive)] flex-shrink-0" /> Descripción: slogan / descripción</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-positive)] flex-shrink-0" /> Imagen: imagen de portada (si subiste una)</p>
                                    <p className="flex items-center gap-2"><CheckCircle2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-positive)] flex-shrink-0" /> URL canónica: tu subdominio</p>
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
                            <Smartphone strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                            <span className="text-xs font-medium text-[var(--color-muted)]">Vista previa</span>
                        </div>

                        {/* Mini browser frame */}
                        <div className="bg-[var(--color-paper-3)] rounded-2xl overflow-hidden border border-[var(--color-rule)] shadow-lg">
                            <div className="bg-[var(--color-paper-4)] px-3 py-2 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)]/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)]/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-positive)]/30" />
                                </div>
                                <div className="flex-1 bg-[var(--color-paper-2)] rounded-md px-2 py-1 text-xs text-[var(--color-neutral)] truncate">
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
                                <div className="bg-[var(--color-paper-2)] p-3">
                                    <p className="text-[10px] font-semibold text-[var(--color-ink-2)] mb-2">Propiedades disponibles</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="rounded-lg overflow-hidden border border-[var(--color-rule-2)]">
                                                <div className="h-10 bg-[var(--color-paper-3)]" />
                                                <div className="p-1.5">
                                                    <div className="h-1.5 bg-[var(--color-paper-4)] rounded mb-1 w-3/4" />
                                                    <div className="h-1 bg-[var(--color-paper-3)] rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[var(--color-ink)] px-3 py-2 flex items-center justify-between">
                                    <p className="text-[9px] text-[var(--color-neutral)] truncate">{form.nombre || "Mi Inmobiliaria"}</p>
                                    <p className="text-[8px] text-[var(--color-ink-2)]">Zeta Prop</p>
                                </div>
                            </div>
                        </div>

                        {/* Info card */}
                        <div className="mt-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-xl p-4 text-xs text-[var(--color-ink-2)] space-y-1.5">
                            <p className="font-semibold">¿Cómo funciona?</p>
                            <p>1. Completá los datos y guardá.</p>
                            <p>2. Publicá el sitio con el botón de arriba.</p>
                            <p>3. Tu portal queda en <strong>{form.slug || "tu-slug"}.zetaprop.com.ar</strong></p>
                            {siteUrl && (
                                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 mt-2 font-semibold text-[var(--color-accent)] hover:underline">
                                    <ExternalLink strokeWidth={1.5} className="w-3.5 h-3.5" /> Ver mi sitio
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
