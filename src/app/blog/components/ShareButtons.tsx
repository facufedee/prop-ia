"use client";

import { Share2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
    title: string;
    slug: string;
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : `https://prop-ia.com/blog/${slug}`;
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url);
        toast.success("Enlace copiado al portapapeles");
    };

    const shareLinks = [
        {
            name: "WhatsApp",
            url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: "hover:text-green-600",
            icon: (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            )
        },
        {
            name: "LinkedIn",
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: "hover:text-blue-700",
            icon: (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                </svg>
            )
        },
        {
            name: "X (Twitter)",
            url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: "hover:text-black",
            icon: (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
            )
        }
    ];

    return (
        <div className="flex items-center gap-4 py-6 border-t border-b border-gray-100 my-8">
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Share2 size={16} />
                Compartir:
            </span>
            <div className="flex items-center gap-3">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-full bg-gray-50 text-gray-600 transition-colors ${link.color}`}
                        title={`Compartir en ${link.name}`}
                    >
                        {link.icon}
                    </a>
                ))}
                <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-full bg-gray-50 text-gray-600 hover:text-indigo-600 transition-colors"
                    title="Copiar enlace"
                >
                    <LinkIcon size={20} />
                </button>
            </div>
        </div>
    );
}
