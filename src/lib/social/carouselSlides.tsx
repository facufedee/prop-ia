/* eslint-disable @next/next/no-img-element -- Satori (next/og) renders plain <img> elements */
import fs from "fs/promises";
import path from "path";
import type { CarouselItem } from "@/lib/social/carouselDraft";

// Instagram carousel slides (1080x1350) rendered with next/og. Layout follows
// the approved mockup: dark cover, light list slides, dark closing slide with
// the ZP monogram. Fonts and wordmarks are read from the repo at runtime, so
// next.config.js traces assets/fonts and public/brand into the server bundle.

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;

export const COLORS = {
    paper: "#110f0d",
    paper2: "#1a1815",
    ink: "#f2eee6",
    muted: "#9d9790",
    accent: "#d3a974",
    light: "#f4f2ee",
    lightInk: "#110f0d",
    lightAccent: "#a97d45",
    lightMuted: "#6f6a63",
} as const;

export const COVER_CTA = "Deslizá y guardalo →";
const CLOSING_TAGLINE = "Un tip nuevo para tu inmobiliaria cada semana";
const SITE_LABEL = "zetaprop.com.ar";

export interface CarouselContent {
    category: string;
    coverTitle: string;
    listHeading: string;
    slides: CarouselItem[][];
}

type FontWeight = 500 | 600 | 700;

export interface CarouselAssets {
    fonts: { name: string; data: Buffer; weight: FontWeight; style: "normal" }[];
    wordmarkDark: string;
    wordmarkLight: string;
}

/** Cover + list slides + closing slide. */
export function carouselSlideCount(content: Pick<CarouselContent, "slides">): number {
    return content.slides.length + 2;
}

function asText(value: unknown): string {
    return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : "";
}

/** Narrows a stored Firestore doc to renderable content, or null when malformed. */
export function toCarouselContent(data: FirebaseFirestore.DocumentData | undefined): CarouselContent | null {
    if (!data || !Array.isArray(data.slides) || data.slides.length < 1 || data.slides.length > 2) return null;
    const slides: CarouselItem[][] = [];
    for (const slide of data.slides) {
        if (!Array.isArray(slide) || slide.length === 0) return null;
        slides.push(slide.map((item: { title?: unknown; detail?: unknown }) => ({ title: asText(item?.title), detail: asText(item?.detail) })));
    }
    const coverTitle = asText(data.coverTitle);
    if (!coverTitle) return null;
    return { category: asText(data.category), coverTitle, listHeading: asText(data.listHeading), slides };
}

const ROOT = process.cwd();
const FONT_FILES: [string, FontWeight][] = [
    ["Montserrat-Medium.ttf", 500],
    ["Montserrat-SemiBold.ttf", 600],
    ["Montserrat-Bold.ttf", 700],
];

let assetsPromise: Promise<CarouselAssets> | null = null;

async function readAssets(): Promise<CarouselAssets> {
    const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    const [fonts, dark, light] = await Promise.all([
        Promise.all(
            FONT_FILES.map(async ([file, weight]) => ({
                name: "Montserrat",
                data: await fs.readFile(path.join(ROOT, "assets", "fonts", file)),
                weight,
                style: "normal" as const,
            }))
        ),
        fs.readFile(path.join(ROOT, "public", "brand", "zetaprop-wordmark-dark.svg"), "utf8"),
        fs.readFile(path.join(ROOT, "public", "brand", "zetaprop-wordmark-light.svg"), "utf8"),
    ]);
    return { fonts, wordmarkDark: svgDataUrl(dark), wordmarkLight: svgDataUrl(light) };
}

/** Fonts and wordmarks, read once per server instance (retried after a failure). */
export function loadCarouselAssets(): Promise<CarouselAssets> {
    if (!assetsPromise) {
        assetsPromise = readAssets().catch((error) => {
            assetsPromise = null;
            throw error;
        });
    }
    return assetsPromise;
}

