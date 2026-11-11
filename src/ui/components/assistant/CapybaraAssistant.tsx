"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { X } from "lucide-react";

const COLLAPSED_KEY = "zp-assistant-collapsed";
const DISMISSED_KEY = "zp-assistant-dismissed";

interface CapybaraAssistantProps {
    /** What the assistant says. Changing it re-plays the entrance animation. */
    message: ReactNode;
    /** Stable id for the current message, used to re-trigger the animation. */
    messageKey: string;
    /**
     * Alerts the user should not miss (overdue payments, due increases). They show even
     * when the assistant is minimized; closing one hides only that message.
     */
    important?: boolean;
    className?: string;
}

// Assistant state is shared by every assistant and remembered per viewer. The in-memory
// copy keeps it working when localStorage is unavailable (private mode).
const memory: Record<string, string> = {};
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const read = (key: string): string | undefined => {
    try {
        return window.localStorage.getItem(key) ?? memory[key];
    } catch {
        return memory[key];
    }
};

const write = (key: string, value: string) => {
    memory[key] = value;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage unavailable: the in-memory value still applies for this visit.
    }
    listeners.forEach(listener => listener());
};

const readDismissed = (): string[] => {
    try {
        const parsed = JSON.parse(read(DISMISSED_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// A string snapshot keeps useSyncExternalStore stable between renders.
const getSnapshot = () => `${read(COLLAPSED_KEY) ?? "0"}|${read(DISMISSED_KEY) ?? "[]"}`;

const setCollapsed = (value: boolean) => write(COLLAPSED_KEY, value ? "1" : "0");

const dismiss = (messageKey: string) => {
    // Keep the list short: only recent alerts matter.
    write(DISMISSED_KEY, JSON.stringify([...readDismissed().filter(k => k !== messageKey), messageKey].slice(-50)));
};

const undismiss = (messageKey: string) => {
    write(DISMISSED_KEY, JSON.stringify(readDismissed().filter(k => k !== messageKey)));
};

/**
 * Capi, the capybara guide. Shows a speech bubble with what the user should do next.
 * Minimized, it becomes a small floating button so it takes no room in the page.
 */
export default function CapybaraAssistant({ message, messageKey, important = false, className = "" }: CapybaraAssistantProps) {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "0|[]");
    const collapsed = snapshot.startsWith("1|");
    const dismissed = important && readDismissed().includes(messageKey);
    const showBubble = important ? !dismissed : !collapsed;

    const close = () => (important ? dismiss(messageKey) : setCollapsed(true));
    const reopen = () => {
        if (important) undismiss(messageKey);
        setCollapsed(false);
    };

    if (!showBubble) {
        return (
            <div className="cpb fixed bottom-24 right-6 z-40">
                <button
                    type="button"
                    onClick={reopen}
                    className="cpb-avatar rounded-full bg-[var(--color-paper-2)] border border-[var(--color-rule)] p-1 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60"
                    aria-label="Mostrar ayuda de Capi"
                    title="¿Necesitás ayuda? Tocá a Capi"
                >
                    <CapybaraSvg size={44} />
                </button>
                {styles}
            </div>
        );
    }

    return (
        <div className={`cpb flex items-end gap-3 ${className}`}>
            <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="cpb-avatar shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60"
                aria-label="Ocultar ayuda de Capi"
            >
                <CapybaraSvg key={messageKey} size={64} />
            </button>

            <div
                key={messageKey}
                role="status"
                aria-live="polite"
                className={`cpb-bubble relative mb-2 max-w-xl rounded-2xl rounded-bl-sm border bg-[var(--color-paper-2)] px-4 py-3 pr-9 text-sm leading-relaxed text-[var(--color-ink-2)] shadow-sm ${important ? "border-[var(--color-accent)]/50" : "border-[var(--color-rule)]"}`}
            >
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">Capi</p>
                <div>{message}</div>
                <button
                    type="button"
                    onClick={close}
                    className="absolute right-2 top-2 rounded-full p-1 text-[var(--color-muted)] hover:bg-[var(--color-paper-3)] hover:text-[var(--color-ink)]"
                    aria-label="Ocultar ayuda"
                >
                    <X strokeWidth={1.5} size={14} />
                </button>
            </div>

            {styles}
        </div>
    );
}

const styles = (
            <style>{`
                @keyframes cpb-hop { 0%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } 55% { transform: translateY(0); } 70% { transform: translateY(-4px); } }
                @keyframes cpb-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.03, 0.97); } }
                @keyframes cpb-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
                @keyframes cpb-ear { 0%, 80%, 100% { transform: rotate(0deg); } 85% { transform: rotate(-14deg); } 90% { transform: rotate(8deg); } }
                @keyframes cpb-wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
                @keyframes cpb-pop { 0% { opacity: 0; transform: translateY(6px) scale(0.92); } 100% { opacity: 1; transform: translateY(0) scale(1); } }

                .cpb svg { overflow: visible; }
                .cpb .cpb-hop { animation: cpb-hop 0.9s ease-out; transform-origin: bottom center; }
                .cpb .cpb-body { animation: cpb-breathe 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
                .cpb .cpb-eye { animation: cpb-blink 4.5s infinite; transform-box: fill-box; transform-origin: center; }
                .cpb .cpb-ear { animation: cpb-ear 5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center; }
                .cpb .cpb-ear-right { animation-delay: 0.25s; }
                .cpb .cpb-bubble { animation: cpb-pop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.3) both; transform-origin: bottom left; }
                .cpb .cpb-avatar:hover .cpb-hop { animation: cpb-wiggle 0.5s ease-in-out; }

                @media (prefers-reduced-motion: reduce) {
                    .cpb *, .cpb *::before, .cpb *::after { animation: none !important; }
                }
            `}</style>
);

function CapybaraSvg({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
            <g className="cpb-hop">
                {/* Shadow */}
                <ellipse cx="48" cy="91" rx="26" ry="3.5" fill="#000" opacity="0.15" />

                <g className="cpb-body">
                    {/* Body and paws */}
                    <ellipse cx="48" cy="74" rx="30" ry="17" fill="#9a6a3c" />
                    <ellipse cx="34" cy="88" rx="7" ry="3.5" fill="#7d532d" />
                    <ellipse cx="62" cy="88" rx="7" ry="3.5" fill="#7d532d" />

                    {/* Ears */}
                    <ellipse className="cpb-ear" cx="29" cy="22" rx="6" ry="5" fill="#7d532d" />
                    <ellipse className="cpb-ear cpb-ear-right" cx="67" cy="22" rx="6" ry="5" fill="#7d532d" />

                    {/* Head */}
                    <rect x="20" y="20" width="56" height="48" rx="22" fill="#b07c48" />

                    {/* Cheeks */}
                    <ellipse cx="27" cy="51" rx="5" ry="3" fill="#e88a6a" opacity="0.35" />
                    <ellipse cx="69" cy="51" rx="5" ry="3" fill="#e88a6a" opacity="0.35" />

                    {/* Eyes */}
                    <g className="cpb-eye">
                        <circle cx="35" cy="38" r="3.4" fill="#24160c" />
                        <circle cx="36.2" cy="36.8" r="1" fill="#fff" />
                    </g>
                    <g className="cpb-eye">
                        <circle cx="61" cy="38" r="3.4" fill="#24160c" />
                        <circle cx="62.2" cy="36.8" r="1" fill="#fff" />
                    </g>

                    {/* Snout, nose and smile */}
                    <rect x="31" y="44" width="34" height="21" rx="10.5" fill="#8c5d33" />
                    <rect x="39" y="47" width="18" height="7" rx="3.5" fill="#3a2314" />
                    <path d="M43 59 q5 4 10 0" stroke="#3a2314" strokeWidth="1.8" fill="none" strokeLinecap="round" />

                    {/* Little leaf on the head */}
                    <path d="M48 20 q-2 -9 7 -12 q-1 9 -7 12 z" fill="#6f9e4f" />
                </g>
            </g>
        </svg>
    );
}
