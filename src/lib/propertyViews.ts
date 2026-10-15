// Pure helpers for the public property view counter (see src/app/api/properties/[id]/view/route.ts).

// Crawlers, link-preview fetchers, SEO tools, headless browsers and plain HTTP clients.
// Generic tokens ("bot", "spider", "crawl") cover most long-tail crawlers.
const BOT_UA_PATTERN =
    /bot\b|bot\/|spider|crawl|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|ahrefs|semrush|mj12|petalbot|headless|lighthouse|pagespeed|prerender|preview|curl\/|wget\/|python-requests|python-urllib|axios\/|node-fetch|go-http-client|okhttp|java\/|libwww|httpclient|postman/i;

/** True for crawlers, link previews, automation and empty/missing user agents. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
    if (!ua || !ua.trim()) return true;
    return BOT_UA_PATTERN.test(ua);
}

/** UTC calendar day as `YYYY-MM-DD`, used as the key of `viewsByDay`. */
export function dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns the `viewsByDay` keys that fall outside the last `keepDays` days (today included),
 * so the caller can delete them and keep the map bounded.
 */
export function pruneViewsByDay(
    map: Record<string, unknown> | null | undefined,
    today: Date,
    keepDays: number
): string[] {
    if (!map) return [];
    const cutoff = new Date(today.getTime());
    cutoff.setUTCDate(cutoff.getUTCDate() - (keepDays - 1));
    const cutoffKey = dayKey(cutoff);
    return Object.keys(map).filter((key) => DAY_KEY_PATTERN.test(key) && key < cutoffKey);
}
