import { cn } from "@/lib/utils";

type WordmarkSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<WordmarkSize, string> = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-4xl",
};

interface WordmarkProps {
    size?: WordmarkSize;
    /** Compact "ZP" monogram for tight spaces (collapsed sidebar). */
    compact?: boolean;
    className?: string;
}

/**
 * Text wordmark in the landing brand: "Zeta" in ink + "Prop" in bronze, set in the
 * heading font. Reads the shared tokens, so it must render inside `.app-theme` or
 * `.landing-page`.
 */
export default function Wordmark({ size = "md", compact = false, className }: WordmarkProps) {
    return (
        <span
            className={cn(
                "inline-flex items-baseline font-heading font-semibold tracking-tight leading-none select-none",
                SIZE_CLASSES[size],
                className
            )}
            aria-label="Zeta Prop"
            role="img"
        >
            <span aria-hidden="true" className="text-[var(--color-ink)]">{compact ? "Z" : "Zeta"}</span>
            <span aria-hidden="true" className="text-[var(--color-accent)]">{compact ? "P" : "Prop"}</span>
        </span>
    );
}
