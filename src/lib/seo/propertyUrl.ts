/**
 * Single source of truth for public property URLs on the main portal.
 *
 * Canonical format: /{venta|alquiler}/{slugified-title}-{id}
 * Every internal link, the sitemap, feeds and redirects must go through here so
 * Google only ever sees one URL per listing.
 */

export const SITE_URL = 'https://zetaprop.com.ar';

const MAX_SLUG_LENGTH = 80;
const FALLBACK_SLUG = 'propiedad';

export type PropertyOperationSegment = 'venta' | 'alquiler';

/** Minimal shape needed to build a property URL. */
export interface PropertyUrlInput {
    id: string;
    title?: string | null;
    operation_type?: string | null;
}

/** Accent-safe slug: "Gestión Ñandú" → "gestion-nandu". */
export function propertySlug(title: string | null | undefined): string {
    const slug = (title ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_SLUG_LENGTH)
        .replace(/-+$/g, '');
    return slug || FALLBACK_SLUG;
}

/**
 * Maps the stored operation ("Venta" | "Alquiler" | "Alquiler Temporal") to its URL segment.
 * Temporary rentals are rentals for the portal; anything unknown is listed as a sale.
 */
export function propertyOperationSegment(operationType: string | null | undefined): PropertyOperationSegment {
    const op = (operationType ?? '').toLowerCase();
    if (op.includes('alquiler') || op.includes('temporal') || op.includes('temporario')) return 'alquiler';
    return 'venta';
}

/** Relative canonical path, e.g. "/venta/casa-en-moreno-abc123". */
export function propertyPath(property: PropertyUrlInput): string {
    return `/${propertyOperationSegment(property.operation_type)}/${propertySlug(property.title)}-${property.id}`;
}

/** Absolute canonical URL on the main domain. */
export function absolutePropertyUrl(property: PropertyUrlInput): string {
    return `${SITE_URL}${propertyPath(property)}`;
}

/** Extracts the property id from a "{slug}-{id}" segment (ids never contain dashes). */
export function propertyIdFromSlug(slug: string): string {
    const parts = slug.split('-');
    return parts[parts.length - 1];
}
