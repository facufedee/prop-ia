// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    createUnsubscribeToken,
    verifyUnsubscribeToken,
    buildUnsubscribeUrl,
    buildOneClickUnsubscribeUrl,
} from '../lib/unsubscribeToken';

describe('unsubscribeToken', () => {
    const originalSecret = process.env.CRON_SECRET;

    beforeEach(() => {
        process.env.CRON_SECRET = 'test-secret';
    });

    afterEach(() => {
        process.env.CRON_SECRET = originalSecret;
    });

    it('verifies a token it created for the same user', () => {
        const token = createUnsubscribeToken('user-1');
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(verifyUnsubscribeToken('user-1', token)).toBe(true);
    });

    it('rejects a tampered token', () => {
        const token = createUnsubscribeToken('user-1');
        const tampered = (token[0] === 'A' ? 'B' : 'A') + token.slice(1);
        expect(verifyUnsubscribeToken('user-1', tampered)).toBe(false);
        expect(verifyUnsubscribeToken('user-1', token.slice(0, -2))).toBe(false);
        expect(verifyUnsubscribeToken('user-1', '')).toBe(false);
    });

    it('rejects a token issued for a different user', () => {
        const token = createUnsubscribeToken('user-1');
        expect(verifyUnsubscribeToken('user-2', token)).toBe(false);
    });

    it('rejects tokens signed with a different secret', () => {
        const token = createUnsubscribeToken('user-1');
        process.env.CRON_SECRET = 'rotated-secret';
        expect(verifyUnsubscribeToken('user-1', token)).toBe(false);
    });

    it('throws when CRON_SECRET is not set', () => {
        delete process.env.CRON_SECRET;
        expect(() => createUnsubscribeToken('user-1')).toThrow(/CRON_SECRET/);
    });

    it('builds page and one-click URLs with encoded params', () => {
        const token = createUnsubscribeToken('a b/c');
        const page = new URL(buildUnsubscribeUrl('a b/c'));
        expect(page.origin + page.pathname).toBe('https://zetaprop.com.ar/unsubscribe');
        expect(page.searchParams.get('u')).toBe('a b/c');
        expect(page.searchParams.get('t')).toBe(token);

        const oneClick = new URL(buildOneClickUnsubscribeUrl('a b/c'));
        expect(oneClick.origin + oneClick.pathname).toBe('https://zetaprop.com.ar/api/newsletter/unsubscribe');
        expect(oneClick.searchParams.get('u')).toBe('a b/c');
        expect(oneClick.searchParams.get('t')).toBe(token);
    });
});
