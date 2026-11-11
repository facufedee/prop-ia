import { ImageResponse } from "next/og";
import { adminDb } from "@/infrastructure/firebase/admin";
import { CAROUSEL_COLLECTION } from "@/lib/social/carouselDraft";
import {
    COLORS,
    CarouselSlide,
    SLIDE_HEIGHT,
    SLIDE_WIDTH,
    carouselSlideCount,
    loadCarouselAssets,
    toCarouselContent,
} from "@/lib/social/carouselSlides";

// Instagram carousel slide images:
//   /api/social/carousel/{topicNumber}/image?slide=N[&type=jpeg]
// Public on purpose: Instagram (through Make) downloads these URLs. Only
// existing draft/published carousels render; anything else is a 404.
// PNG by default; `type=jpeg` returns a JPEG (required by Instagram).
export const runtime = "nodejs";

// Drafts can be rewritten by the weekly agent, so they are cached briefly;
// published carousels are frozen.
const CACHE_DRAFT = "public, max-age=60, s-maxage=60";
const CACHE_PUBLISHED = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const RENDERABLE = new Set(["draft", "published"]);

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const search = new URL(request.url).searchParams;

    if (!/^[1-9]\d{0,2}$/.test(id)) return notFound();
    const slideParam = search.get("slide") ?? "1";
    if (!/^\d{1,2}$/.test(slideParam)) return notFound();
    const slide = Number(slideParam);

    let data: FirebaseFirestore.DocumentData | undefined;
    try {
        const snap = await adminDb.collection(CAROUSEL_COLLECTION).doc(id).get();
        data = snap.exists ? snap.data() : undefined;
    } catch (error) {
        console.error("carousel image: failed to load carousel", error);
        return new Response("Error", { status: 500 });
    }
    if (!data || !RENDERABLE.has(data.status)) return notFound();

    const content = toCarouselContent(data);
    if (!content) return notFound();
    if (slide < 1 || slide > carouselSlideCount(content)) return notFound();

    const cacheControl = data.status === "published" ? CACHE_PUBLISHED : CACHE_DRAFT;

    try {
        const assets = await loadCarouselAssets();
        const image = new ImageResponse(<CarouselSlide content={content} index={slide} assets={assets} />, {
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            fonts: assets.fonts,
            headers: { "Cache-Control": cacheControl },
        });
        if (search.get("type") !== "jpeg") return image;

        // Instagram's Graph API only accepts JPEG; sharp ships with Next.js.
        const { default: sharp } = await import("sharp");
        const png = Buffer.from(await image.arrayBuffer());
        const jpeg = await sharp(png).flatten({ background: COLORS.paper }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
        return new Response(new Uint8Array(jpeg), {
            headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl },
        });
    } catch (error) {
        console.error("carousel image: render failed", error);
        return new Response("Error", { status: 500 });
    }
}
