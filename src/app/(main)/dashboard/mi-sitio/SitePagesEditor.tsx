"use client";

import { useState } from "react";
import {
    Plus, Trash2, FileText, Building2, Users, HelpCircle,
    ChevronDown, ChevronUp, Edit3, Eye, EyeOff, GripVertical,
} from "lucide-react";
import { SitePage, SitePageFaqItem, SitePageTeamMember } from "@/domain/models/Site";

function slugify(text: string): string {
    return text.toString().toLowerCase().trim()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

const EMPTY_DRAFT = (): Omit<SitePage, "id"> => ({
    label: "", type: "content", enabled: true,
    heroTitle: "", heroSubtitle: "", body: "", faqItems: [], teamMembers: [],
    pageTitle: "", pageSubtitle: "", filterTag: "",
});

interface Props {
    pages: SitePage[];
    onChange: (pages: SitePage[]) => void;
}

export default function SitePagesEditor({ pages, onChange }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<SitePage & { id: string }>(
        { ...EMPTY_DRAFT(), id: "" }
    );

    const set = (field: keyof SitePage, value: any) =>
        setDraft(prev => ({ ...prev, [field]: value }));

    const openNew = () => {
        setDraft({ ...EMPTY_DRAFT(), id: "new" });
        setEditingId("new");
    };

    const openEdit = (page: SitePage) => {
        setDraft({ ...page });
        setEditingId(page.id);
    };

    const cancel = () => { setEditingId(null); };

    const save = () => {
        if (!draft.label.trim()) return;
        if (editingId === "new") {
            let id = slugify(draft.label) || `pagina-${Date.now()}`;
            if (pages.some(p => p.id === id)) id = `${id}-${Date.now()}`;
            onChange([...pages, { ...draft, id }]);
        } else {
            onChange(pages.map(p => p.id === editingId ? { ...draft } : p));
        }
        setEditingId(null);
    };

    const remove = (id: string) => {
        if (confirm("¿Eliminar esta página?")) onChange(pages.filter(p => p.id !== id));
    };

    const toggle = (id: string) =>
        onChange(pages.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));

    // ── FAQ helpers ──────────────────────────────────────────────────────────
    const addFaq = () =>
        set("faqItems", [...(draft.faqItems || []), { question: "", answer: "" }]);

    const updateFaq = (i: number, field: keyof SitePageFaqItem, val: string) => {
        const items = [...(draft.faqItems || [])];
        items[i] = { ...items[i], [field]: val };
        set("faqItems", items);
    };

    const removeFaq = (i: number) =>
        set("faqItems", (draft.faqItems || []).filter((_, idx) => idx !== i));

    // ── Team helpers ─────────────────────────────────────────────────────────
    const addMember = () =>
        set("teamMembers", [...(draft.teamMembers || []), { name: "", role: "" }]);

    const updateMember = (i: number, field: keyof SitePageTeamMember, val: string) => {
        const members = [...(draft.teamMembers || [])];
        members[i] = { ...members[i], [field]: val };
        set("teamMembers", members);
    };

    const removeMember = (i: number) =>
        set("teamMembers", (draft.teamMembers || []).filter((_, idx) => idx !== i));

    // ── Page list ────────────────────────────────────────────────────────────
    if (editingId === null) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Páginas del sitio</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Las páginas habilitadas aparecen automáticamente en el menú de tu sitio.
                        </p>
                    </div>
                    <button
                        onClick={openNew}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nueva página
                    </button>
                </div>

                {pages.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Todavía no tenés páginas</p>
                        <p className="text-xs text-gray-400 mt-1">Agregá "Quiénes Somos", "Emprendimientos" y más.</p>
                        <button
                            onClick={openNew}
                            className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            + Crear primera página
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {pages.map(page => (
                            <div
                                key={page.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                    {page.type === "content"
                                        ? <FileText className="w-4 h-4 text-indigo-500" />
                                        : <Building2 className="w-4 h-4 text-emerald-500" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{page.label}</p>
                                    <p className="text-xs text-gray-400 font-mono">/p/{page.id}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.type === "content" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                                    {page.type === "content" ? "Contenido" : "Propiedades"}
                                </span>
                                <button
                                    onClick={() => toggle(page.id)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${page.enabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                    title={page.enabled ? "Deshabilitar" : "Habilitar"}
                                >
                                    {page.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => openEdit(page)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Editar"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => remove(page.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── Page editor ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    {editingId === "new" ? "Nueva página" : "Editar página"}
                </h3>
                <button onClick={cancel} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">
                    ← Volver
                </button>
            </div>

            {/* Label + Type */}
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Nombre de la página *
                    </label>
                    <input
                        value={draft.label}
                        onChange={e => set("label", e.target.value)}
                        placeholder="ej: Quiénes Somos"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    {draft.label && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">URL: /p/{slugify(draft.label) || "…"}</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tipo de página</label>
                    <div className="flex gap-2">
                        {(["content", "properties"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => set("type", t)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${draft.type === t ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"}`}
                            >
                                {t === "content" ? <FileText className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                                {t === "content" ? "Contenido" : "Propiedades"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enabled */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                    onClick={() => set("enabled", !draft.enabled)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${draft.enabled ? "bg-indigo-500" : "bg-gray-300"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${draft.enabled ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {draft.enabled ? "Habilitada (aparece en el menú)" : "Deshabilitada (oculta)"}
                </span>
            </label>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-5">

                {/* ── CONTENT fields ── */}
                {draft.type === "content" && (
                    <>
                        {/* Hero */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Encabezado</h4>
                            <input
                                value={draft.heroTitle || ""}
                                onChange={e => set("heroTitle", e.target.value)}
                                placeholder="Título principal (ej: Conocé nuestro equipo)"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <input
                                value={draft.heroSubtitle || ""}
                                onChange={e => set("heroSubtitle", e.target.value)}
                                placeholder="Subtítulo o descripción breve"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>

                        {/* Body text */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Texto principal</h4>
                            <textarea
                                value={draft.body || ""}
                                onChange={e => set("body", e.target.value)}
                                placeholder="Escribí el contenido de la página..."
                                rows={5}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none resize-y"
                            />
                        </div>

                        {/* FAQ section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5" /> Preguntas frecuentes
                                </h4>
                                <button
                                    onClick={addFaq}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Agregar
                                </button>
                            </div>
                            {(draft.faqItems || []).length === 0 && (
                                <p className="text-xs text-gray-400 italic">Sin preguntas todavía.</p>
                            )}
                            {(draft.faqItems || []).map((faq, i) => (
                                <div key={i} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 mt-2.5 min-w-[12px]">{i + 1}</span>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                value={faq.question}
                                                onChange={e => updateFaq(i, "question", e.target.value)}
                                                placeholder="Pregunta"
                                                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none font-semibold"
                                            />
                                            <textarea
                                                value={faq.answer}
                                                onChange={e => updateFaq(i, "answer", e.target.value)}
                                                placeholder="Respuesta"
                                                rows={2}
                                                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                                            />
                                        </div>
                                        <button onClick={() => removeFaq(i)} className="mt-1.5 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Team section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Equipo
                                </h4>
                                <button
                                    onClick={addMember}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Agregar persona
                                </button>
                            </div>
                            {(draft.teamMembers || []).length === 0 && (
                                <p className="text-xs text-gray-400 italic">Sin miembros del equipo todavía.</p>
                            )}
                            {(draft.teamMembers || []).map((m, i) => (
                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1 grid sm:grid-cols-2 gap-2">
                                            <input
                                                value={m.name}
                                                onChange={e => updateMember(i, "name", e.target.value)}
                                                placeholder="Nombre *"
                                                className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none font-semibold"
                                            />
                                            <input
                                                value={m.role}
                                                onChange={e => updateMember(i, "role", e.target.value)}
                                                placeholder="Rol / Cargo *"
                                                className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                            />
                                            <input
                                                value={m.whatsapp || ""}
                                                onChange={e => updateMember(i, "whatsapp", e.target.value)}
                                                placeholder="WhatsApp (ej: 5491112345678)"
                                                className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                            />
                                            <input
                                                value={m.email || ""}
                                                onChange={e => updateMember(i, "email", e.target.value)}
                                                placeholder="Email"
                                                className="px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                                            />
                                        </div>
                                        <button onClick={() => removeMember(i)} className="mt-1.5 p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── PROPERTIES fields ── */}
                {draft.type === "properties" && (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Configuración</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <input
                                value={draft.pageTitle || ""}
                                onChange={e => set("pageTitle", e.target.value)}
                                placeholder="Título (ej: Emprendimientos)"
                                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <input
                                value={draft.pageSubtitle || ""}
                                onChange={e => set("pageSubtitle", e.target.value)}
                                placeholder="Subtítulo opcional"
                                className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                Etiqueta de filtro *
                            </label>
                            <input
                                value={draft.filterTag || ""}
                                onChange={e => set("filterTag", e.target.value.toLowerCase().trim())}
                                placeholder="ej: emprendimiento"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1.5">
                                Solo se mostrarán las propiedades que tengan esta etiqueta en el campo <strong>"Etiqueta de página"</strong> del formulario de propiedad.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                    onClick={save}
                    disabled={!draft.label.trim() || (draft.type === "properties" && !draft.filterTag?.trim())}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    {editingId === "new" ? "Crear página" : "Guardar cambios"}
                </button>
                <button
                    onClick={cancel}
                    className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
