// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CAROUSEL_CATEGORIES, CAROUSEL_TOPICS, PUBLISH_ORDER, getTopic, nextTopic } from '@/lib/social/carouselTopics';

describe('carousel topic bank', () => {
    it('holds 100 uniquely numbered topics, 20 per category', () => {
        expect(CAROUSEL_TOPICS).toHaveLength(100);
        expect(new Set(CAROUSEL_TOPICS.map((t) => t.number)).size).toBe(100);
        expect(CAROUSEL_CATEGORIES).toHaveLength(5);
        for (const category of CAROUSEL_CATEGORIES) {
            expect(CAROUSEL_TOPICS.filter((t) => t.category === category)).toHaveLength(20);
        }
    });

    it('matches docs/marketing/carrusel-temas.md exactly', () => {
        const doc = fs.readFileSync(path.resolve(__dirname, '../../docs/marketing/carrusel-temas.md'), 'utf8');
        const fromDoc: Array<{ number: number; category: string; title: string }> = [];
        let category = '';
        for (const line of doc.split(/\r?\n/)) {
            const heading = line.match(/^## (.+)/);
            if (heading) category = heading[1].trim();
            const item = line.match(/^(\d+)\. (.+)/);
            if (item && category) fromDoc.push({ number: Number(item[1]), category, title: item[2].trim() });
        }
        expect(CAROUSEL_TOPICS.map((t) => ({ ...t }))).toEqual(fromDoc);
    });

    it('interleaves categories in the publish order', () => {
        expect(PUBLISH_ORDER).toHaveLength(100);
        expect(PUBLISH_ORDER.slice(0, 7)).toEqual([1, 21, 41, 61, 81, 2, 22]);
        expect(PUBLISH_ORDER.slice(-2)).toEqual([80, 100]);
        expect(new Set(PUBLISH_ORDER).size).toBe(100);
    });

    it('looks topics up by number', () => {
        expect(getTopic(21)?.category).toBe('Alquileres y administración');
        expect(getTopic(0)).toBeNull();
        expect(getTopic(101)).toBeNull();
    });
});

describe('nextTopic', () => {
    it('starts with topic 1', () => {
        expect(nextTopic([])?.number).toBe(1);
    });

    it('follows the interleaved order', () => {
        expect(nextTopic([1])?.number).toBe(21);
        expect(nextTopic([1, 21, 41, 61, 81])?.number).toBe(2);
    });

    it('fills gaps before moving on', () => {
        expect(nextTopic([1, 41, 61])?.number).toBe(21);
    });

    it('ignores unknown numbers and accepts any iterable', () => {
        expect(nextTopic(new Set([999, 1]))?.number).toBe(21);
    });

    it('returns null when every topic was drafted', () => {
        expect(nextTopic(PUBLISH_ORDER)).toBeNull();
    });
});
