import { describe, it, expect } from 'vitest';
import { isBotUserAgent, dayKey, pruneViewsByDay } from '@/lib/propertyViews';

describe('isBotUserAgent', () => {
    it.each([
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'WhatsApp/2.23.20.0',
        'TelegramBot (like TwitterBot)',
        'Mozilla/5.0 (compatible; AhrefsBot/7.0)',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11) Chrome-Lighthouse',
        'curl/8.4.0',
        'Wget/1.21',
        'python-requests/2.31',
        'Some random spider',
    ])('flags %s as a bot', (ua) => {
        expect(isBotUserAgent(ua)).toBe(true);
    });

    it('treats an empty or missing user agent as a bot', () => {
        expect(isBotUserAgent('')).toBe(true);
        expect(isBotUserAgent(null)).toBe(true);
        expect(isBotUserAgent(undefined)).toBe(true);
    });

    it.each([
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:130.0) Gecko/20100101 Firefox/130.0',
    ])('counts real browser %s', (ua) => {
        expect(isBotUserAgent(ua)).toBe(false);
    });
});

describe('dayKey', () => {
    it('formats a UTC date as YYYY-MM-DD', () => {
        expect(dayKey(new Date('2026-10-04T23:30:00Z'))).toBe('2026-10-04');
        expect(dayKey(new Date('2026-01-31T00:00:00Z'))).toBe('2026-01-31');
    });
});

describe('pruneViewsByDay', () => {
    const today = new Date('2026-10-14T12:00:00Z');

    it('returns the keys older than the window so they can be deleted', () => {
        const map = { '2026-10-14': 3, '2026-07-17': 1, '2026-07-16': 2, '2025-12-01': 5 };
        expect(pruneViewsByDay(map, today, 90).sort()).toEqual(['2025-12-01', '2026-07-16']);
    });

    it('ignores malformed keys and handles empty maps', () => {
        expect(pruneViewsByDay({ nope: 1 }, today, 90)).toEqual([]);
        expect(pruneViewsByDay(undefined, today, 90)).toEqual([]);
    });
});
