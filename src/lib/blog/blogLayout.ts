// Pure helpers for the public blog index layout (no Firebase imports).

const WORDS_PER_MINUTE = 200;

export function getReadingMinutes(content: string): number {
    const text = (content || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // markdown images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links -> label
        .replace(/<[^>]+>/g, ' ') // html tags
        .replace(/[#*`_>~-]/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Normalizes Date, Firestore Timestamp (or its serialized shape) and date strings. */
export function toPostDate(value: unknown): Date | null {
    if (!value) return null;
    let date: Date | null = null;
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === 'object') {
        const v = value as { toDate?: () => Date; seconds?: number };
        if (typeof v.toDate === 'function') date = v.toDate();
        else if (typeof v.seconds === 'number') date = new Date(v.seconds * 1000);
    } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
    }
    return date && !Number.isNaN(date.getTime()) ? date : null;
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
});

export function formatPostDate(date: Date): string {
    return dateFormatter.format(date).replace(/ de /g, ' ');
}

export interface BlogLayoutOptions {
    latestCount?: number;
    minCarouselPosts?: number;
    maxCarousels?: number;
}

export interface BlogLayout<T> {
    featured: T | null;
    latest: T[];
    rest: T[];
    carousels: { category: string; posts: T[] }[];
    categories: string[];
}

export function buildBlogLayout<T extends { category: string }>(
    posts: T[],
    { latestCount = 4, minCarouselPosts = 3, maxCarousels = 2 }: BlogLayoutOptions = {},
): BlogLayout<T> {
    const byCategory = new Map<string, T[]>();
    for (const post of posts) {
        if (!post.category) continue;
        const list = byCategory.get(post.category) ?? [];
        list.push(post);
        byCategory.set(post.category, list);
    }
    // Stable sort keeps first-seen order (most recent) on ties.
    const ranked = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

    return {
        featured: posts[0] ?? null,
        latest: posts.slice(1, 1 + latestCount),
        rest: posts.slice(1 + latestCount),
        carousels: ranked
            .filter(([, list]) => list.length >= minCarouselPosts)
            .slice(0, maxCarousels)
            .map(([category, list]) => ({ category, posts: list })),
        categories: ranked.map(([category]) => category),
    };
}
