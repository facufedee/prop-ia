"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";
import { BlogPost } from "@/infrastructure/services/blogService";
import { Loader2, ArrowLeft, Download, Instagram, Linkedin, Type, Save, Link as LinkIcon } from "lucide-react";
import html2canvas from "html2canvas";
import InstagramCanvas from "@/ui/components/social/InstagramCanvas";
import LinkedInCanvas from "@/ui/components/social/LinkedInCanvas";
import { toast } from "sonner";

export default function SocialGeneratorPage() {
    const { id } = useParams();
    const router = useRouter();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [platform, setPlatform] = useState<"instagram" | "linkedin">("instagram");

    // Customization State
    const [customTitle, setCustomTitle] = useState("");
    const [showEdit, setShowEdit] = useState(false);

    // Canvas Ref
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id || !db) return;
            try {
                const docRef = doc(db, "blog_posts", id as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as BlogPost;
                    setPost(data);
                    setCustomTitle(data.title);
                }
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const handleDownload = async () => {
        if (!canvasRef.current) return;

        try {
            toast.loading("Generando imagen...", { id: "generating" });

            // Wait a bit for images to be fully ready or fonts to load (safer)
            await new Promise(resolve => setTimeout(resolve, 1000));

            const canvas = await html2canvas(canvasRef.current, {
                useCORS: true, // Critical for external images (Firebase Storage)
                scale: 2, // Retinal quality
                backgroundColor: null,
            });

            const image = canvas.toDataURL("image/png");

            // Create download link
            const link = document.createElement("a");
            link.href = image;
            link.download = `ZetaProp_${platform}_${post?.slug || "social"}.png`;
            link.click();

            toast.success("Imagen descargada con éxito", { id: "generating" });
        } catch (error) {
            console.error("Error generating image:", error);
            toast.error("Error al generar la imagen. Intentá de nuevo.", { id: "generating" });
        }
    };

    const generateMagicCopy = () => {
        // Mock AI Generation logic requested in specs
        if (!post) return;

        if (platform === "instagram") {
            setCustomTitle(post.title.length > 50 ? post.title.substring(0, 47) + "..." : post.title);
            toast.success("Título optimizado para Instagram");
        } else {
            setCustomTitle(post.title); // LinkedIn usually keeps full professional title
            toast.success("Título optimizado para LinkedIn");
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col z-10 shadow-xl">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-bold text-lg text-gray-900">Generador RRSS</h1>
                </div>

                <div className="p-6 flex-1 space-y-8 overflow-y-auto">

                    {/* Platform Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Plataforma</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPlatform("instagram")}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${platform === "instagram"
                                    ? "border-pink-500 bg-pink-50 text-pink-700"
                                    : "border-gray-100 hover:border-gray-200 text-gray-500"
                                    }`}
                            >
                                <Instagram size={24} />
                                <span className="text-sm font-medium">Instagram</span>
                            </button>
                            <button
                                onClick={() => setPlatform("linkedin")}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${platform === "linkedin"
                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                    : "border-gray-100 hover:border-gray-200 text-gray-500"
                                    }`}
                            >
                                <Linkedin size={24} />
                                <span className="text-sm font-medium">LinkedIn</span>
                            </button>
                        </div>
                    </div>

                    {/* Text Editor */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personalización</label>
                            <button
                                onClick={generateMagicCopy}
                                className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
                            >
                                <SparklesIcon /> Auto-Generar
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Título</label>
                                <textarea
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:ring-2 focus:ring-black outline-none resize-none h-24"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400">{customTitle.length} caracteres</span>
                                    {platform === "instagram" && customTitle.length > 50 && (
                                        <span className="text-[10px] text-amber-500 font-medium">Recomendado: 50 máx</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copy Helper */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2">Copy Sugerido ({platform === 'instagram' ? 'IG' : 'LI'})</h4>
                        <p className="text-sm text-indigo-900 leading-relaxed font-mono bg-white/50 p-2 rounded border border-indigo-100/50">
                            {platform === "instagram"
                                ? `🔥 ${post.title}\n\n${post.excerpt || post.content.substring(0, 100) + "..."}\n\n👇 Leé más en el link de la bio.\n\n#Inmobiliaria #RealEstate #Propiedades #${post.category || "Novedades"}`
                                : `📢 ${post.title}\n\n${post.excerpt || post.content.substring(0, 150) + "..."}\n\nCompartimos nuestro último análisis sobre el sector. Conocé los detalles en el artículo completo 👇\n\n#RealEstate #MercadoInmobiliario #Negocio`
                            }
                        </p>
                        <button
                            className="mt-2 text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"
                            onClick={() => {
                                const text = platform === "instagram"
                                    ? `🔥 ${post.title}\n\n${post.excerpt || post.content.substring(0, 100) + "..."}\n\n👇 Leé más en el link de la bio.\n\n#Inmobiliaria #RealEstate #Propiedades #${post.category || "Novedades"}`
                                    : `📢 ${post.title}\n\n${post.excerpt || post.content.substring(0, 150) + "..."}\n\nCompartimos nuestro último análisis sobre el sector. Conocé los detalles en el artículo completo 👇\n\n#RealEstate #MercadoInmobiliario #Negocio`;
                                navigator.clipboard.writeText(text);
                                toast.success("Copy copiado al portapapeles");
                            }}
                        >
                            <CopyIcon /> Copiar Texto
                        </button>
                    </div>

                    {/* Link Helper */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="overflow-hidden">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Link del Post</h4>
                            <p className="text-sm text-gray-900 truncate font-mono">
                                zetaprop.com.ar/blog/{post.slug}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const url = `https://zetaprop.com.ar/blog/${post.slug}`;
                                navigator.clipboard.writeText(url);
                                toast.success("Link copiado al portapapeles");
                            }}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Copiar Link"
                        >
                            <LinkIcon size={18} />
                        </button>
                    </div>

                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleDownload}
                        className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Download size={20} />
                        Descargar {platform === "instagram" ? "Post IG" : "Banner LI"}
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-8">
                <div className="transform scale-[0.6] md:scale-[0.8] lg:scale-[0.9] origin-center transition-all duration-300 shadow-2xl rounded-sm"> // Scale down to fit screen
                    {platform === "instagram" ? (
                        <InstagramCanvas ref={canvasRef} post={post} customTitle={customTitle} />
                    ) : (
                        <LinkedInCanvas ref={canvasRef} post={post} customTitle={customTitle} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Icons helper
function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M9 3v4" /><path d="M3 9h4" /><path d="M3 5h4" /></svg>
    )
}

function CopyIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
    )
}
