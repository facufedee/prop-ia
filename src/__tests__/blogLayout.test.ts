// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
    getReadingMinutes,
    toPostDate,
    formatPostDate,
    buildBlogLayout,
    pickRelatedPosts,
} from '@/lib/blog/blogLayout';

describe('getReadingMinutes', () => {
    it('returns at least one minute for short or empty content', () => {
        expect(getReadingMinutes('')).toBe(1);
        expect(getReadingMinutes('Hola mundo')).toBe(1);
    });

    it('rounds up at ~200 words per minute', () => {
        expect(getReadingMinutes(Array(401).fill('palabra').join(' '))).toBe(3);
    });

    it('ignores markdown, html tags and image urls', () => {
        const words = Array(200).fill('texto').join(' ');
        const content = `## Título\n<p>${words}</p>\n![alt](https://example.com/img.png)`;
        expect(getReadingMinutes(content)).toBe(2);
    });
});

describe('toPostDate', () => {
    it('accepts Date, Timestamp-like objects and serialized seconds', () => {
        const d = new Date('2026-10-01T12:00:00Z');
        expect(toPostDate(d)?.getTime()).toBe(d.getTime());
        expect(toPostDate({ toDate: () => d })?.getTime()).toBe(d.getTime());
        expect(toPostDate({ seconds: d.getTime() / 1000 })?.getTime()).toBe(d.getTime());
    });

    it('returns null for missing or invalid values', () => {
        expect(toPostDate(undefined)).toBeNull();
        expect(toPostDate('not a date')).toBeNull();
    });
});

describe('formatPostDate', () => {
    it('formats in es-AR using Buenos Aires time', () => {
        // 02:00 UTC on Oct 2 is still Oct 1 in Buenos Aires (UTC-3)
        const label = formatPostDate(new Date('2026-10-02T02:00:00Z'));
        expect(label).toMatch(/^1 oct\.? 2026$/);
    });
});

type P = { slug: string; category: string };
const post = (slug: string, category: string): P => ({ slug, category });

describe('buildBlogLayout', () => {
    it('handles an empty list', () => {
        const layout = buildBlogLayout<P>([]);
        expect(layout.featured).toBeNull();
        expect(layout.latest).toEqual([]);
        expect(layout.rest).toEqual([]);
        expect(layout.carousels).toEqual([]);
        expect(layout.categories).toEqual([]);
    });

    it('splits featured, latest and rest preserving order', () => {
        const posts = Array.from({ length: 8 }, (_, i) => post(`p${i}`, 'Novedades'));
        const layout = buildBlogLayout(posts);
        expect(layout.featured?.slug).toBe('p0');
        expect(layout.latest.map((p) => p.slug)).toEqual(['p1', 'p2', 'p3', 'p4']);
        expect(layout.rest.map((p) => p.slug)).toEqual(['p5', 'p6', 'p7']);
    });

    it('only builds carousels for categories with enough posts, largest first, capped', () => {
        const posts = [
            post('a1', 'Tutoriales'), post('b1', 'Mercado'), post('c1', 'Eventos'),
            post('a2', 'Tutoriales'), post('b2', 'Mercado'), post('c2', 'Eventos'),
            post('a3', 'Tutoriales'), post('b3', 'Mercado'), post('d1', 'Novedades'),
            post('a4', 'Tutoriales'), post('c3', 'Eventos'),
        ];
        const layout = buildBlogLayout(posts, { maxCarousels: 2 });
        expect(layout.carousels.map((c) => c.category)).toEqual(['Tutoriales', 'Mercado']);
        expect(layout.carousels[0].posts.map((p) => p.slug)).toEqual(['a1', 'a2', 'a3', 'a4']);
    });

    it('lists unique categories sorted by post count', () => {
        const posts = [post('1', 'B'), post('2', 'A'), post('3', 'A'), post('4', '')];
        expect(buildBlogLayout(posts).categories).toEqual(['A', 'B']);
    });
});

describe("pickRelatedPosts", () => {
    const posts = [
        post("cur", "A"), post("b1", "B"), post("a1", "A"), post("b2", "B"), post("a2", "A"), post("c1", "C"),
    ];

    it("excludes the current post and prefers the same category, then fills by recency", () => {
        expect(pickRelatedPosts(posts, "cur", 3).map((p) => p.slug)).toEqual(["a1", "a2", "b1"]);
    });

    it("returns fewer when there are not enough posts", () => {
        expect(pickRelatedPosts([post("cur", "A"), post("x", "B")], "cur", 3).map((p) => p.slug)).toEqual(["x"]);
    });
});
