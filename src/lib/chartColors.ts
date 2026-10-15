"use client";

import { useSyncExternalStore } from "react";

/**
 * Chart colors for Recharts (and other SVG/canvas libs) derived from the
 * dashboard theme tokens defined on `.app-theme` (landing-theme.css).
 *
 * Recharts takes plain color strings, so the hook resolves the CSS custom
 * properties at runtime with getComputedStyle. Until then (SSR / first paint)
 * it returns `var(--color-*)` strings, which SVG presentation attributes and
 * inline styles also understand inside `.app-theme`.
 */
const TOKENS = {
    accent: "--color-accent",
    accent2: "--color-accent-2",
    ink: "--color-ink",
    ink2: "--color-ink-2",
    muted: "--color-muted",
    neutral: "--color-neutral",
    rule: "--color-rule",
    rule2: "--color-rule-2",
    paper: "--color-paper",
    paper2: "--color-paper-2",
    paper3: "--color-paper-3",
    positive: "--color-positive",
    warning: "--color-warning",
    danger: "--color-danger",
} as const;

export type ChartColors = Record<keyof typeof TOKENS, string>;

const FALLBACK = Object.fromEntries(
    Object.entries(TOKENS).map(([key, cssVar]) => [key, `var(${cssVar})`])
) as ChartColors;

export function readChartColors(root?: Element | null): ChartColors {
    if (typeof window === "undefined") return FALLBACK;
    const el = root ?? document.querySelector(".app-theme");
    if (!el) return FALLBACK;
    const styles = getComputedStyle(el);
    return Object.fromEntries(
        Object.entries(TOKENS).map(([key, cssVar]) => {
            const value = styles.getPropertyValue(cssVar).trim();
            return [key, value || `var(${cssVar})`];
        })
    ) as ChartColors;
}

// Tokens are static for the dashboard (dark-only), so resolve them once and
// keep a stable reference for useSyncExternalStore.
let cached: ChartColors | null = null;
const getSnapshot = () => {
    if (cached) return cached;
    const resolved = readChartColors();
    // Only cache once the themed root exists; until then the var() fallback is used.
    if (resolved !== FALLBACK) cached = resolved;
    return resolved;
};
const getServerSnapshot = () => FALLBACK;
const subscribe = () => () => {};

export function useChartColors(): ChartColors {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
