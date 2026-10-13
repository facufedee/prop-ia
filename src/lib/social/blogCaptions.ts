// Suggested social captions for a blog post. Shared by the generator page
// (/social/blog/[id]) and the Make.com auto-publisher (announceBlogPost).
// Plain text only: no emoji, no HTML.

export interface CaptionPost {
    title: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    tags?: string[];
}

const INSTAGRAM_MAX = 2200;
const LINKEDIN_MAX = 3000;
const BRAND_TAG = "#ZetaProp";
const FALLBACK_TAGS = ["#inmobiliarias", "#mercadoinmobiliario", "#alquileres"];

function plainText(value: string | undefined): string {
    return (value ?? "").replace(/<[^>]*>?/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
}

// "Mercado Inmobiliario" -> "#MercadoInmobiliario" (accents and symbols dropped).
function toHashtag(label: string): string | null {
    const words = label
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    if (words.length === 0) return null;
    return `#${words.map((w) => w[0].toUpperCase() + w.slice(1)).join("")}`;
}

function hashtags(post: CaptionPost, min: number, max: number): string[] {
    const candidates = [BRAND_TAG, post.category ?? "", ...(post.tags ?? [])]
        .map((label) => (label.startsWith("#") ? label : toHashtag(label)))
        .filter((tag): tag is string => !!tag && tag.length > 1);
    const result: string[] = [];
    for (const tag of [...candidates, ...FALLBACK_TAGS]) {
        if (result.length >= max) break;
        const isFallback = FALLBACK_TAGS.includes(tag);
        if (isFallback && result.length >= min) break;
        if (!result.some((t) => t.toLowerCase() === tag.toLowerCase())) result.push(tag);
    }
    return result;
}

// Up to two sentences of the excerpt (or the content when there is none).
function summary(post: CaptionPost, max: number): string {
    const source = plainText(post.excerpt) || plainText(post.content);
    const sentences = source.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
    return truncate(sentences.slice(0, 2).join(" "), max);
}

export function buildInstagramCaption(post: CaptionPost): string {
    const tags = hashtags(post, 3, 6).join(" ");
    const cta = "Leé la nota completa: link en la bio.";
    const fixed = cta.length + tags.length + 6; // separators
    const title = truncate(plainText(post.title), 200);
    const body = summary(post, Math.min(400, INSTAGRAM_MAX - fixed - title.length));
    return truncate([title, body, cta, tags].filter(Boolean).join("\n\n"), INSTAGRAM_MAX);
}

export function buildLinkedInCaption(post: CaptionPost, url: string): string {
    const tags = hashtags(post, 1, 3).join(" ");
    const link = `Leé la nota completa: ${url}`;
    const title = truncate(plainText(post.title), 300);
    const fixed = link.length + tags.length + title.length + 6;
    const body = truncate(plainText(post.excerpt) || plainText(post.content), Math.min(1200, LINKEDIN_MAX - fixed));
    return [title, body, link, tags].filter(Boolean).join("\n\n");
}
