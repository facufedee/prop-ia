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
        bg: "bg-blue-50/90", 
        border: "border-blue-200", 
        icon: Info, 
        text: "text-blue-800",
        shadow: "shadow-blue-500/10"
    },
    warning: { 
        bg: "bg-amber-50/90", 
        border: "border-amber-200", 
        icon: AlertTriangle, 
        text: "text-amber-800",
        shadow: "shadow-amber-500/10"
    },
    success: { 
        bg: "bg-green-50/90", 
        border: "border-green-200", 
        icon: CheckCircle2, 
        text: "text-green-800",
        shadow: "shadow-green-500/10"
    },
    error: { 
        bg: "bg-red-50/90", 
        border: "border-red-200", 
        icon: XCircle, 
        text: "text-red-800",
        shadow: "shadow-red-500/10"
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
                            <div className={`p-2 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm ${style.text}`}>
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
                                className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors absolute top-3 right-3 ${style.text} opacity-50 hover:opacity-100`}
                                title="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Abstract background decorative element */}
                        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                            <Megaphone size={120} className="rotate-12" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
