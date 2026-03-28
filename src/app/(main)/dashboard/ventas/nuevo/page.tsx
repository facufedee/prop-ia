"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { ventasService } from "@/infrastructure/services/ventasService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ParteVenta, ModalidadComision } from "@/domain/models/Venta";
import { Propietario } from "@/domain/models/Propietario";
import { Lead } from "@/domain/models/Lead";
import { Inquilino } from "@/domain/models/Inquilino";
import { toast } from "sonner";
import {
    ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2,
    Building2, Users, DollarSign, ClipboardList, Search,
    Home, UserCheck, X, ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ── constants ─────────────────────────────────────────────────────────────────

const STEPS = [
    { label: "Propiedad",    icon: Building2 },
    { label: "Partes",       icon: Users },
    { label: "Económico",    icon: DollarSign },
    { label: "Confirmación", icon: ClipboardList },
];

const TIPOS_PROPIEDAD = [
    "Departamento","Casa","PH","Local","Oficina",
    "Terreno","Galpón","Cochera","Quinta","Campo","Hotel","Edificio",
];

const emptyParte = (): ParteVenta => ({ nombre: "", dni: "" });

const getAddress = (p: any): string =>
    p.address ||
    `${p.address_name || ""} ${p.address_number || ""}`.trim() ||
    p.title || "Sin dirección";

// ── helpers ───────────────────────────────────────────────────────────────────

/** Allows only digits */
const onlyDigits = (v: string) => v.replace(/\D/g, "");
/** Allows digits, +, -, spaces, () */
const phoneChars  = (v: string) => v.replace(/[^0-9+\-\s()]/g, "");

// ── component ─────────────────────────────────────────────────────────────────

export default function NuevaVentaPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep]     = useState(0);
    const [saving, setSaving] = useState(false);

    // ── Remote data ───────────────────────────────────────────────────────────
    const [propiedades,  setPropiedades]  = useState<any[]>([]);
    const [propietarios, setPropietarios] = useState<Propietario[]>([]);
    const [leads,        setLeads]        = useState<Lead[]>([]);
    const [inquilinos,   setInquilinos]   = useState<Inquilino[]>([]);
    const [loadingData,  setLoadingData]  = useState(true);

    useEffect(() => {
        if (!user || !db) { setLoadingData(false); return; }
        (async () => {
            setLoadingData(true);
            try {
                const [snap, pData, lData, iData] = await Promise.all([
                    getDocs(query(collection(db!, "properties"), where("userId", "==", user.uid))),
                    propietariosService.getPropietarios(user.uid),
                    leadsService.getLeads(user.uid),
                    inquilinosService.getInquilinos(user.uid),
                ]);
                setPropiedades(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setPropietarios(pData);
                setLeads(lData);
                setInquilinos(iData);
            } catch {
                toast.error("Error al cargar datos del sistema");
            } finally {
                setLoadingData(false);
            }
        })();
    }, [user]);

    // ── Step 0 ────────────────────────────────────────────────────────────────
    const [selectedProp, setSelectedProp] = useState<any | null>(null);
    const [propSearch,   setPropSearch]   = useState("");
    const [manualEntry,  setManualEntry]  = useState(false);
    const [direccion,    setDireccion]    = useState("");
    const [propiedadTipo, setPropiedadTipo] = useState("Departamento");
    const [superficie,   setSuperficie]   = useState("");
    const [nroPartida,   setNroPartida]   = useState("");

    const seleccionarPropiedad = (p: any) => {
        setSelectedProp(p);
        setManualEntry(false);
        setDireccion(getAddress(p));
        setPropiedadTipo(p.property_type || "Departamento");
        setSuperficie(p.floor_area?.toString() || "");
        setPrecioListado(p.price?.toString() || "");
        setMoneda(p.currency === "USD" ? "USD" : "ARS");
        // Pre-fill vendedor from property seller if present
        if (p.seller?.full_name) {
            setVendedores([{
                nombre: p.seller.full_name,
                dni:    "",
                email:  p.seller.email   || "",
                telefono: p.seller.phone || "",
            }]);
        }
    };

    const deseleccionarPropiedad = () => {
        setSelectedProp(null);
        setDireccion("");
        setSuperficie("");
    };

    // ── Step 1 ────────────────────────────────────────────────────────────────
    const [vendedores,   setVendedores]   = useState<ParteVenta[]>([emptyParte()]);
    const [compradores,  setCompradores]  = useState<ParteVenta[]>([emptyParte()]);
    const [compradorTab, setCompradorTab] = useState<"lead" | "inquilino" | "manual">("manual");
    const [compradorSearch,   setCompradorSearch]   = useState("");
    const [propietarioSearch, setPropietarioSearch] = useState("");
    const [showPropietarioList, setShowPropietarioList] = useState(false);
    const [showCompradorList,   setShowCompradorList]   = useState(false);

    const seleccionarPropietario = (p: Propietario) => {
        setVendedores([{ nombre: p.nombre, dni: p.dni, email: p.email, telefono: p.telefono, domicilio: p.domicilio, cuit: p.cuit }]);
        setShowPropietarioList(false);
        setPropietarioSearch("");
    };

    const seleccionarLead = (l: Lead) => {
        setCompradores([{ nombre: l.nombre, dni: "", email: l.email, telefono: l.telefono }]);
        setShowCompradorList(false);
        setCompradorSearch("");
        setCompradorTab("manual");
    };

    const seleccionarInquilino = (i: Inquilino) => {
        setCompradores([{ nombre: i.nombre, dni: i.dni, email: i.email, telefono: i.telefono, domicilio: i.domicilio, cuit: i.cuit }]);
        setShowCompradorList(false);
        setCompradorSearch("");
        setCompradorTab("manual");
    };

    const updateParte = (
        list: ParteVenta[],
        setList: (l: ParteVenta[]) => void,
        idx: number,
        field: keyof ParteVenta,
        val: string
    ) => {
        const next = [...list];
        next[idx] = { ...next[idx], [field]: val };
        setList(next);
    };

    // ── Step 2 ────────────────────────────────────────────────────────────────
    const [precioListado, setPrecioListado] = useState("");
    const [moneda,        setMoneda]        = useState<"ARS" | "USD">("USD");
    const [comisionPct,   setComisionPct]   = useState("3");
    const [modalidad,     setModalidad]     = useState<ModalidadComision>("ambas_partes");
    const [observaciones, setObservaciones] = useState("");

    // ── Validation ────────────────────────────────────────────────────────────
    const canNext = (): boolean => {
        if (step === 0) {
            if (!selectedProp && !manualEntry) return false;
            return direccion.trim().length >= 5;
        }
        if (step === 1) {
            return vendedores[0]?.nombre.trim().length >= 2 &&
                   compradores[0]?.nombre.trim().length >= 2;
        }
        if (step === 2) {
            const p = parseFloat(precioListado);
            const c = parseFloat(comisionPct);
            return p >= 1 && c >= 0.5 && c <= 20;
        }
        return true;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const precio = parseFloat(precioListado);
            const comision = parseFloat(comisionPct) || 3;
            const id = await ventasService.createVenta({
                etapa:            "prospecto",
                fechaEtapaActual: new Date(),
                propiedadId:      selectedProp?.id || "",
                direccion:        direccion.trim(),
                propiedadTipo,
                superficie:       superficie ? Math.abs(parseFloat(superficie)) : undefined,
                nroPartidaInmobiliaria: nroPartida.trim() || undefined,
                precioListado:    precio,
                moneda,
                compradores:      compradores.filter(c => c.nombre.trim()),
                vendedores:       vendedores.filter(v => v.nombre.trim()),
                comisionPorcentaje: comision,
                comisionModalidad:  modalidad,
                comisionMontoBruto: precio * (comision / 100),
                comisionMoneda:     moneda,
                eventos:    [],
                documentos: [],
                estado:     "activo",
                observaciones: observaciones.trim() || undefined,
                userId: user.uid,
            });
            toast.success("Operación creada");
            router.push(`/dashboard/ventas/${id}`);
        } catch {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    // ── Filtered lists ────────────────────────────────────────────────────────
    const propFiltradas = propiedades
        .filter(p =>
            getAddress(p).toLowerCase().includes(propSearch.toLowerCase()) ||
            (p.property_type || "").toLowerCase().includes(propSearch.toLowerCase())
        )
        .slice(0, 20);

    const propietariosFiltrados = propietarios
        .filter(p =>
            p.nombre.toLowerCase().includes(propietarioSearch.toLowerCase()) ||
            (p.dni || "").includes(propietarioSearch)
        )
        .slice(0, 10);

    const leadsFiltrados = leads
        .filter(l =>
            l.nombre.toLowerCase().includes(compradorSearch.toLowerCase()) ||
            (l.email || "").toLowerCase().includes(compradorSearch.toLowerCase())
        )
        .slice(0, 10);

    const inquilinosFiltrados = inquilinos
        .filter(i =>
            i.nombre.toLowerCase().includes(compradorSearch.toLowerCase()) ||
            (i.dni || "").includes(compradorSearch)
        )
        .slice(0, 10);

    const comisionMonto = parseFloat(precioListado) > 0 && parseFloat(comisionPct) > 0
        ? parseFloat(precioListado) * parseFloat(comisionPct) / 100
        : 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto">
            <Link
                href="/dashboard/ventas"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Volver a Ventas
            </Link>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Step indicator */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">Nueva Operación de Venta</h1>
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    i < step  ? "bg-indigo-600 text-white" :
                                    i === step ? "bg-indigo-600 text-white ring-4 ring-indigo-100" :
                                    "bg-gray-100 text-gray-400"
                                }`}>
                                    {i < step ? <Check size={14} /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-indigo-600" : "text-gray-400"}`}>
                                    {s.label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">

                    {/* ── STEP 0 — PROPIEDAD ── */}
                    {step === 0 && (
                        <div className="space-y-4">
                            {loadingData ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                                </div>
                            ) : (
                                <>
                                    {/* Selector de propiedad del sistema */}
                                    {!manualEntry && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Seleccioná una propiedad del sistema
                                                <span className="text-gray-400 font-normal ml-1">({propiedades.length} disponibles)</span>
                                            </label>
                                            <div className="relative mb-2">
                                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por dirección o tipo…"
                                                    value={propSearch}
                                                    onChange={e => setPropSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    maxLength={100}
                                                />
                                            </div>

                                            {propFiltradas.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                                                    No hay propiedades cargadas
                                                </p>
                                            ) : (
                                                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {propFiltradas.map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => seleccionarPropiedad(p)}
                                                            className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                                                selectedProp?.id === p.id
                                                                    ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Home size={14} className="text-indigo-400 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{getAddress(p)}</p>
                                                                    <p className="text-xs text-gray-400">{p.property_type || "—"} · {p.status || "active"}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {p.price ? (
                                                                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                                                        {p.currency} {Number(p.price).toLocaleString("es-AR")}
                                                                    </span>
                                                                ) : null}
                                                                {selectedProp?.id === p.id && <Check size={14} className="text-indigo-600" />}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mt-3">
                                                <Link
                                                    href="/dashboard/propiedades/nueva"
                                                    target="_blank"
                                                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    <Plus size={13} /> Nueva propiedad
                                                    <ExternalLink size={11} />
                                                </Link>
                                                <span className="text-gray-300 text-xs">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { setManualEntry(true); setSelectedProp(null); setDireccion(""); }}
                                                    className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                                                >
                                                    Cargar sin propiedad del sistema
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Campos de la propiedad (seleccionada o manual) */}
                                    {(selectedProp || manualEntry) && (
                                        <div className={`space-y-4 ${selectedProp ? "p-4 bg-gray-50 rounded-xl border border-gray-200" : ""}`}>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    {selectedProp ? "Propiedad seleccionada" : "Datos de la propiedad"}
                                                </p>
                                                {selectedProp ? (
                                                    <button
                                                        type="button"
                                                        onClick={deseleccionarPropiedad}
                                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X size={12} /> Cambiar
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualEntry(false)}
                                                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                                                    >
                                                        <ArrowLeft size={12} /> Ver listado
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Dirección *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={direccion}
                                                    onChange={e => setDireccion(e.target.value)}
                                                    placeholder="Ej: Av. Corrientes 1234, CABA"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    maxLength={200}
                                                    required
                                                />
                                                {direccion.length > 0 && direccion.trim().length < 5 && (
                                                    <p className="text-xs text-red-500 mt-1">Ingresá una dirección válida (mínimo 5 caracteres)</p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                                                    <select
                                                        value={propiedadTipo}
                                                        onChange={e => setPropiedadTipo(e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    >
                                                        {TIPOS_PROPIEDAD.map(t => <option key={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Superficie (m²)</label>
                                                    <input
                                                        type="number"
                                                        value={superficie}
                                                        onChange={e => setSuperficie(e.target.value)}
                                                        placeholder="Ej: 75"
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                        min="1"
                                                        max="99999"
                                                        step="0.01"
                                                        onKeyDown={e => ["-","e","E","+"].includes(e.key) && e.preventDefault()}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Nº Partida Inmobiliaria
                                                    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={nroPartida}
                                                    onChange={e => setNroPartida(e.target.value.replace(/[^a-zA-Z0-9\-\/]/g, ""))}
                                                    placeholder="Ej: 022-12345-6"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    maxLength={50}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 1 — PARTES ── */}
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* VENDEDORES */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Vendedores</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowPropietarioList(v => !v); setPropietarioSearch(""); }}
                                            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            <UserCheck size={13} />
                                            {showPropietarioList ? "Cerrar lista" : "Desde propietario"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVendedores(p => [...p, emptyParte()])}
                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            <Plus size={13} /> Agregar
                                        </button>
                                    </div>
                                </div>

                                {showPropietarioList && (
                                    <div className="mb-4 border border-indigo-200 rounded-xl overflow-hidden">
                                        <div className="p-3 bg-indigo-50/40 border-b border-indigo-100">
                                            <div className="relative">
                                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Buscar propietario por nombre o DNI…"
                                                    value={propietarioSearch}
                                                    onChange={e => setPropietarioSearch(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    maxLength={100}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto bg-white">
                                            {propietariosFiltrados.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-5">Sin propietarios cargados</p>
                                            ) : propietariosFiltrados.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => seleccionarPropietario(p)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                                                        <p className="text-xs text-gray-400">DNI {p.dni} · {p.telefono}</p>
                                                    </div>
                                                    <ArrowRight size={13} className="text-indigo-400 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {vendedores.map((v, i) => (
                                    <ParteForm
                                        key={i}
                                        parte={v}
                                        label={`Vendedor${vendedores.length > 1 ? ` ${i + 1}` : ""}`}
                                        onUpdate={(field, val) => updateParte(vendedores, setVendedores, i, field, val)}
                                        onRemove={i > 0 ? () => setVendedores(p => p.filter((_, j) => j !== i)) : undefined}
                                    />
                                ))}
                            </section>

                            <hr className="border-gray-100" />

                            {/* COMPRADORES */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700">Compradores</h3>
                                    <button
                                        type="button"
                                        onClick={() => setCompradores(p => [...p, emptyParte()])}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        <Plus size={13} /> Agregar
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-3">
                                    {(["lead", "inquilino", "manual"] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => {
                                                setCompradorTab(t);
                                                setShowCompradorList(t !== "manual");
                                                setCompradorSearch("");
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                                                compradorTab === t
                                                    ? "bg-white shadow text-indigo-600"
                                                    : "text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            {t === "lead" ? "Lead" : t === "inquilino" ? "Inquilino" : "Manual"}
                                        </button>
                                    ))}
                                </div>

                                {showCompradorList && compradorTab !== "manual" && (
                                    <div className="mb-4 border border-green-200 rounded-xl overflow-hidden">
                                        <div className="p-3 bg-green-50/30 border-b border-green-100">
                                            <div className="relative">
                                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder={`Buscar ${compradorTab === "lead" ? "lead" : "inquilino"}…`}
                                                    value={compradorSearch}
                                                    onChange={e => setCompradorSearch(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    maxLength={100}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto bg-white">
                                            {compradorTab === "lead" ? (
                                                leadsFiltrados.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-5">Sin leads cargados</p>
                                                ) : leadsFiltrados.map(l => (
                                                    <button
                                                        key={l.id}
                                                        type="button"
                                                        onClick={() => seleccionarLead(l)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{l.nombre}</p>
                                                            <p className="text-xs text-gray-400">{l.email} · {l.telefono}</p>
                                                        </div>
                                                        <ArrowRight size={13} className="text-green-500 flex-shrink-0" />
                                                    </button>
                                                ))
                                            ) : (
                                                inquilinosFiltrados.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-5">Sin inquilinos cargados</p>
                                                ) : inquilinosFiltrados.map(i => (
                                                    <button
                                                        key={i.id}
                                                        type="button"
                                                        onClick={() => seleccionarInquilino(i)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{i.nombre}</p>
                                                            <p className="text-xs text-gray-400">DNI {i.dni} · {i.telefono}</p>
                                                        </div>
                                                        <ArrowRight size={13} className="text-green-500 flex-shrink-0" />
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {compradores.map((c, i) => (
                                    <ParteForm
                                        key={i}
                                        parte={c}
                                        label={`Comprador${compradores.length > 1 ? ` ${i + 1}` : ""}`}
                                        onUpdate={(field, val) => updateParte(compradores, setCompradores, i, field, val)}
                                        onRemove={i > 0 ? () => setCompradores(p => p.filter((_, j) => j !== i)) : undefined}
                                    />
                                ))}
                            </section>
                        </div>
                    )}

                    {/* ── STEP 2 — ECONÓMICO ── */}
                    {step === 2 && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Precio de lista *
                                        {selectedProp?.price && (
                                            <span className="text-xs text-indigo-500 font-normal ml-1">(desde propiedad)</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={precioListado}
                                        onChange={e => setPrecioListado(e.target.value)}
                                        placeholder="Ej: 120000"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        min="1"
                                        max="999999999"
                                        step="1"
                                        required
                                        onKeyDown={e => ["-","e","E","+"].includes(e.key) && e.preventDefault()}
                                    />
                                    {precioListado && parseFloat(precioListado) < 1 && (
                                        <p className="text-xs text-red-500 mt-1">El precio debe ser mayor a 0</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Moneda</label>
                                    <select
                                        value={moneda}
                                        onChange={e => setMoneda(e.target.value as "ARS" | "USD")}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    >
                                        <option value="USD">USD – Dólares</option>
                                        <option value="ARS">ARS – Pesos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Comisión (%) <span className="text-gray-400 font-normal text-xs">0.5 – 20</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={comisionPct}
                                        onChange={e => {
                                            const raw = e.target.value;
                                            if (raw === "" || parseFloat(raw) <= 20) setComisionPct(raw);
                                        }}
                                        step="0.5"
                                        min="0.5"
                                        max="20"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        onKeyDown={e => ["-","e","E","+"].includes(e.key) && e.preventDefault()}
                                    />
                                    {comisionMonto > 0 && (
                                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                                            = {moneda === "USD" ? "USD" : "$"}{" "}
                                            {comisionMonto.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidad comisión</label>
                                    <select
                                        value={modalidad}
                                        onChange={e => setModalidad(e.target.value as ModalidadComision)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    >
                                        <option value="ambas_partes">Ambas partes</option>
                                        <option value="comprador">Solo comprador</option>
                                        <option value="vendedor">Solo vendedor</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Observaciones
                                    <span className="text-xs text-gray-400 font-normal ml-1">
                                        {observaciones.length}/500
                                    </span>
                                </label>
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    rows={3}
                                    placeholder="Notas internas sobre la operación…"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                    maxLength={500}
                                />
                            </div>
                        </>
                    )}

                    {/* ── STEP 3 — CONFIRMACIÓN ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                                <h3 className="font-semibold text-indigo-900">Resumen de la operación</h3>
                                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div><dt className="text-gray-500 inline">Dirección: </dt><dd className="font-medium text-gray-800 inline">{direccion}</dd></div>
                                    <div><dt className="text-gray-500 inline">Tipo: </dt><dd className="font-medium text-gray-800 inline">{propiedadTipo}</dd></div>
                                    {superficie && <div><dt className="text-gray-500 inline">Superficie: </dt><dd className="font-medium text-gray-800 inline">{superficie} m²</dd></div>}
                                    <div><dt className="text-gray-500 inline">Vendedor: </dt><dd className="font-medium text-gray-800 inline">{vendedores[0]?.nombre}</dd></div>
                                    <div><dt className="text-gray-500 inline">Comprador: </dt><dd className="font-medium text-gray-800 inline">{compradores[0]?.nombre}</dd></div>
                                    <div><dt className="text-gray-500 inline">Precio: </dt><dd className="font-bold text-indigo-700 inline">{moneda} {parseFloat(precioListado).toLocaleString("es-AR")}</dd></div>
                                    <div><dt className="text-gray-500 inline">Comisión: </dt><dd className="font-medium text-gray-800 inline">{comisionPct}% — {modalidad.replace(/_/g, " ")}</dd></div>
                                    {selectedProp && (
                                        <div className="col-span-2">
                                            <dt className="text-gray-500 inline">Propiedad vinculada: </dt>
                                            <dd className="inline text-xs text-indigo-600 font-medium">✓ {getAddress(selectedProp)}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            <p className="text-sm text-gray-500">
                                La operación se creará en etapa <strong>Prospecto</strong>. Podés completar todos los datos desde el detalle.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer nav */}
                <div className="px-6 pb-6 flex justify-between border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft size={15} /> Anterior
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Siguiente <ArrowRight size={15} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            Crear Operación
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── ParteForm ─────────────────────────────────────────────────────────────────

interface ParteFormProps {
    parte: ParteVenta;
    label: string;
    onUpdate: (field: keyof ParteVenta, val: string) => void;
    onRemove?: () => void;
}

function ParteForm({ parte, label, onUpdate, onRemove }: ParteFormProps) {
    return (
        <div className="relative grid grid-cols-2 gap-3 mb-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={13} />
                </button>
            )}
            <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>

            <input
                placeholder="Nombre completo *"
                value={parte.nombre}
                onChange={e => onUpdate("nombre", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={100}
                required
            />
            <input
                placeholder="DNI (solo números)"
                inputMode="numeric"
                value={parte.dni}
                onChange={e => onUpdate("dni", e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={8}
                pattern="[0-9]*"
            />
            <input
                placeholder="Email"
                type="email"
                value={parte.email ?? ""}
                onChange={e => onUpdate("email", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={100}
            />
            <input
                placeholder="Teléfono"
                type="tel"
                value={parte.telefono ?? ""}
                onChange={e => onUpdate("telefono", phoneChars(e.target.value).slice(0, 20))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={20}
            />
            <input
                placeholder="CUIT (sin guiones)"
                inputMode="numeric"
                value={parte.cuit ?? ""}
                onChange={e => onUpdate("cuit", e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={11}
            />
            <input
                placeholder="Domicilio"
                value={parte.domicilio ?? ""}
                onChange={e => onUpdate("domicilio", e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={150}
            />
        </div>
    );
}
