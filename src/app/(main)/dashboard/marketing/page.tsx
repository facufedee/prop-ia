"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Mail, Send, FileText, BarChart2, RefreshCw, Save, Eye,
    CheckCircle, XCircle, Clock, Info, Trash2, Plus, FilePlus2,
    UserPlus, MessageSquare, Play, Lightbulb, Users, TrendingUp, Megaphone, Home, Paperclip,
    type LucideIcon
} from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { toast } from "sonner";
import { PREMIUM_TEMPLATES } from "./premiumTemplates";

// ======= Types =======
type EmailTemplateType = string;

interface EmailTemplate {
    id?: string;
    type: EmailTemplateType;
    name: string;
    subject: string;
    html: string;
    isCustom?: boolean;
    updatedAt?: string;
}

interface EmailLog {
    id?: string;
    type: EmailTemplateType;
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    sentAt: string;
}

interface EmailStats {
    [key: string]: { sent: number; failed: number };
}

// ======= Default templates config =======
const DEFAULT_TEMPLATES: Record<string, { name: string; description: string; icon: LucideIcon; color: string }> = {
    welcome: {
        name: "Bienvenida",
        description: "Se envía cuando un usuario se registra por primera vez.",
        icon: UserPlus,
        color: "accent",
    },
    payment_confirmed: {
        name: "Pago Confirmado",
        description: "Se envía cuando se procesa un pago exitoso.",
        icon: CheckCircle,
        color: "positive",
    },
    payment_expiring: {
        name: "Pago por Vencer",
        description: "Se envía 7 y 3 días antes de que venza la suscripción.",
        icon: Clock,
        color: "warning",
    },
    new_lead: {
        name: "Nueva Consulta",
        description: "Se envía al agente cuando recibe una nueva consulta de un interesado.",
        icon: MessageSquare,
        color: "accent",
    },
    activation: {
        name: "Activación",
        description: "Tip automático para ayudar al usuario a usar el sistema correctamente.",
        icon: Play,
        color: "accent",
    },
    value: {
        name: "Valor (Liquidaciones)",
        description: "Tip sobre el valor de crear liquidaciones automáticas en ZetaProp.",
        icon: Lightbulb,
        color: "positive",
    },
    social: {
        name: "Prueba Social",
        description: "Un correo analizando cómo otras inmobiliarias usan ZetaProp.",
        icon: Users,
        color: "accent",
    },
    conversion: {
        name: "Conversión",
        description: "Email orientado para invitar a adoptar la plataforma completa.",
        icon: TrendingUp,
        color: "positive",
    },
    promotion: {
        name: "Promocional (Old)",
        description: "Anuncio de las novedades antiguas u ofertas.",
        icon: Megaphone,
        color: "warning",
    },
    crm_portal: {
        name: "CRM + Portal",
        description: "Explicación de la ventaja del CRM y Portal inmobiliario integrado.",
        icon: Home,
        color: "accent",
    }
};

// ======= Color helpers =======
function colorClass(color: string, style: string) {
    const map: Record<string, Record<string, string>> = {
        accent: {
            bg: "bg-[var(--color-accent-soft)]", text: "text-[var(--color-accent)]", border: "border-[var(--color-accent)]/30",
            badge: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]", dot: "bg-[var(--color-accent)]"
        },
        positive: {
            bg: "bg-[var(--color-positive-soft)]", text: "text-[var(--color-positive)]", border: "border-[var(--color-positive)]/30",
            badge: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]", dot: "bg-[var(--color-positive)]"
        },
        warning: {
            bg: "bg-[var(--color-warning-soft)]", text: "text-[var(--color-warning)]", border: "border-[var(--color-warning)]/30",
            badge: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]", dot: "bg-[var(--color-warning)]"
        },
    };
    return map[color]?.[style] || "";
}

type Tab = 'resumen' | 'templates' | 'historial';

