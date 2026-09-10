import { FichaTemplateConfig } from "@/app/(print)/print/propiedades/components/ficha/fichaTemplates";

// Small abstract wireframe preview of a ficha layout — gray blocks stand in
// for photos/map, thin bars stand in for text. Purely illustrative, not a
// pixel-accurate render (that would need the real property data at hover time).
export default function FichaThumbnail({ config }: { config: FichaTemplateConfig }) {
    const isA5 = config.pageSize === "A5";
    const w = isA5 ? 70 : 90;
    const h = isA5 ? 96 : 116;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" aria-hidden="true">
            <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={3} fill="#fff" stroke="#e5e7eb" />
            {/* header bar */}
            <rect x={6} y={7} width={w * 0.35} height={4} rx={1} fill="#c7d2fe" />
            <rect x={6} y={13} width={w - 12} height={1.4} fill="#eef2ff" />

            {config.qrHero ? (
                <QrPattern w={w} />
            ) : config.galleryPage || config.photoLayout === "grid12" ? (
                <GridPattern w={w} cols={3} rows={4} />
            ) : (
                <>
                    <PhotoBlock config={config} w={w} />
                    <TextLines config={config} w={w} />
                </>
            )}

            {/* footer */}
            <rect x={6} y={h - 8} width={w - 12} height={2} fill="#f3f4f6" />
        </svg>
    );
}

function PhotoBlock({ config, w }: { config: FichaTemplateConfig; w: number }) {
    const top = 18;
    if (config.showMap && config.photoLayout === "hero") {
        return (
            <>
                <rect x={6} y={top} width={w * 0.44} height={22} rx={1.5} fill="#dbeafe" />
                <rect x={6 + w * 0.44 + 4} y={top} width={w * 0.44} height={22} rx={1.5} fill="#e5e7eb" />
            </>
        );
    }
    if (config.showMap) {
        return <rect x={6} y={top} width={w - 12} height={22} rx={1.5} fill="#dbeafe" />;
    }
    switch (config.photoLayout) {
        case "hero":
            return <rect x={6} y={top} width={w - 12} height={26} rx={1.5} fill="#e5e7eb" />;
        case "hero+1":
            return (
                <>
                    <rect x={6} y={top} width={(w - 14) * 0.65} height={26} rx={1.5} fill="#e5e7eb" />
                    <rect x={6 + (w - 14) * 0.65 + 4} y={top} width={(w - 14) * 0.35} height={26} rx={1.5} fill="#d1d5db" />
                </>
            );
        case "hero+3":
            return (
                <>
                    <rect x={6} y={top} width={w - 12} height={18} rx={1.5} fill="#e5e7eb" />
                    {[0, 1, 2].map((i) => (
                        <rect key={i} x={6 + i * ((w - 12) / 3 + 1)} y={top + 20} width={(w - 12) / 3 - 2} height={9} rx={1} fill="#d1d5db" />
                    ))}
                </>
            );
        case "grid4":
            return (
                <>
                    {[0, 1].map((row) =>
                        [0, 1].map((col) => (
                            <rect
                                key={`${row}-${col}`}
                                x={6 + col * ((w - 12) / 2 + 2)}
                                y={top + row * 15}
                                width={(w - 12) / 2 - 2}
                                height={13}
                                rx={1}
                                fill="#e5e7eb"
                            />
                        ))
                    )}
                </>
            );
        default:
            return null;
    }
}

function TextLines({ config, w }: { config: FichaTemplateConfig; w: number }) {
    const startY = 50;
    return (
        <>
            <rect x={6} y={startY} width={w * 0.55} height={3} rx={1} fill="#9ca3af" />
            {config.showBadges && (
                <>
                    <rect x={6} y={startY + 7} width={(w - 16) / 3} height={8} rx={1} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth={0.3} />
                    <rect x={6 + (w - 16) / 3 + 3} y={startY + 7} width={(w - 16) / 3} height={8} rx={1} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth={0.3} />
                    <rect x={6 + 2 * ((w - 16) / 3 + 3)} y={startY + 7} width={(w - 16) / 3} height={8} rx={1} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth={0.3} />
                </>
            )}
            {config.showDescription && (
                <>
                    <rect x={6} y={startY + 19} width={w - 12} height={1.6} fill="#e5e7eb" />
                    <rect x={6} y={startY + 23} width={w - 12} height={1.6} fill="#e5e7eb" />
                    <rect x={6} y={startY + 27} width={w * 0.6} height={1.6} fill="#e5e7eb" />
                </>
            )}
        </>
    );
}

function GridPattern({ w, cols, rows }: { w: number; cols: number; rows: number }) {
    const top = 18;
    const size = (w - 12 - (cols - 1) * 2) / cols;
    return (
        <>
            {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => (
                    <rect
                        key={`${r}-${c}`}
                        x={6 + c * (size + 2)}
                        y={top + r * (size + 2)}
                        width={size}
                        height={size}
                        rx={0.8}
                        fill="#e5e7eb"
                    />
                ))
            )}
        </>
    );
}

function QrPattern({ w }: { w: number }) {
    const cx = w / 2;
    const s = w * 0.32;
    return (
        <g>
            <rect x={cx - s / 2} y={26} width={s} height={s} fill="#111827" />
            <rect x={cx - s / 2 + s * 0.18} y={26 + s * 0.18} width={s * 0.64} height={s * 0.64} fill="#fff" />
            <rect x={cx - s / 2 + s * 0.32} y={26 + s * 0.32} width={s * 0.36} height={s * 0.36} fill="#111827" />
        </g>
    );
}
