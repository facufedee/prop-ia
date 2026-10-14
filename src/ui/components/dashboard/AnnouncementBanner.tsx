"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, CheckCircle2, XCircle, X, Megaphone } from "lucide-react";

type AnnouncementType = "info" | "warning" | "success" | "error";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: AnnouncementType;
    expiresAt?: string;
}

const ANNOUNCEMENT_STYLES: Record<AnnouncementType, { bg: string; border: string; icon: any; text: string; shadow: string }> = {
    info: {
        bg: "bg-[var(--color-paper-2)]",
        border: "border-[color:var(--color-accent)]/30",
        icon: Info,
        text: "text-[var(--color-ink)]",
        shadow: "shadow-black/20"
    },
    warning: {
        bg: "bg-[var(--color-paper-2)]",
        border: "border-[color:var(--color-warning)]/30",
        icon: AlertTriangle,
        text: "text-[var(--color-warning)]",
        shadow: "shadow-black/20"
    },
    success: {
        bg: "bg-[var(--color-paper-2)]",
        border: "border-[color:var(--color-positive)]/30",
        icon: CheckCircle2,
        text: "text-[var(--color-positive)]",
        shadow: "shadow-black/20"
    },
    error: {
        bg: "bg-[var(--color-paper-2)]",
        border: "border-[color:var(--color-danger)]/30",
        icon: XCircle,
        text: "text-[var(--color-danger)]",
        shadow: "shadow-black/20"
    },
};

export function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load dismissed IDs from localStorage
        const saved = localStorage.getItem("dismissed_announcements");
        if (saved) {
            try {
                setDismissedIds(JSON.parse(saved));
            } catch (e) {
                console.error("Error parsing dismissed announcements", e);
            }
        }

        const fetchAnnouncements = async () => {
            try {
                const res = await fetch("/api/admin/announcements");
                const data = await res.json();
                if (data.announcements) {
                    setAnnouncements(data.announcements);
                } else if (data.announcement) {
                    setAnnouncements([data.announcement]);
                }
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const handleDismiss = (id: string) => {
        const nextDismissed = [...dismissedIds, id];
        setDismissedIds(nextDismissed);
        localStorage.setItem("dismissed_announcements", JSON.stringify(nextDismissed));
    };

    const activeAnnouncements = announcements.filter(ann => {
        if (dismissedIds.includes(ann.id)) return false;
        if (ann.expiresAt) {
            const expDate = new Date(ann.expiresAt);
            if (isNaN(expDate.getTime())) return true; // Keep if invalid date (shouldn't happen with our API)
            return expDate > new Date();
        }
        return true;
    });

    if (loading || activeAnnouncements.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            {activeAnnouncements.map((ann) => {
                const style = ANNOUNCEMENT_STYLES[ann.type] || ANNOUNCEMENT_STYLES.info;
                const Icon = style.icon;

                return (
                    <div 
                        key={ann.id}
                        className={`relative overflow-hidden rounded-2xl border ${style.bg} ${style.border} ${style.shadow} p-4 md:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-500 shadow-lg`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/5 shadow-sm ${style.text}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 pr-8">
                                <h3 className={`text-sm md:text-base font-bold ${style.text} flex items-center gap-2 mb-1`}>
                                    {ann.title}
                                </h3>
                                <p className={`text-xs md:text-sm ${style.text} opacity-90 leading-relaxed`}>
                                    {ann.message}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleDismiss(ann.id)}
                                className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors absolute top-3 right-3 ${style.text} opacity-50 hover:opacity-100`}
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
