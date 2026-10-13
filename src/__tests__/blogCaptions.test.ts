import { describe, it, expect } from 'vitest';
import { buildInstagramCaption, buildLinkedInCaption } from '@/lib/social/blogCaptions';

const EMOJI = /\p{Extended_Pictographic}/u;
const hashtagsOf = (text: string) => text.match(/#[\p{L}\p{N}_]+/gu) ?? [];

const post = {
    title: 'Cómo ajustar alquileres en 2026',
    slug: 'como-ajustar-alquileres-2026',
    excerpt: 'El índice ICL cambió otra vez. Te contamos cómo impacta en tus contratos. Y qué hacer este mes.',
    content: '<p>Contenido largo de la nota.</p>',
    category: 'Mercado Inmobiliario',
    tags: ['Alquileres', 'ICL', 'Zeta Prop'],
};

describe('buildInstagramCaption', () => {
    it('starts with the title, includes the excerpt and a link-in-bio line', () => {
        const caption = buildInstagramCaption(post);
        expect(caption.startsWith(post.title)).toBe(true);
        expect(caption).toContain('El índice ICL cambió otra vez.');
        expect(caption.toLowerCase()).toContain('link en la bio');
    });

    it('derives 3 to 6 unique hashtags from category and tags', () => {
        const tags = hashtagsOf(buildInstagramCaption(post));
        expect(tags.length).toBeGreaterThanOrEqual(3);
        expect(tags.length).toBeLessThanOrEqual(6);
        expect(tags).toContain('#ZetaProp');
        expect(tags).toContain('#MercadoInmobiliario');
        expect(tags).toContain('#Alquileres');
        expect(new Set(tags.map((t) => t.toLowerCase())).size).toBe(tags.length);
    });

    it('pads hashtags to at least 3 when the post has no category or tags', () => {
        const tags = hashtagsOf(buildInstagramCaption({ ...post, category: '', tags: [] }));
        expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    it('caps hashtags at 6 with many tags', () => {
        const many = { ...post, tags: ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete'] };
        expect(hashtagsOf(buildInstagramCaption(many)).length).toBe(6);
    });

    it('falls back to plain-text content when there is no excerpt', () => {
        const caption = buildInstagramCaption({ ...post, excerpt: '' });
        expect(caption).toContain('Contenido largo de la nota.');
        expect(caption).not.toContain('<p>');
    });

    it('stays within 2,200 characters and has no emoji', () => {
        const huge = { ...post, title: 'T'.repeat(3000), excerpt: 'Palabra. '.repeat(1000) };
        const caption = buildInstagramCaption(huge);
        expect(caption.length).toBeLessThanOrEqual(2200);
        expect(EMOJI.test(buildInstagramCaption(post))).toBe(false);
    });
});

describe('buildLinkedInCaption', () => {
    const url = 'https://zetaprop.com.ar/blog/como-ajustar-alquileres-2026';

    it('includes title, excerpt and the post URL', () => {
        const caption = buildLinkedInCaption(post, url);
        expect(caption.startsWith(post.title)).toBe(true);
        expect(caption).toContain(post.excerpt);
        expect(caption).toContain(url);
    });

    it('uses at most 3 hashtags', () => {
        const tags = hashtagsOf(buildLinkedInCaption(post, url));
        expect(tags.length).toBeGreaterThanOrEqual(1);
        expect(tags.length).toBeLessThanOrEqual(3);
    });

    it('stays within 3,000 characters, keeps the URL and has no emoji', () => {
        const caption = buildLinkedInCaption({ ...post, excerpt: 'Texto. '.repeat(2000) }, url);
        expect(caption.length).toBeLessThanOrEqual(3000);
        expect(caption).toContain(url);
        expect(EMOJI.test(buildLinkedInCaption(post, url))).toBe(false);
    });
});
