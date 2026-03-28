"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ventasService } from "@/infrastructure/services/ventasService";
import { VentaOperacion, VentaEtapa, ETAPA_CONFIG, ETAPAS_ACTIVAS } from "@/domain/models/Venta";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowLeft, Loader2, ChevronDown, Building2, Users, DollarSign,
    FileText, Clock, Check, X, Edit2, Save, Plus, MessageSquare,
    Phone, Mail, Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "resumen" | "sena" | "escritura" | "eventos";

const toDate = (v: any): Date | null => {
    if (!v) return null;
    if (typeof v.toDate === "function") return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const fmt = (d: Date | null | undefined) => d ? format(d, "dd/MM/yyyy", { locale: es }) : "—";
const fmtMonto = (n: number | undefined, m: "ARS" | "USD") =>
    n ? `${m === "USD" ? "USD" : "$"} ${n.toLocaleString("es-AR")}` : "—";

export default function VentaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [venta, setVenta] = useState<VentaOperacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("resumen");
    const [etapaOpen, setEtapaOpen]       = useState(false);
    const [updatingEtapa, setUpdatingEtapa] = useState(false);
    const [propModal, setPropModal]         = useState(false);

    // Nuevo evento
    const [nuevoEvento, setNuevoEvento] = useState("");
    const [tipoEvento, setTipoEvento] = useState<"nota" | "llamada" | "visita" | "otro">("nota");
    const [guardandoEvento, setGuardandoEvento] = useState(false);

    const cargar = async () => {
        setLoading(true);
        try {
            const data = await ventasService.getVentaById(id);
            if (!data) { router.push("/dashboard/ventas"); return; }
            setVenta(data);
        } catch {
            toast.error("Error al cargar la operación");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, [id]);

    const cambiarEtapa = (etapa: VentaEtapa) => {
        if (!venta) return;
        setEtapaOpen(false);
        // If closing and there's a linked property, ask about portal status first
        if (etapa === "cerrada" && venta.propiedadId) {
            setPropModal(true);
            // store the pending etapa in a ref-like state via a temp state trick:
            // we'll call ejecutarCambioEtapa from the modal buttons
            (window as any).__pendingEtapa = etapa;
            return;
        }
        ejecutarCambioEtapa(etapa, null);
    };

    const ejecutarCambioEtapa = async (
        etapa: VentaEtapa,
        propStatus: "sold" | "inactive" | null
    ) => {
        if (!venta) return;
        setPropModal(false);
        setUpdatingEtapa(true);
        try {
            if (propStatus && venta.propiedadId) {
                await ventasService.updatePropertyStatus(venta.propiedadId, propStatus);
            }
            await ventasService.actualizarEtapa(venta.id, etapa);
            setVenta(v => v ? { ...v, etapa, estado: etapa === "cerrada" ? "cerrado" : etapa === "caida" ? "caido" : "activo" } : v);
            toast.success(`Etapa actualizada: ${ETAPA_CONFIG[etapa].label}`);
        } catch {
            toast.error("Error al actualizar etapa");
        } finally {
            setUpdatingEtapa(false);
        }
    };

    const agregarEvento = async () => {
        if (!venta || !nuevoEvento.trim()) return;
        setGuardandoEvento(true);
        try {
            await ventasService.agregarEvento(venta.id, {
                tipo: tipoEvento,
                descripcion: nuevoEvento.trim(),
                fecha: new Date(),
            });
            setNuevoEvento("");
            await cargar();
            toast.success("Evento registrado");
        } catch {
            toast.error("Error al guardar evento");
        } finally {
            setGuardandoEvento(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
    );
    if (!venta) return null;

    const etapaCfg = ETAPA_CONFIG[venta.etapa];
    const todasEtapas: VentaEtapa[] = [...ETAPAS_ACTIVAS, "cerrada", "caida"];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/ventas" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={18} className="text-gray-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-gray-900">{venta.direccion}</h1>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${etapaCfg.bg} ${etapaCfg.color}`}>
                                {etapaCfg.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {venta.propiedadTipo} · Creada el {fmt(venta.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Cambiar etapa */}
                <div className="relative">
                    <button
                        onClick={() => setEtapaOpen(o => !o)}
                        disabled={updatingEtapa}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-60"
                    >
                        {updatingEtapa ? <Loader2 size={14} className="animate-spin" /> : null}
                        Cambiar Etapa <ChevronDown size={14} className={cn("transition-transform", etapaOpen && "rotate-180")} />
                    </button>
                    {etapaOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                            {todasEtapas.map(e => (
                                <button
                                    key={e}
                                    onClick={() => cambiarEtapa(e)}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors",
                                        venta.etapa === e && "font-semibold text-indigo-600"
                                    )}
                                >
                                    <span>{ETAPA_CONFIG[e].label}</span>
                                    {venta.etapa === e && <Check size={14} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {([
                    { id: "resumen",   label: "Resumen",    icon: Building2 },
                    { id: "sena",      label: "Seña",       icon: DollarSign },
                    { id: "escritura", label: "Escritura",  icon: FileText },
                    { id: "eventos",   label: "Historial",  icon: Clock },
                ] as { id: Tab; label: string; icon: any }[]).map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            tab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

                {/* ── Resumen ── */}
                {tab === "resumen" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Propiedad</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-500">Tipo</dt><dd className="font-medium text-gray-800">{venta.propiedadTipo}</dd></div>
                                {venta.superficie && <div className="flex justify-between"><dt className="text-gray-500">Superficie</dt><dd className="font-medium text-gray-800">{venta.superficie} m²</dd></div>}
                                {venta.nroPartidaInmobiliaria && <div className="flex justify-between"><dt className="text-gray-500">Partida</dt><dd className="font-medium text-gray-800">{venta.nroPartidaInmobiliaria}</dd></div>}
                            </dl>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Precio</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-500">Precio lista</dt><dd className="font-bold text-gray-900">{fmtMonto(venta.precioListado, venta.moneda)}</dd></div>
                                {venta.precioAcordado && <div className="flex justify-between"><dt className="text-gray-500">Precio acordado</dt><dd className="font-bold text-green-700">{fmtMonto(venta.precioAcordado, venta.moneda)}</dd></div>}
                                <div className="flex justify-between"><dt className="text-gray-500">Comisión</dt><dd className="font-medium text-gray-800">{venta.comisionPorcentaje}% ({venta.comisionModalidad.replace("_"," ")})</dd></div>
                                {venta.comisionMontoBruto && <div className="flex justify-between"><dt className="text-gray-500">Monto comisión</dt><dd className="font-bold text-indigo-700">{fmtMonto(venta.comisionMontoBruto, venta.comisionMoneda ?? venta.moneda)}</dd></div>}
                            </dl>
                        </div>

                        {venta.compradores.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Compradores</h3>
                                {venta.compradores.map((c, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-xl mb-2 text-sm">
                                        <p className="font-semibold text-gray-800">{c.nombre}</p>
                                        <p className="text-gray-500">DNI: {c.dni}</p>
                                        {c.email && <p className="text-gray-500">{c.email}</p>}
                                        {c.telefono && <p className="text-gray-500">{c.telefono}</p>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {venta.vendedores.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vendedores</h3>
                                {venta.vendedores.map((v, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-xl mb-2 text-sm">
                                        <p className="font-semibold text-gray-800">{v.nombre}</p>
                                        <p className="text-gray-500">DNI: {v.dni}</p>
                                        {v.email && <p className="text-gray-500">{v.email}</p>}
                                        {v.telefono && <p className="text-gray-500">{v.telefono}</p>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {venta.observaciones && (
                            <div className="md:col-span-2">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Observaciones</h3>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{venta.observaciones}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Seña ── */}
                {tab === "sena" && (
                    <SeñaTab venta={venta} onUpdate={cargar} />
                )}

                {/* ── Escritura ── */}
                {tab === "escritura" && (
                    <EscrituraTab venta={venta} onUpdate={cargar} />
                )}

                {/* ── Eventos ── */}
                {tab === "eventos" && (
                    <div className="space-y-4">
                        {/* New event form */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex gap-3">
                                <select
                                    value={tipoEvento}
                                    onChange={e => setTipoEvento(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                >
                                    <option value="nota">Nota</option>
                                    <option value="llamada">Llamada</option>
                                    <option value="visita">Visita</option>
                                    <option value="otro">Otro</option>
                                </select>
                                <input
                                    value={nuevoEvento}
                                    onChange={e => setNuevoEvento(e.target.value)}
                                    placeholder="Descripción del evento…"
                                    onKeyDown={e => e.key === "Enter" && agregarEvento()}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    onClick={agregarEvento}
                                    disabled={!nuevoEvento.trim() || guardandoEvento}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5"
                                >
                                    {guardandoEvento ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        {venta.eventos.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">Sin eventos registrados</p>
                        ) : (
                            <div className="space-y-3">
                                {[...venta.eventos].reverse().map(ev => (
                                    <div key={ev.id} className="flex gap-3 items-start">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                                            ev.tipo === "estado"   ? "bg-indigo-100 text-indigo-600" :
                                            ev.tipo === "llamada"  ? "bg-green-100 text-green-600"  :
                                            ev.tipo === "visita"   ? "bg-amber-100 text-amber-600"  :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {ev.tipo === "llamada" ? <Phone size={13} /> :
                                             ev.tipo === "visita"  ? <Calendar size={13} /> :
                                             ev.tipo === "estado"  ? <Check size={13} /> :
                                             <MessageSquare size={13} />}
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-xl p-3">
                                            <p className="text-sm text-gray-700">{ev.descripcion}</p>
                                            <p className="text-xs text-gray-400 mt-1">{fmt(toDate(ev.fecha))}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Modal: propiedad vendida ── */}
            {propModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Check size={18} className="text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Operación cerrada</h3>
                                <p className="text-sm text-gray-500">¿Qué hacemos con la propiedad en el portal?</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => ejecutarCambioEtapa("cerrada", "sold")}
                                className="w-full text-left px-4 py-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                            >
                                <p className="text-sm font-semibold text-green-800">Marcar como Vendida</p>
                                <p className="text-xs text-green-600 mt-0.5">Sigue visible en el portal con estado "Vendida"</p>
                            </button>
                            <button
                                onClick={() => ejecutarCambioEtapa("cerrada", "inactive")}
                                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <p className="text-sm font-semibold text-gray-800">Retirar del portal</p>
                                <p className="text-xs text-gray-500 mt-0.5">La propiedad deja de mostrarse públicamente</p>
                            </button>
                            <button
                                onClick={() => ejecutarCambioEtapa("cerrada", null)}
                                className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <p className="text-sm text-gray-600">No cambiar el estado del portal</p>
                            </button>
                        </div>
                        <button
                            onClick={() => setPropModal(false)}
                            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 pt-1"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SeñaTab({ venta, onUpdate }: { venta: VentaOperacion; onUpdate: () => void }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const s = venta.seña;
    const [monto, setMonto]    = useState(s?.monto?.toString() ?? "");
    const [moneda, setMoneda]  = useState<"ARS" | "USD">(s?.moneda ?? "USD");
    const [fecha, setFecha]    = useState(s?.fecha ? format(s.fecha, "yyyy-MM-dd") : "");
    const [metodo, setMetodo]  = useState(s?.metodoPago ?? "transferencia");
    const [nroComp, setNroComp] = useState(s?.nroComprobante ?? "");
    const [boleto, setBoleto]  = useState(venta.fechaBoleto ? format(venta.fechaBoleto, "yyyy-MM-dd") : "");
    const [coti, setCoti]      = useState(venta.cotiNumero ?? "");

    const guardar = async () => {
        setSaving(true);
        try {
            await ventasService.updateVenta(venta.id, {
                seña: monto ? { monto: parseFloat(monto), moneda, fecha: new Date(fecha), metodoPago: metodo as any, nroComprobante: nroComp || undefined } : undefined,
                fechaBoleto: boleto ? new Date(boleto) : undefined,
                cotiNumero: coti || undefined,
            });
            toast.success("Guardado");
            setEditing(false);
            onUpdate();
        } catch {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) return (
        <div className="space-y-4">
            <div className="flex justify-end"><button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"><Edit2 size={14} /> Editar</button></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Monto seña:</span> <span className="font-bold text-gray-800 ml-1">{s ? `${s.moneda === "USD" ? "USD" : "$"} ${s.monto.toLocaleString("es-AR")}` : "—"}</span></div>
                <div><span className="text-gray-500">Fecha:</span> <span className="font-medium text-gray-800 ml-1">{s?.fecha ? format(s.fecha, "dd/MM/yyyy") : "—"}</span></div>
                <div><span className="text-gray-500">Método:</span> <span className="font-medium text-gray-800 ml-1 capitalize">{s?.metodoPago ?? "—"}</span></div>
                <div><span className="text-gray-500">Comprobante:</span> <span className="font-medium text-gray-800 ml-1">{s?.nroComprobante ?? "—"}</span></div>
                <div><span className="text-gray-500">Fecha boleto:</span> <span className="font-medium text-gray-800 ml-1">{venta.fechaBoleto ? format(venta.fechaBoleto, "dd/MM/yyyy") : "—"}</span></div>
                <div><span className="text-gray-500">Nº COTI:</span> <span className="font-medium text-gray-800 ml-1">{venta.cotiNumero ?? "—"}</span></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Monto seña</label><input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label><select value={moneda} onChange={e => setMoneda(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha seña</label><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Método de pago</label><select value={metodo} onChange={e => setMetodo(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="cheque">Cheque</option></select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nº Comprobante</label><input type="text" value={nroComp} onChange={e => setNroComp(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha boleto</label><input type="date" value={boleto} onChange={e => setBoleto(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Nº COTI</label><input type="text" value={coti} onChange={e => setCoti(e.target.value)} placeholder="Código COTI (AFIP)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={guardar} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
                </button>
            </div>
        </div>
    );
}

function EscrituraTab({ venta, onUpdate }: { venta: VentaOperacion; onUpdate: () => void }) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving]   = useState(false);
    const e = venta.escritura;
    const [escribano, setEscribano]   = useState(e?.escribanoNombre ?? "");
    const [registro, setRegistro]     = useState(e?.escribanoRegistro ?? "");
    const [fechaPrev, setFechaPrev]   = useState(e?.fechaPrevista ? format(e.fechaPrevista, "yyyy-MM-dd") : "");
    const [fechaReal, setFechaReal]   = useState(e?.fechaRealizada ? format(e.fechaRealizada, "yyyy-MM-dd") : "");
    const [nroEsc, setNroEsc]         = useState(e?.nroEscritura ?? "");
    const [precioAcordado, setPrecioAcordado] = useState(venta.precioAcordado?.toString() ?? "");

    const guardar = async () => {
        setSaving(true);
        try {
            await ventasService.updateVenta(venta.id, {
                escritura: {
                    escribanoNombre:    escribano || undefined,
                    escribanoRegistro:  registro  || undefined,
                    fechaPrevista:      fechaPrev ? new Date(fechaPrev) : undefined,
                    fechaRealizada:     fechaReal ? new Date(fechaReal) : undefined,
                    nroEscritura:       nroEsc    || undefined,
                },
                precioAcordado: precioAcordado ? parseFloat(precioAcordado) : undefined,
            });
            toast.success("Guardado");
            setEditing(false);
            onUpdate();
        } catch {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    if (!editing) return (
        <div className="space-y-4">
            <div className="flex justify-end"><button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"><Edit2 size={14} /> Editar</button></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Escribano:</span> <span className="font-medium text-gray-800 ml-1">{e?.escribanoNombre ?? "—"}</span></div>
                <div><span className="text-gray-500">Registro:</span> <span className="font-medium text-gray-800 ml-1">{e?.escribanoRegistro ?? "—"}</span></div>
                <div><span className="text-gray-500">Fecha prevista:</span> <span className="font-medium text-gray-800 ml-1">{e?.fechaPrevista ? format(e.fechaPrevista, "dd/MM/yyyy") : "—"}</span></div>
                <div><span className="text-gray-500">Fecha realizada:</span> <span className="font-medium text-green-700 ml-1 font-bold">{e?.fechaRealizada ? format(e.fechaRealizada, "dd/MM/yyyy") : "—"}</span></div>
                <div><span className="text-gray-500">Nº Escritura:</span> <span className="font-medium text-gray-800 ml-1">{e?.nroEscritura ?? "—"}</span></div>
                <div><span className="text-gray-500">Precio acordado:</span> <span className="font-bold text-green-700 ml-1">{venta.precioAcordado ? `${venta.moneda === "USD" ? "USD" : "$"} ${venta.precioAcordado.toLocaleString("es-AR")}` : "—"}</span></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Escribano</label><input type="text" value={escribano} onChange={e => setEscribano(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Registro Notarial</label><input type="text" value={registro} onChange={e => setRegistro(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha prevista</label><input type="date" value={fechaPrev} onChange={e => setFechaPrev(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Fecha realizada</label><input type="date" value={fechaReal} onChange={e => setFechaReal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Nº Escritura</label><input type="text" value={nroEsc} onChange={e => setNroEsc(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Precio acordado ({venta.moneda})</label><input type="number" value={precioAcordado} onChange={e => setPrecioAcordado(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={guardar} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
                </button>
            </div>
        </div>
    );
}
