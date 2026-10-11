"use client";

import { useSyncExternalStore } from "react";
import { Share2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
    title: string;
    slug: string;
    excerpt?: string;
    /** "rail" stacks icons vertically (desktop sidebar); "row" wraps them horizontally. */
    variant?: "row" | "rail";
    label?: string;
}

const noopSubscribe = () => () => {};
const useCanNativeShare = () =>
    useSyncExternalStore(
        noopSubscribe,
        () => typeof navigator !== "undefined" && typeof navigator.share === "function",
        () => false,
    );

export default function ShareButtons({ title, slug, excerpt, variant = "row", label }: ShareButtonsProps) {
    // Use fixed production URL to prevent hydration mismatch and ensure shared links point to live site
    const url = `https://zetaprop.com.ar/blog/${slug}`;
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    const message = [`*${title}*`, excerpt, url].filter(Boolean).join("\n\n");
    const canNativeShare = useCanNativeShare();

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Enlace copiado al portapapeles");
        } catch {
            toast.error("No se pudo copiar el enlace");
        }
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({ title, text: excerpt || title, url });
        } catch {
            // user cancelled the share sheet
        }
    };

    const shareLinks = [
        {
            name: "WhatsApp",
            url: `https://wa.me/?text=${encodeURIComponent(message)}`,
            hover: "hover:bg-green-50 hover:text-green-600",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
                    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.31l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.45-9.43a9.38 9.38 0 0 1 6.68 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.45 9.43zm8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.79.7.69 5.8.69 12.05c0 2 .52 3.95 1.52 5.67L.6 23.3l5.7-1.5a11.32 11.32 0 0 0 5.74 1.47h.01c6.26 0 11.36-5.1 11.36-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
                </svg>
            ),
        },
        {
            name: "LinkedIn",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            hover: "hover:bg-blue-50 hover:text-blue-700",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
                    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
            ),
        },
        {
            name: "X",
            url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            hover: "hover:bg-gray-100 hover:text-black",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z" />
                </svg>
            ),
        },
    ];

    const isRail = variant === "rail";
    const itemClass = "flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors";

    return (
        <div className={isRail ? "flex flex-col items-center gap-3" : "flex flex-wrap items-center gap-x-4 gap-y-3"}>
            {label && (
                <span className={`text-sm font-medium text-gray-500 ${isRail ? "text-xs uppercase tracking-wider" : ""}`}>{label}</span>
            )}
            <div className={isRail ? "flex flex-col gap-2" : "flex flex-wrap gap-2"}>
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${itemClass} ${link.hover}`}
                        aria-label={`Compartir en ${link.name}`}
                        title={`Compartir en ${link.name}`}
                    >
                        {link.icon}
                    </a>
                ))}
                <button type="button" onClick={handleCopyLink} className={`${itemClass} hover:bg-indigo-50 hover:text-indigo-600`} aria-label="Copiar enlace" title="Copiar enlace">
                    <LinkIcon size={17} />
                </button>
                {canNativeShare && !isRail && (
                    <button type="button" onClick={handleNativeShare} className={`${itemClass} hover:bg-indigo-50 hover:text-indigo-600`} aria-label="Más opciones para compartir" title="Más opciones">
                        <Share2 size={17} />
                    </button>
                )}
            </div>
        </div>
    );
}
