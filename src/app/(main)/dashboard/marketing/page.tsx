"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Mail, Send, FileText, BarChart2, RefreshCw, Save, Eye,
    CheckCircle, XCircle, Clock, ChevronDown, Sparkles, Trash2, Plus
} from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";

// ======= Types =======
type EmailTemplateType = 'welcome' | 'payment_confirmed' | 'payment_expiring' | 'new_lead';

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
const DEFAULT_TEMPLATES: Record<EmailTemplateType, { name: string; description: string; icon: string; color: string }> = {
    welcome: {
        name: "Bienvenida",
        description: "Se envía cuando un usuario se registra por primera vez.",
        icon: "🎉",
        color: "indigo",
    },
    payment_confirmed: {
        name: "Pago Confirmado",
        description: "Se envía cuando se procesa un pago exitoso.",
        icon: "✅",
        color: "green",
    },
    payment_expiring: {
        name: "Pago por Vencer",
        description: "Se envía 7 días antes de que venza la suscripción.",
        icon: "⏰",
        color: "amber",
    },
    new_lead: {
        name: "Nueva Consulta",
        description: "Se envía al agente cuando recibe una nueva consulta de un interesado.",
        icon: "💬",
        color: "violet",
    },
};

// ======= Color helpers =======
function colorClass(color: string, style: string) {
    const map: Record<string, Record<string, string>> = {
        indigo: {
            bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200",
            badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500"
        },
        green: {
            bg: "bg-green-50", text: "text-green-700", border: "border-green-200",
            badge: "bg-green-100 text-green-700", dot: "bg-green-500"
        },
        amber: {
            bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
            badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500"
        },
        violet: {
            bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200",
            badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500"
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
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketing/templates');
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
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEditTemplate = (type: EmailTemplateType) => {
        const existing = templates.find(t => t.type === type);
        setEditingType(type);
        setEditSubject(existing?.subject || '');
        setEditHtml(existing?.html || '');
        setPreviewMode(false);
        setSaveSuccess(false);
    };

    const handleSaveTemplate = async () => {
        if (!editingType) return;
        setSaving(true);
        try {
            const res = await fetch('/api/marketing/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: editingType,
                    name: DEFAULT_TEMPLATES[editingType].name,
                    subject: editSubject,
                    html: editHtml,
                    updatedBy: user?.email || 'admin',
                }),
            });
            if (!res.ok) throw new Error('Error saving template');
            setSaveSuccess(true);
            await fetchData();
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving template:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleResetTemplate = async () => {
        if (!editingType) return;
        const existing = templates.find(t => t.type === editingType);
        if (!existing?.id) return;
        if (!confirm('¿Resetear al template por defecto?')) return;
        try {
            await fetch(`/api/marketing/templates?id=${existing.id}`, { method: 'DELETE' });
            await fetchData();
            setEditSubject('');
            setEditHtml('');
        } catch (err) {
            console.error('Error deleting template:', err);
        }
    };

    const handleSendTest = async () => {
        if (!editingType || !testEmail) return;
        setTestSending(true);
        try {
            await fetch('/api/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: editingType,
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
            alert(`✅ Email de prueba enviado a ${testEmail}`);
        } catch (err) {
            alert('❌ Error enviando email de prueba');
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Mail size={18} className="text-white" />
                        </span>
                        Marketing
                    </h1>
                    <p className="text-gray-500 mt-1">Gestión de emails automáticos y campañas</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {(['resumen', 'templates', 'historial'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'resumen' && <span className="flex items-center gap-1.5"><BarChart2 size={14} /> Resumen</span>}
                        {tab === 'templates' && <span className="flex items-center gap-1.5"><FileText size={14} /> Templates</span>}
                        {tab === 'historial' && <span className="flex items-center gap-1.5"><Clock size={14} /> Historial</span>}
                    </button>
                ))}
            </div>

            {/* ======= RESUMEN ======= */}
            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {/* Global stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <p className="text-sm text-gray-500 mb-1">Emails enviados</p>
                            <p className="text-3xl font-bold text-gray-900">{loading ? '—' : totalSent}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <p className="text-sm text-gray-500 mb-1">Fallidos</p>
                            <p className="text-3xl font-bold text-red-500">{loading ? '—' : totalFailed}</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <p className="text-sm text-gray-500 mb-1">Tasa de éxito</p>
                            <p className="text-3xl font-bold text-green-600">
                                {loading ? '—' : totalSent + totalFailed === 0 ? '—' : `${Math.round((totalSent / (totalSent + totalFailed)) * 100)}%`}
                            </p>
                        </div>
                    </div>

                    {/* Per-type stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.entries(DEFAULT_TEMPLATES) as [EmailTemplateType, typeof DEFAULT_TEMPLATES[EmailTemplateType]][]).map(([type, info]) => {
                            const s = stats[type] || { sent: 0, failed: 0 };
                            const hasCustom = templates.some(t => t.type === type);
                            return (
                                <div key={type} className={`bg-white rounded-2xl border p-5 ${colorClass(info.color, 'border')} hover:shadow-sm transition`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{info.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{info.name}</p>
                                                <p className="text-xs text-gray-500">{info.description}</p>
                                            </div>
                                        </div>
                                        {hasCustom && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass(info.color, 'badge')}`}>
                                                Personalizado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-green-600 font-medium">{s.sent} enviados</span>
                                        {s.failed > 0 && <span className="text-red-500 font-medium">{s.failed} fallidos</span>}
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
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Emails Automáticos</h2>
                        {(Object.entries(DEFAULT_TEMPLATES) as [EmailTemplateType, typeof DEFAULT_TEMPLATES[EmailTemplateType]][]).map(([type, info]) => {
                            const hasCustom = templates.some(t => t.type === type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleEditTemplate(type)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${editingType === type
                                        ? `${colorClass(info.color, 'bg')} ${colorClass(info.color, 'border')} ring-2 ring-${info.color}-300`
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{info.icon}</span>
                                            <span className="font-medium text-sm text-gray-900">{info.name}</span>
                                        </div>
                                        {hasCustom && (
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                CUSTOM
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 ml-7">{info.description}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Editor */}
                    <div className="lg:col-span-2">
                        {editingType ? (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Editor header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{DEFAULT_TEMPLATES[editingType].icon}</span>
                                        <h3 className="font-semibold text-gray-900">
                                            {DEFAULT_TEMPLATES[editingType].name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPreviewMode(!previewMode)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            <Eye size={14} />
                                            {previewMode ? 'Código' : 'Vista previa'}
                                        </button>
                                        {templates.some(t => t.type === editingType) && (
                                            <button
                                                onClick={handleResetTemplate}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 size={14} />
                                                Resetear
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                                        >
                                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                            {saveSuccess ? '¡Guardado!' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Info */}
                                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                                        <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>
                                            Usá variables como <code className="bg-blue-100 px-1 rounded">{"{{userName}}"}</code>,{' '}
                                            <code className="bg-blue-100 px-1 rounded">{"{{planName}}"}</code>,{' '}
                                            <code className="bg-blue-100 px-1 rounded">{"{{expiryDate}}"}</code>,{' '}
                                            <code className="bg-blue-100 px-1 rounded">{"{{leadName}}"}</code> en el HTML.
                                            Si dejas los campos vacíos, se usa el email por defecto de ZetaProp.
                                        </span>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto del email</label>
                                        <input
                                            type="text"
                                            value={editSubject}
                                            onChange={e => setEditSubject(e.target.value)}
                                            placeholder="Ej: ¡Bienvenido/a a ZetaProp! 🎉"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    {/* HTML / Preview */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {previewMode ? 'Vista previa' : 'Cuerpo HTML del email'}
                                        </label>
                                        {previewMode ? (
                                            <div
                                                className="border border-gray-200 rounded-xl overflow-auto bg-white"
                                                style={{ minHeight: '300px' }}
                                            >
                                                {editHtml ? (
                                                    <iframe
                                                        srcDoc={editHtml}
                                                        className="w-full h-80 border-0"
                                                        title="Email preview"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
                                                        Ingresá HTML para ver la vista previa
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={editHtml}
                                                onChange={e => setEditHtml(e.target.value)}
                                                placeholder="<html>... Ingresá el HTML del email aquí. Podés dejar vacío para usar el diseño por defecto de ZetaProp.</html>"
                                                rows={12}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                                            />
                                        )}
                                    </div>

                                    {/* Test send */}
                                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                                        <input
                                            type="email"
                                            value={testEmail}
                                            onChange={e => setTestEmail(e.target.value)}
                                            placeholder="Email para prueba"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button
                                            onClick={handleSendTest}
                                            disabled={!testEmail || testSending}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                                        >
                                            {testSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                            Enviar prueba
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-300 text-center p-8">
                                <FileText size={40} className="text-gray-300 mb-3" />
                                <p className="text-gray-500">Seleccioná un template para editarlo</p>
                                <p className="text-gray-400 text-sm mt-1">Si no personalizás ninguno, se usan los diseños por defecto de ZetaProp</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======= HISTORIAL ======= */}
            {activeTab === 'historial' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Historial de Emails Recientes</h2>
                        <span className="text-sm text-gray-500">{logs.length} registros</span>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Cargando historial...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center">
                            <Clock size={36} className="text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No hay emails registrados aún.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinatario</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Asunto</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map((log, i) => {
                                        const info = DEFAULT_TEMPLATES[log.type];
                                        return (
                                            <tr key={log.id || i} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${colorClass(info?.color || 'indigo', 'badge')}`}>
                                                        {info?.icon} {info?.name || log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 max-w-[160px] truncate">{log.to}</td>
                                                <td className="px-6 py-3 text-gray-700 max-w-[200px] truncate">{log.subject}</td>
                                                <td className="px-6 py-3">
                                                    {log.status === 'sent' ? (
                                                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                                            <CheckCircle size={13} /> Enviado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                                                            <XCircle size={13} /> Fallido
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-gray-400 text-xs">
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
