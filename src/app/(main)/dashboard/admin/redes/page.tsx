"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, Clock, FileText, Instagram, RefreshCw, Send } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";

// Admin review of the weekly Instagram carousels: the 100-topic bank in
// publish order, a preview of each draft's slides and the publish action.
// Data comes from admin-only API routes (social_carousels is server-only).

type TopicStatus = "pending" | "draft" | "published";

interface CarouselItem {
    title: string;
    detail: string;
}

interface TopicRow {
    number: number;
    position: number;
    category: string;
    title: string;
    status: TopicStatus;
    carousel: {
        coverTitle: string;
        listHeading: string;
        slides: CarouselItem[][];
        caption: string;
        createdAt: string | null;
        updatedAt: string | null;
        publishedAt: string | null;
        publishError: string | null;
    } | null;
}

const STATUS_LABEL: Record<TopicStatus, string> = {
    pending: "Pendiente",
    draft: "Borrador",
    published: "Publicado",
};

const STATUS_CLASS: Record<TopicStatus, string> = {
    pending: "bg-[var(--color-paper-3)] text-[var(--color-muted)]",
    draft: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    published: "bg-[var(--color-ink)] text-[var(--color-paper)]",
};

const PUBLISH_MESSAGES: Record<string, string> = {
    "not-found": "No existe un borrador para este tema.",
    "already-published": "Este tema ya se publicó. Usá Republicar si querés enviarlo de nuevo.",
    "not-configured": "Falta configurar el webhook de Make (MAKE_SOCIAL_WEBHOOK_URL).",
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return format(new Date(iso), "d 'de' MMMM yyyy, HH:mm", { locale: es });
}