export default function MarketingPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('resumen');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [stats, setStats] = useState<EmailStats>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testSending, setTestSending] = useState(false);

    // Template editor
    const [editingType, setEditingType] = useState<EmailTemplateType | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [seedingTemplates, setSeedingTemplates] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/marketing/templates', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error fetching marketing data');
            const data = await res.json();
            setTemplates(data.templates || []);
            setStats(data.stats || {});
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Error loading marketing data:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build the dynamic ALL_TEMPLATES mapping 
    const ALL_TEMPLATES = { ...DEFAULT_TEMPLATES };
    templates.forEach(t => {
        if (!ALL_TEMPLATES[t.type]) {
            ALL_TEMPLATES[t.type] = {
                name: t.name || t.type,
                description: 'Email personalizado creado manualmente.',
                icon: Mail,
                color: 'accent'
            };
        }
    });

    const handleEditTemplate = (type: EmailTemplateType) => {
        const existing = templates.find(t => t.type === type);
        setEditingType(type);
        setIsCreatingNew(false);
        setEditSubject(existing?.subject || '');
        setEditHtml(existing?.html || '');
        setPreviewMode(false);
        setSaveSuccess(false);
    };

    const handleCreateNewClick = () => {
        setIsCreatingNew(true);
        setEditingType(null);
        setNewTemplateName('');
        setEditSubject('');
        setEditHtml('');
        setPreviewMode(false);
        setSaveSuccess(false);
    };

    const handleSaveTemplate = async () => {
        if (!editingType && !isCreatingNew) return;
        if (isCreatingNew && !newTemplateName.trim()) {
            alert('Por favor ingresá un nombre identificador para el template.');
            return;
        }

        const typeToSave = isCreatingNew ? `custom_${Date.now()}` : editingType!;
        const nameToSave = isCreatingNew ? newTemplateName : (ALL_TEMPLATES[typeToSave]?.name || typeToSave);

        setSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/marketing/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: typeToSave,
                    name: nameToSave,
                    subject: editSubject,
                    html: editHtml,
                    updatedBy: user?.email || 'admin',
                }),
            });
            if (!res.ok) throw new Error('Error saving template');
            setSaveSuccess(true);
            await fetchData();
            if (isCreatingNew) {
                setIsCreatingNew(false);
                setEditingType(typeToSave);
            }
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving template:', err);
            toast.error('No se pudo guardar el template. Probá de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleSeedPremiumTemplates = async () => {
        setSeedingTemplates(true);
        try {
            const token = await user?.getIdToken();
            const existingTypes = new Set(templates.map(t => t.type));
            const toSeed = PREMIUM_TEMPLATES.filter(t => !existingTypes.has(t.type));

            if (toSeed.length === 0) {
                toast.info('Ya tenés todos los templates premium cargados.');
                return;
            }

            let failed = 0;
            for (const t of toSeed) {
                const res = await fetch('/api/marketing/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ type: t.type, name: t.name, subject: t.subject, html: t.html, updatedBy: user?.email || 'admin' }),
                });
                if (!res.ok) failed++;
            }

            await fetchData();
            if (failed === 0) {
                toast.success(`${toSeed.length} templates premium cargados correctamente.`);
            } else {
                toast.error(`${toSeed.length - failed} cargados, ${failed} fallaron.`);
            }
        } catch (err) {
            console.error('Error seeding premium templates:', err);
            toast.error('No se pudieron cargar los templates premium.');
        } finally {
            setSeedingTemplates(false);
        }
    };

    const handleResetTemplate = async () => {
        if (!editingType) return;
        const existing = templates.find(t => t.type === editingType);
        if (!existing?.id) return;
        if (!confirm('¿Seguro que deseas eliminar/resetear este template?')) return;
        try {
            const token = await user?.getIdToken();
            await fetch(`/api/marketing/templates?id=${existing.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchData();
            if (DEFAULT_TEMPLATES[editingType]) {
                setEditSubject('');
                setEditHtml('');
            } else {
                // If it was fully custom, deselect it
                setEditingType(null);
            }
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    const handleSendTest = async () => {
        const typeToTest = editingType;
        if (!typeToTest || !testEmail) return;

        setTestSending(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    type: typeToTest,
                    to: testEmail,
                    data: {
                        userName: 'Usuario de Prueba',
                        planName: 'Plan PRO',
                        amount: 10000,
                        period: 'monthly',
                        agentName: 'Agente',
                        leadName: 'Juan Perez',
                        propertyName: 'Departamento en el Centro',
                        message: 'Hola, me interesa la propiedad. ¿Podemos coordinar una visita?',
                        expiryDate: '15 de Octubre de 2025',
                        daysLeft: 7,
                    },
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Error ${res.status}`);
            }
            toast.success(`Email de prueba enviado a ${testEmail}`);
        } catch (err: any) {
            toast.error(`Error enviando email de prueba: ${err.message || ''}`);
        } finally {
            setTestSending(false);
        }
    };

    // ======= Total stats =======
    const totalSent = Object.values(stats).reduce((a, s) => a + (s.sent || 0), 0);
    const totalFailed = Object.values(stats).reduce((a, s) => a + (s.failed || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <span className="w-9 h-9 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                            <Mail strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />
                        </span>
                        Marketing & Fidelización
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Gestión de emails automáticos y plantillas personalizadas</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-xl transition"
                >
                    <RefreshCw strokeWidth={1.5} size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--color-paper-3)] p-1 rounded-xl w-fit">
                {(['resumen', 'templates', 'historial'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab
                            ? 'bg-[var(--color-paper-2)] text-[var(--color-ink)] shadow-sm'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-ink-2)]'
                            }`}
                    >
                        {tab === 'resumen' && <span className="flex items-center gap-1.5"><BarChart2 strokeWidth={1.5} size={14} /> Resumen</span>}
                        {tab === 'templates' && <span className="flex items-center gap-1.5"><FileText strokeWidth={1.5} size={14} /> Templates</span>}
                        {tab === 'historial' && <span className="flex items-center gap-1.5"><Clock strokeWidth={1.5} size={14} /> Historial</span>}
                    </button>
                ))}
            </div>

            {/* ======= RESUMEN ======= */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {/* Global stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-5">
                            <p className="text-sm text-[var(--color-muted)] mb-1">Emails enviados</p>
                            <p className="text-3xl font-bold text-[var(--color-ink)]">{loading ? '—' : totalSent}</p>
                        </div>
                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-5">
                            <p className="text-sm text-[var(--color-muted)] mb-1">Fallidos</p>
                            <p className="text-3xl font-bold text-[var(--color-danger)]">{loading ? '—' : totalFailed}</p>
                        </div>
                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-5">
                            <p className="text-sm text-[var(--color-muted)] mb-1">Tasa de éxito</p>
                            <p className="text-3xl font-bold text-[var(--color-positive)]">
                                {loading ? '—' : totalSent + totalFailed === 0 ? '—' : `${Math.round((totalSent / (totalSent + totalFailed)) * 100)}%`}
                            </p>
                        </div>
                    </div>

                    {/* Per-type stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(Object.entries(ALL_TEMPLATES)).map(([type, info]) => {
                            const s = stats[type] || { sent: 0, failed: 0 };
                            const hasCustom = templates.some(t => t.type === type);
                            // Avoid showing stats for unused custom templates if sent=0. Defaults always show.
                            if (!DEFAULT_TEMPLATES[type] && s.sent === 0 && s.failed === 0) return null;

                            return (
                                <div key={type} className={`bg-[var(--color-paper-2)] rounded-2xl border p-5 ${colorClass(info.color, 'border')} hover:shadow-sm transition`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-9 h-9 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center"><info.icon strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" /></span>
                                            <div>
                                                <p className="font-semibold text-[var(--color-ink)] text-sm whitespace-pre-wrap">{info.name}</p>
                                            </div>
                                        </div>
                                        {hasCustom && (
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass(info.color, 'badge')}`}>
                                                Customizado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-[var(--color-positive)] font-medium">{s.sent} enviados</span>
                                        {s.failed > 0 && <span className="text-[var(--color-danger)] font-medium">{s.failed} fallidos</span>}
                                    </div>
                                    <button
                                        onClick={() => { setActiveTab('templates'); handleEditTemplate(type); }}
                                        className={`mt-3 text-xs font-medium ${colorClass(info.color, 'text')} hover:underline`}
                                    >
                                        Editar template →
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ======= TEMPLATES ======= */}
            {activeTab === 'templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-[var(--color-ink-2)] uppercase tracking-wide mb-2">Directorios de Emails</h2>
                        {(Object.entries(ALL_TEMPLATES)).map(([type, info]) => {
                            const hasCustom = templates.some(t => t.type === type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleEditTemplate(type)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${editingType === type && !isCreatingNew
                                        ? `${colorClass(info.color, 'bg')} ${colorClass(info.color, 'border')} ring-2 ring-[var(--color-accent)]/40`
                                        : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-neutral)]'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <info.icon strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />
                                            <span className="font-medium text-sm text-[var(--color-ink)]">{info.name}</span>
                                        </div>
                                        {hasCustom && (
                                            <span className="text-[9px] font-bold bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-1.5 py-0.5 rounded-full">
                                                CUSTOM
                                            </span>
                                        )}
                                    </div>
                                    {info.description && <p className="text-xs text-[var(--color-muted)] mt-1 ml-7">{info.description}</p>}
                                </button>
                            );
                        })}

                        <button
                            onClick={handleCreateNewClick}
                            className={`w-full text-center p-4 rounded-xl border border-dashed transition-all flex items-center justify-center gap-2 ${isCreatingNew ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium scale-[1.02]' : 'border-[var(--color-rule)] text-[var(--color-muted)] hover:text-[var(--color-accent-2)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)]'}`}
                        >
                            <Plus strokeWidth={1.5} size={18} />
                            Crear nuevo template
                        </button>

                        <button
                            onClick={handleSeedPremiumTemplates}
                            disabled={seedingTemplates}
                            className="w-full text-center p-3 rounded-xl border border-[var(--color-accent)]/30 border border-[var(--color-rule)] text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-60"
                        >
                            {seedingTemplates ? <RefreshCw strokeWidth={1.5} size={16} className="animate-spin" /> : <FilePlus2 strokeWidth={1.5} size={16} />}
                            Cargar Templates Premium
                        </button>
                    </div>

                    {/* Editor */}
                    <div className="lg:col-span-2">
                        {editingType || isCreatingNew ? (
                            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                                {/* Editor header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-rule-2)] bg-[var(--color-paper)]/50">
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const EditorIcon = isCreatingNew ? FilePlus2 : (ALL_TEMPLATES[editingType!]?.icon ?? Mail);
                                            return <EditorIcon strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />;
                                        })()}
                                        <h3 className="font-semibold text-[var(--color-ink)]">
                                            {isCreatingNew ? 'Nuevo Template Creado a Mano' : ALL_TEMPLATES[editingType!]?.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPreviewMode(!previewMode)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-ink-2)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] hover:bg-[var(--color-paper-3)] rounded-lg shadow-sm transition"
                                        >
                                            <Eye strokeWidth={1.5} size={14} />
                                            {previewMode ? 'Ver Código' : 'Vista Previa'}
                                        </button>
                                        {!isCreatingNew && templates.some(t => t.type === editingType) && (
                                            <button
                                                onClick={handleResetTemplate}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/30 bg-[var(--color-paper-2)] hover:bg-[var(--color-danger-soft)] rounded-lg shadow-sm transition"
                                            >
                                                <Trash2 strokeWidth={1.5} size={14} />
                                                Eliminar
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[var(--color-ink)] text-[var(--color-paper)] font-medium rounded-lg hover:bg-[var(--color-ink-2)] shadow-sm transition disabled:opacity-60"
                                        >
                                            {saving ? <RefreshCw strokeWidth={1.5} size={14} className="animate-spin" /> : <Save strokeWidth={1.5} size={14} />}
                                            {saveSuccess ? '¡Guardado!' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Info Panel */}
                                    <div className="flex items-start gap-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-xl p-3.5 text-sm text-[var(--color-ink-2)]">
                                        <Info strokeWidth={1.5} size={16} className="mt-0.5 flex-shrink-0 text-[var(--color-muted)]" />
                                        <span>
                                            Podés usar variables como <code className="bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 font-mono px-1.5 rounded">{"{{userName}}"}</code>,{' '}
                                            <code className="bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 font-mono px-1.5 rounded">{"{{planName}}"}</code>,{' '}
                                            <code className="bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 font-mono px-1.5 rounded">{"{{expiryDate}}"}</code>,{' '}
                                            <code className="bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 font-mono px-1.5 rounded">{"{{leadName}}"}</code> en el HTML.
                                            Si dejas los campos vacíos, se enviará pero con el diseño crudo de ZetaProp si existe.
                                        </span>
                                    </div>

                                    {/* Name Editor (only if new) */}
                                    {isCreatingNew && (
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Nombre Interno (para verlo en la lista)</label>
                                            <input
                                                type="text"
                                                value={newTemplateName}
                                                onChange={e => setNewTemplateName(e.target.value)}
                                                placeholder="Ej: Invitación Lanzamiento Promocional"
                                                className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Asunto del correo (Subject)</label>
                                        <input
                                            type="text"
                                            value={editSubject}
                                            onChange={e => setEditSubject(e.target.value)}
                                            placeholder="Ej: ¡Bienvenido/a a ZetaProp!"
                                            className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] outline-none"
                                        />
                                    </div>

                                    {/* HTML / Preview */}
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">
                                            {previewMode ? 'Vista previa renderizada' : 'Código HTML'}
                                        </label>
                                        {previewMode ? (
                                            <div
                                                className="border border-[var(--color-rule)] rounded-xl overflow-auto bg-[var(--color-paper-2)] shadow-inner"
                                                style={{ minHeight: '350px' }}
                                            >
                                                {editHtml ? (
                                                    <iframe
                                                        srcDoc={editHtml}
                                                        className="w-full h-[400px] border-0"
                                                        title="Email preview"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-60 text-[var(--color-neutral)] text-sm">
                                                        Ingresá HTML para ver la vista previa real
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                id="html-editor"
                                                value={editHtml}
                                                onChange={e => setEditHtml(e.target.value)}
                                                placeholder="<html>... Pegá aquí el código HTML completo</html>"
                                                rows={15}
                                                className="w-full px-4 py-3 border border-[var(--color-rule)] bg-[var(--color-paper)]/50 rounded-xl text-[13px] font-mono focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] outline-none resize-y"
                                            />
                                        )}
                                    </div>

                                    {/* Test send */}
                                    {!isCreatingNew && (
                                        <div className="flex gap-3 pt-4 border-t border-[var(--color-rule-2)]">
                                            <input
                                                type="email"
                                                value={testEmail}
                                                onChange={e => setTestEmail(e.target.value)}
                                                placeholder="Ingresa un correo para prueba"
                                                className="flex-1 px-4 py-2 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                                            />
                                            <button
                                                onClick={handleSendTest}
                                                disabled={!testEmail || testSending}
                                                className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium rounded-xl hover:bg-[var(--color-ink-2)] transition disabled:opacity-50"
                                            >
                                                {testSending ? <RefreshCw strokeWidth={1.5} size={14} className="animate-spin" /> : <Send strokeWidth={1.5} size={14} />}
                                                Enviar prueba (Test)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-80 bg-[var(--color-paper)]/50 rounded-2xl border-2 border-dashed border-[var(--color-rule)] text-center p-8">
                                <span className="bg-[var(--color-paper-2)] p-4 rounded-full shadow-sm mb-4 border border-[var(--color-rule-2)]">
                                    <FileText strokeWidth={1.5} size={40} className="text-[var(--color-neutral)]" />
                                </span>
                                <h3 className="text-lg font-semibold text-[var(--color-ink-2)] mb-1">Seleccioná un template</h3>
                                <p className="text-[var(--color-muted)] text-sm max-w-sm">
                                    Explorá los templates del listado o creá uno nuevo a mano para visualizar el editor y modificar HTML o Asuntos.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======= HISTORIAL ======= */}
            {activeTab === 'historial' && (
                <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--color-rule-2)] flex items-center justify-between">
                        <h2 className="font-semibold text-[var(--color-ink)]">Historial de Emails Recientes</h2>
                        <span className="text-sm text-[var(--color-muted)]">{logs.length} registros recuperados</span>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="h-7 w-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-[var(--color-neutral)] text-sm">Cargando historial...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center">
                            <Clock strokeWidth={1.5} size={36} className="text-[var(--color-neutral)] mx-auto mb-3" />
                            <p className="text-[var(--color-muted)]">No hay emails logueados registrados aún.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Tipo de Template</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Destinatario</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Asunto Desplegado</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Fecha y Hora</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-rule-2)]">
                                    {logs.map((log, i) => {
                                        const info = ALL_TEMPLATES[log.type] || { name: log.type, color: 'accent', icon: Paperclip };
                                        return (
                                            <tr key={log.id || i} className="hover:bg-[var(--color-paper-3)] transition">
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${colorClass(info?.color || 'accent', 'badge')}`}>
                                                        <info.icon strokeWidth={1.5} size={12} /> {info?.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-[var(--color-ink-2)] max-w-[160px] truncate">{log.to}</td>
                                                <td className="px-6 py-3 text-[var(--color-ink-2)] max-w-[200px] truncate">{log.subject}</td>
                                                <td className="px-6 py-3">
                                                    {log.status === 'sent' ? (
                                                        <span className="inline-flex items-center gap-1 text-[var(--color-positive)] font-medium bg-[var(--color-positive-soft)] px-2 py-0.5 rounded-full text-xs">
                                                            <CheckCircle strokeWidth={1.5} size={12} /> Exitoso
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[var(--color-danger)] font-medium bg-[var(--color-danger-soft)] px-2 py-0.5 rounded-full text-xs">
                                                            <XCircle strokeWidth={1.5} size={12} /> Fallido
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-[var(--color-neutral)] text-xs">
                                                    {log.sentAt ? new Date(log.sentAt).toLocaleString('es-AR', {
                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    }) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
