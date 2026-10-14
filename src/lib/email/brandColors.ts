/**
 * Brand colors for HTML emails.
 *
 * Email clients don't support CSS custom properties or oklch(), so these are
 * sRGB hex conversions of the landing/dashboard tokens declared in
 * `src/ui/sections/landing-theme.css` (`.landing-page, .app-theme`).
 * Converted with the standard OKLab -> linear sRGB -> gamma-encoded sRGB
 * formulas (Björn Ottosson) and rounded to 8-bit channels.
 *
 * Emails keep a light body for deliverability/readability; brand elements
 * (header bar, buttons, links, accents) use these values.
 */
export const BRAND_COLORS = {
    /** --color-paper: oklch(17% 0.006 70) — header bar / dark surfaces */
    paper: "#110f0d",
    /** --color-paper-2: oklch(21% 0.007 70) */
    paper2: "#1a1815",
    /** --color-ink: oklch(95% 0.012 85) — text on dark surfaces */
    ink: "#f2eee6",
    /** --color-muted: oklch(68% 0.012 75) — secondary text on dark surfaces */
    muted: "#9d9790",
    /** --color-accent: oklch(76% 0.085 72) — bronze (buttons, wordmark "Prop") */
    accent: "#d3a974",
    /** --color-accent-ink: oklch(17% 0.006 70) — text on bronze */
    accentInk: "#110f0d",
    /** --color-rule: oklch(31% 0.008 70) — dividers on dark surfaces */
    rule: "#33302c",
} as const;

/**
 * Light-body email palette derived from the tokens above. Not landing tokens:
 * values chosen for readability on a white background.
 */
export const EMAIL_COLORS = {
    /** Page background around the card. */
    canvas: "#f4f2ee",
    /** Card/body background. */
    body: "#ffffff",
    /** Primary body text (same as --color-paper, the brand's darkest tone). */
    text: BRAND_COLORS.paper,
    /** Secondary body text on white. */
    textMuted: "#5f5a53",
    /** Hairlines on white. */
    border: "#e6e1d8",
    /** Soft bronze panel background on white. */
    accentSoft: "#f7efe3",
    /**
     * Bronze for text links on white: oklch(50% 0.085 70) => #825a27.
     * The landing bronze (#d3a974) is too light for text on white (contrast < 3:1).
     */
    link: "#825a27",
    /** Header bar: paper background, ink text, bronze accent. */
    headerBg: BRAND_COLORS.paper,
    headerText: BRAND_COLORS.ink,
    /** Primary buttons: bronze background, dark text. */
    buttonBg: BRAND_COLORS.accent,
    buttonText: BRAND_COLORS.accentInk,
} as const;

/**
 * Text wordmark for email headers ("Zeta" in ink + "Prop" in bronze).
 * Used instead of the PNG logo, whose "Prop" is still indigo.
 */
export function emailWordmarkHtml(fontSize = 24): string {
    return `<span style="font-family:Arial,Helvetica,sans-serif;font-size:${fontSize}px;font-weight:700;letter-spacing:-0.5px;color:${BRAND_COLORS.ink};">Zeta<span style="color:${BRAND_COLORS.accent};">Prop</span></span>`;
}

/**
 * Dark header bar carrying the text wordmark, built as a table with `bgcolor`
 * so clients that ignore CSS backgrounds on <div> (Outlook desktop) still
 * render the dark bar behind the light "Zeta" text.
 */
export function emailHeaderBarHtml(href?: string, fontSize = 24): string {
    const mark = emailWordmarkHtml(fontSize);
    const content = href ? `<a href="${href}" style="text-decoration:none;">${mark}</a>` : mark;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background-color:${EMAIL_COLORS.headerBg};border-radius:10px;"><tr><td bgcolor="${EMAIL_COLORS.headerBg}" align="center" style="padding:18px 24px;border-radius:10px;border-bottom:3px solid ${EMAIL_COLORS.buttonBg};">${content}</td></tr></table>`;
}