function StatusBadge({ status }: { status: TopicStatus }) {
    return <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export default function AdminSocialCarouselsPage() {
    const { user } = useAuth();
    const [topics, setTopics] = useState<TopicRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number | null>(null);
    const [publishing, setPublishing] = useState(false);

    const fetchTopics = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/admin/social-carousel", { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { topics: TopicRow[] };
            setTopics(data.topics);
            setSelected((current) => {
                if (current !== null) return current;
                const firstDraft = data.topics.find((t) => t.status === "draft");
                const firstPending = data.topics.find((t) => t.status === "pending");
                return (firstDraft ?? firstPending ?? data.topics[0])?.number ?? null;
            });
        } catch (error) {
            console.error("Error loading carousels:", error);
            toast.error("No se pudieron cargar los carruseles");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const current = useMemo(() => topics.find((t) => t.number === selected) ?? null, [topics, selected]);
    const counts = useMemo(
        () => ({
            draft: topics.filter((t) => t.status === "draft").length,
            published: topics.filter((t) => t.status === "published").length,
        }),
        [topics]
    );

    const handlePublish = async (force: boolean) => {
        if (!current?.carousel || !user) return;
        const question = force
            ? `El tema ${current.number} ya se publicó. ¿Querés enviarlo de nuevo a Instagram? Se va a crear otro posteo.`
            : `¿Publicar el carrusel "${current.carousel.coverTitle}" en Instagram?`;
        if (!window.confirm(question)) return;

        setPublishing(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/social-carousel/${current.number}/publish`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(force ? { force: true } : {}),
            });
            const result = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
            if (result.status === "sent") {
                toast.success("Carrusel enviado a Make. Revisá el historial del escenario para confirmar el posteo.");
            } else {
                toast.error(PUBLISH_MESSAGES[result.status ?? ""] ?? `No se pudo publicar: ${result.error ?? `HTTP ${res.status}`}`);
            }
        } catch (error) {
            console.error("Error publishing carousel:", error);
            toast.error("No se pudo publicar el carrusel");
        } finally {
            setPublishing(false);
            fetchTopics();
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const carousel = current?.carousel ?? null;
    const slideCount = carousel ? carousel.slides.length + 2 : 0;
    const version = encodeURIComponent(carousel?.updatedAt ?? carousel?.createdAt ?? "");

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Redes: carruseles de Instagram</h1>
                    <p className="text-[var(--color-muted)]">
                        Un carrusel por semana. El agente deja el borrador del próximo tema; vos lo revisás y lo publicás.
                    </p>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                    {counts.published} publicados · {counts.draft} borradores · {topics.length - counts.published - counts.draft} pendientes
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
                {/* Topic list, in publish order */}
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule-2)] overflow-hidden">
                    <ul className="max-h-[75vh] overflow-y-auto divide-y divide-[var(--color-rule-2)]">
                        {topics.map((topic) => (
                            <li key={topic.number}>
                                <button
                                    onClick={() => setSelected(topic.number)}
                                    className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-[var(--color-paper-3)] ${
                                        topic.number === selected ? "bg-[var(--color-accent-soft)]" : ""
                                    }`}
                                >
                                    <span className="text-xs font-semibold text-[var(--color-muted)] w-8 shrink-0 pt-0.5">#{topic.position}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm text-[var(--color-ink)] leading-snug">{topic.title}</span>
                                        <span className="block text-xs text-[var(--color-muted)] mt-1">
                                            Tema {topic.number} · {topic.category}
                                        </span>
                                    </span>
                                    <StatusBadge status={topic.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Selected topic */}
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule-2)] p-6 space-y-6 min-w-0">
                    {!current ? (
                        <p className="text-[var(--color-muted)]">Elegí un tema de la lista.</p>
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row md:justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-semibold">
                                        {current.category} · Tema {current.number}
                                    </p>
                                    <h2 className="font-heading text-xl font-bold text-[var(--color-ink)] mt-1">{current.title}</h2>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
                                        <StatusBadge status={current.status} />
                                        {carousel && (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock strokeWidth={1.5} className="w-4 h-4" />
                                                Borrador: {formatDate(carousel.updatedAt ?? carousel.createdAt)}
                                            </span>
                                        )}
                                        {carousel?.publishedAt && (
                                            <span className="inline-flex items-center gap-1">
                                                <CheckCircle strokeWidth={1.5} className="w-4 h-4" />
                                                Publicado: {formatDate(carousel.publishedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {carousel && (
                                    <div className="flex gap-2 shrink-0 items-start">
                                        {current.status === "published" ? (
                                            <button
                                                onClick={() => handlePublish(true)}
                                                disabled={publishing}
                                                className="px-4 py-2 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)] text-sm font-medium rounded-lg hover:bg-[var(--color-paper-3)] transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <RefreshCw strokeWidth={1.5} className="w-4 h-4" />
                                                Republicar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handlePublish(false)}
                                                disabled={publishing}
                                                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {publishing ? <Send strokeWidth={1.5} className="w-4 h-4 animate-pulse" /> : <Instagram strokeWidth={1.5} className="w-4 h-4" />}
                                                Publicar en Instagram
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {carousel?.publishError && (
                                <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
                                    Último intento fallido: {carousel.publishError}
                                </div>
                            )}

                            {!carousel ? (
                                <div className="p-10 text-center">
                                    <FileText strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">Todavía no hay borrador</h3>
                                    <p className="text-[var(--color-muted)]">El agente semanal escribe el próximo tema pendiente y aparece acá para revisarlo.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {Array.from({ length: slideCount }, (_, i) => (
                                            // eslint-disable-next-line @next/next/no-img-element -- server-rendered slide, already optimized
                                            <img
                                                key={`${current.number}-${i}-${version}`}
                                                src={`/api/social/carousel/${current.number}/image?slide=${i + 1}&type=jpeg&v=${version}`}
                                                alt={`Slide ${i + 1} de ${slideCount}`}
                                                width={270}
                                                height={338}
                                                loading="lazy"
                                                className="w-[270px] h-[338px] shrink-0 rounded-lg border border-[var(--color-rule-2)] bg-[var(--color-paper-3)]"
                                            />
                                        ))}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-2">Caption</h3>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-2)] bg-[var(--color-paper)] border border-[var(--color-rule-2)] rounded-lg p-4">
                                            {carousel.caption}
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
