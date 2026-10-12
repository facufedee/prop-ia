interface CanonicalInput {
    /** Public host the visitor requested (x-forwarded-host or host). */
    host: string;
    /** Public path before any rewrite (never the internal /sites/{slug} path). */
    pathname: string;
    mainDomain: string;
    /** True when the request is served as an agency site (subdomain or verified custom domain). */
    isAgencySite: boolean;
}

/**
 * Value for the `Link: <...>; rel="canonical"` response header, or null to send none.
 *
 * - Agency sites are canonical on their own host, so each agency keeps its own search ranking.
 * - Platform aliases (www, preview deployments) collapse onto the main domain.
 * - The main domain sends no header: its pages declare canonicals in their metadata.
 */
export function canonicalLinkHeader({ host, pathname, mainDomain, isAgencySite }: CanonicalInput): string | null {
    const normalizedHost = host.trim().toLowerCase().replace(/:\d+$/, "");
    if (!normalizedHost || normalizedHost === mainDomain) return null;

    const canonicalHost = isAgencySite ? normalizedHost : mainDomain;
    return `<https://${canonicalHost}${pathname}>; rel="canonical"`;
}