const MONOGRAM = `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 298 160"><path fill="${COLORS.ink}" d="M0 0H150V44L62 116H150V160H0V116L88 44H0Z"/><path fill="${COLORS.accent}" fill-rule="evenodd" d="M168 0H242A56 56 0 0 1 242 112H212V160H168ZM212 40H238A16 16 0 0 1 238 72H212Z"/></svg>`
).toString("base64")}`;

const pad2 = (n: number) => String(n).padStart(2, "0");

function Frame({ dark, index, total, assets, children }: { dark: boolean; index: number; total: number; assets: CarouselAssets; children: React.ReactNode }) {
    return (
        <div
            style={{
                width: SLIDE_WIDTH,
                height: SLIDE_HEIGHT,
                display: "flex",
                flexDirection: "column",
                position: "relative",
                background: dark ? `radial-gradient(120% 80% at 30% 20%, ${COLORS.paper2}, ${COLORS.paper})` : COLORS.light,
                fontFamily: "Montserrat",
                color: dark ? COLORS.ink : COLORS.lightInk,
                padding: "72px 80px",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    right: -180,
                    bottom: -160,
                    width: 760,
                    height: 760,
                    borderRadius: 120,
                    border: `2px solid ${dark ? "rgba(242,238,230,0.08)" : "rgba(17,15,13,0.08)"}`,
                    display: "flex",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    right: -60,
                    bottom: -40,
                    width: 560,
                    height: 560,
                    borderRadius: 96,
                    border: `2px solid ${dark ? "rgba(211,169,116,0.18)" : "rgba(169,125,69,0.20)"}`,
                    display: "flex",
                }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img src={dark ? assets.wordmarkDark : assets.wordmarkLight} alt="" width={180} height={40} />
                <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: dark ? COLORS.muted : COLORS.lightMuted }}>
                    {`${pad2(index)} / ${pad2(total)}`}
                </div>
            </div>
            {children}
        </div>
    );
}

function coverTitleSize(length: number): number {
    if (length <= 70) return 92;
    if (length <= 85) return 80;
    return 72;
}

function Cover({ content }: { content: CarouselContent }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            {content.category ? (
                <div
                    style={{
                        display: "flex",
                        alignSelf: "flex-start",
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: 4,
                        textTransform: "uppercase",
                        color: COLORS.accent,
                        border: `2px solid ${COLORS.accent}`,
                        borderRadius: 999,
                        padding: "10px 24px",
                        marginBottom: 44,
                    }}
                >
                    {content.category}
                </div>
            ) : null}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    fontSize: coverTitleSize(content.coverTitle.length),
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: -2,
                }}
            >
                {content.coverTitle}
            </div>
            <div style={{ display: "flex", marginTop: 48, fontSize: 30, fontWeight: 500, color: COLORS.muted }}>{COVER_CTA}</div>
        </div>
    );
}

// Picks the largest type scale whose estimated height fits the slide, so five
// items of copy at the draft limits always fit. The estimate uses an average
// Montserrat glyph width, which is conservative for Spanish sentence case.
const LIST_SCALES = [
    { heading: 56, headingGap: 48, number: 40, numberWidth: 64, title: 38, detail: 29, padding: 26 },
    { heading: 48, headingGap: 36, number: 36, numberWidth: 58, title: 34, detail: 26, padding: 20 },
    { heading: 44, headingGap: 28, number: 32, numberWidth: 52, title: 30, detail: 23, padding: 14 },
] as const;
type ListScale = (typeof LIST_SCALES)[number];

const CONTENT_WIDTH = SLIDE_WIDTH - 160;
const LIST_MAX_HEIGHT = SLIDE_HEIGHT - 144 - 40 - 60; // padding, header row, breathing room
const BOLD_EM = 0.6;
const MEDIUM_EM = 0.55;

function lines(text: string, fontSize: number, em: number, width: number): number {
    return text ? Math.max(1, Math.ceil((text.length * fontSize * em) / width)) : 0;
}

export function estimateListHeight(heading: string, items: CarouselItem[], s: ListScale): number {
    const textWidth = CONTENT_WIDTH - s.numberWidth - 32;
    const headingHeight = heading ? lines(heading, s.heading, BOLD_EM, CONTENT_WIDTH) * s.heading * 1.1 + s.headingGap : 0;
    return items.reduce(
        (sum, item) =>
            sum +
            2 * s.padding +
            lines(item.title, s.title, BOLD_EM, textWidth) * s.title * 1.2 +
            (item.detail ? 8 + lines(item.detail, s.detail, MEDIUM_EM, textWidth) * s.detail * 1.35 : 0),
        headingHeight
    );
}

export function listScale(heading: string, items: CarouselItem[]): ListScale {
    return LIST_SCALES.find((s) => estimateListHeight(heading, items, s) <= LIST_MAX_HEIGHT) ?? LIST_SCALES[LIST_SCALES.length - 1];
}

function List({ heading, items, offset }: { heading: string; items: CarouselItem[]; offset: number }) {
    const s = listScale(heading, items);
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            {heading ? (
                <div style={{ display: "flex", fontSize: s.heading, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, marginBottom: s.headingGap }}>
                    {heading}
                </div>
            ) : null}
            {items.map((item, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        gap: 32,
                        padding: `${s.padding}px 0`,
                        borderTop: i ? "2px solid rgba(17,15,13,0.10)" : "none",
                    }}
                >
                    <div style={{ display: "flex", fontSize: s.number, fontWeight: 700, color: COLORS.lightAccent, width: s.numberWidth }}>
                        {pad2(offset + i + 1)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", fontSize: s.title, fontWeight: 700, lineHeight: 1.2 }}>{item.title}</div>
                        {item.detail ? (
                            <div style={{ display: "flex", fontSize: s.detail, fontWeight: 500, color: COLORS.lightMuted, lineHeight: 1.35, marginTop: 8 }}>
                                {item.detail}
                            </div>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
}

function Closing({ assets }: { assets: CarouselAssets }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <img src={MONOGRAM} alt="" width={330} height={177} />
            <img src={assets.wordmarkDark} alt="" width={360} height={80} style={{ marginTop: 56 }} />
            <div style={{ display: "flex", marginTop: 40, fontSize: 30, fontWeight: 500, color: COLORS.muted }}>{CLOSING_TAGLINE}</div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 28, fontWeight: 600, color: COLORS.accent }}>{SITE_LABEL}</div>
        </div>
    );
}

/** Slide `index` is 1-based: 1 = cover, 2..total-1 = list slides, total = closing. */
export function CarouselSlide({ content, index, assets }: { content: CarouselContent; index: number; assets: CarouselAssets }) {
    const total = carouselSlideCount(content);
    if (index === 1) {
        return (
            <Frame dark index={index} total={total} assets={assets}>
                <Cover content={content} />
            </Frame>
        );
    }
    if (index === total) {
        return (
            <Frame dark index={index} total={total} assets={assets}>
                <Closing assets={assets} />
            </Frame>
        );
    }
    const listIndex = index - 2;
    const offset = content.slides.slice(0, listIndex).reduce((sum, slide) => sum + slide.length, 0);
    return (
        <Frame dark={false} index={index} total={total} assets={assets}>
            <List heading={content.listHeading} items={content.slides[listIndex]} offset={offset} />
        </Frame>
    );
}
