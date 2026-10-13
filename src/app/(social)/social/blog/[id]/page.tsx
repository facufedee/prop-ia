"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";
import { BlogPost } from "@/infrastructure/services/blogService";
import { Loader2, ArrowLeft, Download, Copy, Link as LinkIcon, ImageIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/ui/context/AuthContext";
import { buildInstagramCaption, buildLinkedInCaption } from "@/lib/social/blogCaptions";
import { announceMessage, requestAnnounce } from "@/lib/social/requestAnnounce";

type Format = "instagram" | "square" | "linkedin";

const FORMATS: { id: Format; label: string; hint: string; ratio: string }[] = [
    { id: "instagram", label: "Instagram", hint: "4:5 · 1080×1350", ratio: "1080 / 1350" },
    { id: "square", label: "Instagram", hint: "Cuadrado · 1080×1080", ratio: "1 / 1" },
    { id: "linkedin", label: "LinkedIn", hint: "1200×627", ratio: "1200 / 627" },
];

const TITLE_MAX = 120;

type SocialPost = BlogPost & { socialAnnouncedAt?: Timestamp };

export default function SocialGeneratorPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [post, setPost] = useState<SocialPost | null>(null);
    const [announcedAt, setAnnouncedAt] = useState<Date | null>(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [format, setFormat] = useState<Format>("instagram");
    const [titleInput, setTitleInput] = useState("");
    const [title, setTitle] = useState("");
    const [imageLoading, setImageLoading] = useState(true);
    const [origin, setOrigin] = useState("");

    useEffect(() => {
        setOrigin(window.location.origin);
        const fetchPost = async () => {
            if (!id || !db) return;
            try {
                const snap = await getDoc(doc(db, "blog_posts", id));
                if (snap.exists()) {
                    const data = { id: snap.id, ...snap.data() } as SocialPost;
                    setPost(data);
                    setAnnouncedAt(data.socialAnnouncedAt?.toDate?.() ?? null);
                    setTitleInput(data.title);
                    setTitle(data.title);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    // Debounce the title override so the image is not re-rendered on every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => setTitle(titleInput.trim()), 600);
        return () => clearTimeout(timer);
    }, [titleInput]);

    const imagePath = useMemo(() => {
        const params = new URLSearchParams({ format });
        if (post && title && title !== post.title) params.set("title", title.slice(0, TITLE_MAX));
        return `/api/social/blog/${id}/image?${params.toString()}`;
    }, [format, title, post, id]);

    useEffect(() => setImageLoading(true), [imagePath]);

    const suggestedCopy = useMemo(() => {
        if (!post) return "";
        return format === "linkedin"
            ? buildLinkedInCaption(post, `https://zetaprop.com.ar/blog/${post.slug}`)
            : buildInstagramCaption(post);
    }, [post, format]);
    const current = FORMATS.find((f) => f.id === format)!;

    const copy = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(message);
        } catch {
            toast.error("No se pudo copiar. Probá de nuevo.");
        }
    };

    // Re-sends the post to the Make.com scenario (Instagram + LinkedIn).
    const handleAnnounce = async () => {
        if (!user || !post?.id || sending) return;
        const ask = announcedAt
            ? "Esta nota ya se envió a redes. ¿Querés volver a publicarla en Instagram y LinkedIn?"
            : "¿Querés publicar esta nota en Instagram y LinkedIn ahora?";
        if (!window.confirm(ask)) return;
        setSending(true);
        try {
            const result = await requestAnnounce(post.id, await user.getIdToken(), true);
            const { kind, text } = announceMessage(result);
            toast[kind](text);
            if (result.status === "sent") setAnnouncedAt(new Date());
        } catch {
            toast.error(announceMessage({ status: "failed" }).text);
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async () => {
        toast.loading("Generando imagen...", { id: "download" });
        try {
            const res = await fetch(imagePath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const href = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = href;
            link.download = `ZetaProp_${format}_${post?.slug || id}.png`;
            link.click();
            URL.revokeObjectURL(href);
            toast.success("Imagen descargada", { id: "download" });
        } catch (error) {
            console.error("Error downloading image:", error);
            toast.error("No se pudo descargar la imagen. Probá de nuevo.", { id: "download" });
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#110f0d]">
                <Loader2 className="w-10 h-10 animate-spin text-[#a8a198]" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#110f0d] text-[#a8a198]">
                No encontramos la nota.
            </div>
        );
    }

    const label = "text-xs font-semibold text-[#a8a198] uppercase tracking-[0.14em]";
    const panel = "rounded-xl border border-white/10 bg-white/[0.03] p-4";

    return (
        <div className="min-h-screen bg-[#110f0d] text-[#f3efe9] flex flex-col lg:flex-row">
            {/* Controls */}
            <aside className="lg:w-96 lg:h-screen lg:sticky lg:top-0 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#161310]">
                <div className="px-6 py-5 border-b border-white/10 flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-[#a8a198] hover:text-[#f3efe9] transition" aria-label="Volver">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-semibold text-lg">
                        Generador <span className="text-[#d4a76a]">RRSS</span>
                    </h1>
                </div>

                <div className="p-6 flex-1 space-y-7 lg:overflow-y-auto">
                    <section className="space-y-3">
                        <h2 className={label}>Formato</h2>
                        <div className="grid grid-cols-3 gap-2">
                            {FORMATS.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFormat(f.id)}
                                    className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition ${format === f.id
                                        ? "border-[#d4a76a] bg-[#d4a76a]/10 text-[#f3efe9]"
                                        : "border-white/10 text-[#a8a198] hover:border-white/25"
                                        }`}
                                >
                                    <span className="text-sm font-medium">{f.label}</span>
                                    <span className="text-[10px] leading-tight">{f.hint}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className={label}>Título</h2>
                        <textarea
                            value={titleInput}
                            maxLength={TITLE_MAX}
                            onChange={(e) => setTitleInput(e.target.value)}
                            className="w-full h-24 resize-none rounded-lg border border-white/10 bg-[#110f0d] p-3 text-sm text-[#f3efe9] outline-none focus:border-[#d4a76a]"
                        />
                        <div className="flex justify-between text-[11px] text-[#a8a198]">
                            <span>{titleInput.length}/{TITLE_MAX}</span>
                            {titleInput.length > 70 && <span className="text-[#d4a76a]">Más corto se lee mejor</span>}
                        </div>
                    </section>

                    <section className={panel}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className={label}>Copy sugerido · {format === "linkedin" ? "LinkedIn" : "Instagram"}</h2>
                            <button
                                onClick={() => copy(suggestedCopy, "Copy copiado al portapapeles")}
                                className="flex items-center gap-1 text-xs font-medium text-[#d4a76a] hover:text-[#f3efe9] transition"
                            >
                                <Copy size={12} /> Copiar texto
                            </button>
                        </div>
                        <p className="text-sm leading-relaxed text-[#f3efe9]/90 whitespace-pre-wrap">{suggestedCopy}</p>
                    </section>

                    <section className={`${panel} flex items-center justify-between gap-3`}>
                        <div className="min-w-0">
                            <h2 className={`${label} mb-1`}>Link de la nota</h2>
                            <p className="text-sm truncate font-mono">zetaprop.com.ar/blog/{post.slug}</p>
                        </div>
                        <button
                            onClick={() => copy(`https://zetaprop.com.ar/blog/${post.slug}`, "Link copiado al portapapeles")}
                            className="p-2 rounded-lg text-[#a8a198] hover:text-[#d4a76a] hover:bg-white/5 transition"
                            title="Copiar link de la nota"
                        >
                            <LinkIcon size={18} />
                        </button>
                    </section>
                </div>

                <div className="p-6 border-t border-white/10 space-y-2">
                    {user && (
                        <div className="pb-2">
                            <button
                                onClick={handleAnnounce}
                                disabled={sending}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#d4a76a] py-3 text-sm font-semibold text-[#d4a76a] hover:bg-[#d4a76a]/10 transition disabled:opacity-60"
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {sending ? "Enviando..." : "Enviar a redes ahora"}
                            </button>
                            {announcedAt && (
                                <p className="mt-2 text-center text-[11px] text-[#a8a198]">
                                    Ya enviado el {announcedAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                                </p>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d4a76a] py-3.5 font-semibold text-[#110f0d] hover:bg-[#e0b97f] transition"
                    >
                        <Download size={18} /> Descargar
                    </button>
                    <button
                        onClick={() => copy(`${origin}${imagePath}`, "Link de la imagen copiado")}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-medium text-[#f3efe9] hover:border-[#d4a76a] transition"
                    >
                        <ImageIcon size={16} /> Copiar link de la imagen
                    </button>
                </div>
            </aside>

            {/* Preview */}
            <main className="flex-1 flex items-center justify-center p-6 lg:p-10">
                <div
                    className="relative w-full max-h-[calc(100vh-5rem)] rounded-md overflow-hidden border border-white/10 shadow-2xl bg-[#161310]"
                    style={{ aspectRatio: current.ratio, maxWidth: `min(100%, calc((100vh - 5rem) * ${current.ratio}))` }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imagePath}
                        alt={`Vista previa ${current.label} ${current.hint}`}
                        className="w-full h-full object-contain"
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    />
                    {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#110f0d]/60">
                            <Loader2 className="w-8 h-8 animate-spin text-[#d4a76a]" />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
