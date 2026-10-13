import { ImageResponse } from "next/og";
import { adminDb } from "@/infrastructure/firebase/admin";

// Server-rendered social images for blog posts. Stable public URL so a future
// auto-publisher (Instagram Graph API / LinkedIn API) can reference it:
//   /api/social/blog/{id}/image?format=instagram|square|linkedin[&title=...]
export const runtime = "nodejs";

const PAPER = "#110f0d";
const INK = "#f3efe9";
const MUTED = "#a8a198";
const BRONZE = "#d4a76a";

const FORMATS = {
    instagram: { width: 1080, height: 1350 },
    square: { width: 1080, height: 1080 },
    linkedin: { width: 1200, height: 627 },
} as const;
type Format = keyof typeof FORMATS;

// Hosts we are willing to fetch cover photos from (same as next.config images).
const COVER_HOSTS = new Set(["firebasestorage.googleapis.com", "storage.googleapis.com"]);
const COVER_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);
const COVER_MAX_BYTES = 8 * 1024 * 1024;

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

function clean(value: unknown, max: number): string {
    if (typeof value !== "string") return "";
    const text = value.replace(/<[^>]*>?/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Pre-fetch the cover with a short timeout and inline it as a data URL, so a
// slow/broken/unsupported image falls back to the no-photo layout instead of
// failing the whole render.
async function loadCover(url: unknown): Promise<string | null> {
    if (typeof url !== "string" || !url) return null;
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !COVER_HOSTS.has(parsed.hostname)) return null;
        const res = await fetch(parsed, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return null;
        const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        if (!COVER_TYPES.has(type)) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > COVER_MAX_BYTES) return null;
        return `data:${type};base64,${buf.toString("base64")}`;
    } catch {
        return null;
    }
}

function titleSize(format: Format, length: number): number {
    const steps: Record<Format, [number, number][]> = {
        instagram: [[40, 84], [70, 72], [100, 62], [Infinity, 54]],
        square: [[40, 72], [70, 62], [100, 54], [Infinity, 46]],
        linkedin: [[45, 48], [75, 42], [100, 36], [Infinity, 32]],
    };
    return steps[format].find(([max]) => length <= max)![1];
}

function Wordmark({ size }: { size: number }) {
    return (
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span style={{ color: INK }}>Zeta</span>
            <span style={{ color: BRONZE }}>Prop</span>
        </div>
    );
}

function Glow() {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                backgroundImage: `radial-gradient(circle at 70% 25%, rgba(212,167,106,0.22) 0%, rgba(212,167,106,0.06) 35%, ${PAPER} 70%)`,
            }}
        />
    );
}

function Label({ text, size }: { text: string; size: number }) {
    return (
        <div style={{ display: "flex", color: BRONZE, fontSize: size, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {text}
        </div>
    );
}

function Title({ text, size }: { text: string; size: number }) {
    return (
        <div
            style={{
                display: "block",
                color: INK,
                fontSize: size,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                lineClamp: 4,
            }}
        >
            {text}
        </div>
    );
}

type Content = { title: string; category: string; excerpt: string; cover: string | null };

function Portrait({ format, c }: { format: "instagram" | "square"; c: Content }) {
    const { width, height } = FORMATS[format];
    const photoHeight = Math.round(height * (format === "instagram" ? 0.58 : 0.6));
    const pad = 72;
    return (
        <div style={{ width, height, display: "flex", position: "relative", background: PAPER }}>
            {c.cover ? (
                <div style={{ position: "absolute", top: 0, left: 0, width, height: photoHeight, display: "flex" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.cover} alt="" width={width} height={photoHeight} style={{ width, height: photoHeight, objectFit: "cover" }} />
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            bottom: 0,
                            width,
                            height: Math.round(photoHeight * 0.55),
                            display: "flex",
                            backgroundImage: `linear-gradient(to bottom, rgba(17,15,13,0) 0%, rgba(17,15,13,0.75) 60%, ${PAPER} 100%)`,
                        }}
                    />
                </div>
            ) : (
                <Glow />
            )}
            <div
                style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    bottom: pad,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {c.category ? <Label text={c.category} size={26} /> : null}
                <div style={{ display: "flex", marginTop: 22 }}>
                    <Title text={c.title} size={titleSize(format, c.title.length)} />
                </div>
                <div style={{ display: "flex", width: 120, height: 3, background: BRONZE, marginTop: 40, marginBottom: 40 }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Wordmark size={44} />
                    <div style={{ display: "flex", color: MUTED, fontSize: 26 }}>zetaprop.com.ar/blog</div>
                </div>
            </div>
        </div>
    );
}

function Landscape({ c }: { c: Content }) {
    const { width, height } = FORMATS.linkedin;
    const photoWidth = c.cover ? Math.round(width * 0.52) : 0;
    const pad = 56;
    return (
        <div style={{ width, height, display: "flex", position: "relative", background: PAPER }}>
            {c.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover} alt="" width={photoWidth} height={height} style={{ width: photoWidth, height, objectFit: "cover" }} />
            ) : (
                <Glow />
            )}
            <div
                style={{
                    position: "relative",
                    width: width - photoWidth,
                    height,
                    padding: c.cover ? pad : `${pad}px 96px`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <Wordmark size={34} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {c.category ? <Label text={c.category} size={18} /> : null}
                    <div style={{ display: "flex", marginTop: 16 }}>
                        <Title text={c.title} size={titleSize("linkedin", c.title.length) + (c.cover ? 0 : 8)} />
                    </div>
                    {c.excerpt ? (
                        <div style={{ display: "block", marginTop: 20, color: MUTED, fontSize: 22, lineHeight: 1.4, lineClamp: 2 }}>
                            {c.excerpt}
                        </div>
                    ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", width: 48, height: 2, background: BRONZE, marginRight: 16 }} />
                    <div style={{ display: "flex", color: MUTED, fontSize: 20 }}>zetaprop.com.ar/blog</div>
                </div>
            </div>
        </div>
    );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const search = new URL(request.url).searchParams;
    const requested = search.get("format") ?? "instagram";
    const format: Format = requested in FORMATS ? (requested as Format) : "instagram";

    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return new Response("Not found", { status: 404 });

    let data: FirebaseFirestore.DocumentData | undefined;
    try {
        const snap = await adminDb.collection("blog_posts").doc(id).get();
        data = snap.exists ? snap.data() : undefined;
    } catch (error) {
        console.error("social image: failed to load post", error);
        return new Response("Error", { status: 500 });
    }
    // Only published posts get a public image.
    if (!data || data.published !== true) return new Response("Not found", { status: 404 });

    const content: Content = {
        title: clean(search.get("title"), 120) || clean(data.title, 160),
        category: clean(data.category, 40),
        excerpt: clean(data.excerpt, 220),
        cover: await loadCover(data.imageUrl),
    };

    const { width, height } = FORMATS[format];
    return new ImageResponse(
        format === "linkedin" ? <Landscape c={content} /> : <Portrait format={format} c={content} />,
        { width, height, headers: { "Cache-Control": CACHE_CONTROL } }
    );
}
