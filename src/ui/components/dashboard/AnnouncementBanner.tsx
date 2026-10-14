"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, CheckCircle2, XCircle, X, type LucideIcon } from "lucide-react";

type AnnouncementType = "info" | "warning" | "success" | "error";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: AnnouncementType;
    expiresAt?: string;
}

// Quiet banner: same paper-2 surface for every type; only the left bar and icon carry the tone.
const ANNOUNCEMENT_STYLES: Record<AnnouncementType, { bar: string; icon: LucideIcon; tone: string }> = {
    info: { bar: "bg-[var(--color-accent)]", icon: Info, tone: "text-[var(--color-accent)]" },
    warning: { bar: "bg-[var(--color-warning)]", icon: AlertTriangle, tone: "text-[var(--color-warning)]" },
    success: { bar: "bg-[var(--color-positive)]", icon: CheckCircle2, tone: "text-[var(--color-positive)]" },
    error: { bar: "bg-[var(--color-danger)]", icon: XCircle, tone: "text-[var(--color-danger)]" },
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
                        className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4 md:p-5 animate-in fade-in slide-in-from-top-2 duration-500"
                    >
                        <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-0.5 ${style.bar}`} />
                        <div className="flex items-start gap-3">
                            <Icon size={18} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${style.tone}`} />
                            <div className="flex-1 pr-8">
                                <h3 className="font-heading text-sm md:text-base font-semibold text-[var(--color-ink)] mb-1">
                                    {ann.title}
                                </h3>
                                <p className="text-xs md:text-sm text-[var(--color-ink-2)] leading-relaxed">
                                    {ann.message}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDismiss(ann.id)}
                                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors absolute top-3 right-3"
                                title="Cerrar"
                                aria-label="Cerrar anuncio"
                            >
                                <X size={16} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
