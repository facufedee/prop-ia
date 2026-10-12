import { cache } from 'react';
import { publicService, type PublicProperty } from '@/infrastructure/services/publicService';
import { toPostDate } from '@/lib/blog/blogLayout';
import { absolutePropertyUrl, propertyOperationSegment, SITE_URL } from '@/lib/seo/propertyUrl';
import { formatPropertyPrice } from '@/ui/utils/propertyPrice';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/** One Firestore read per request, shared by generateMetadata and the page. */
export const loadPublicProperty = cache(async (id: string): Promise<PublicProperty | null> => {
    if (!id) return null;
    try {
        const property = await publicService.getPropertyById(id);
        return property ? toSerializable(property) : null;
    } catch (error) {
        console.error('Error fetching property:', error);
        return null;
    }
});

/**
 * Converts Firestore values (Timestamp, GeoPoint, class instances) into plain JSON so the
 * property can cross the server → client component boundary. Timestamps become ISO strings.
 */
export function toSerializable<T>(value: T): T {
    return convert(value) as T;
}

function convert(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(convert);

    const v = value as { toDate?: () => Date; seconds?: unknown; nanoseconds?: unknown; latitude?: unknown; longitude?: unknown };
    if (typeof v.toDate === 'function' || (typeof v.seconds === 'number' && typeof v.nanoseconds === 'number')) {
        return toPostDate(value)?.toISOString() ?? null;
    }
    if (typeof v.latitude === 'number' && typeof v.longitude === 'number' && Object.keys(value).length <= 2) {
        return { latitude: v.latitude, longitude: v.longitude };
    }

    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'function') continue;
        out[key] = convert(entry);
    }
    return out;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function truncateAtWord(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** "{title} – {localidad}", without repeating the locality and capped before the brand template. */
export function buildPropertyTitle(property: Pick<PublicProperty, 'title' | 'localidad'>): string {
    const title = (property.title || 'Propiedad').trim();
    const locality = (property.localidad || '').trim();
    const suffix = locality && !normalize(title).includes(normalize(locality)) ? ` – ${locality}` : '';
    return `${truncateAtWord(title, TITLE_MAX - suffix.length)}${suffix}`;
}

/** Plain-text description (markdown and whitespace stripped), ~155 chars, with a data-built fallback. */
export function buildPropertyDescription(property: PublicProperty): string {
    const text = (property.description || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#*_`>~|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length >= 50) return truncateAtWord(text, DESCRIPTION_MAX);

    const operation = propertyOperationSegment(property.operation_type) === 'alquiler' ? 'en alquiler' : 'en venta';
    const place = [property.localidad, property.provincia].filter(Boolean).join(', ');
    const price = formatPropertyPrice(property.price, property.currency, property.hidePrice);
    const parts = [
        `${property.type || 'Propiedad'} ${operation}${place ? ` en ${place}` : ''}.`,
        price !== 'Consultar Precio' ? `Precio: ${price}.` : '',
        'Fotos, características y contacto con la inmobiliaria en Zeta Prop.',
    ];
    return truncateAtWord(parts.filter(Boolean).join(' '), DESCRIPTION_MAX);
}

/** schema.org type for the offered item. Non-residential types fall back to Place. */
function itemOfferedType(type: string): string {
    const t = normalize(type);
    if (/terreno|lote|campo|local|oficina|galpon|deposito|cochera|comercio|consultorio|boveda|nautica|edificio|hotel|negocio|isla/.test(t)) return 'Place';
    if (/departamento|depto|ph|monoambiente/.test(t)) return 'Apartment';
    if (/casa|chalet|quinta|duplex/.test(t)) return 'House';
    return 'Accommodation';
}

/** RealEstateListing + BreadcrumbList as one JSON-LD graph. No ratings or reviews. */
export function buildPropertyJsonLd(property: PublicProperty) {
    const url = absolutePropertyUrl(property);
    const isRent = propertyOperationSegment(property.operation_type) === 'alquiler';
    const hasPrice = !property.hidePrice && Number(property.price) > 0;
    const datePosted = toPostDate(property.createdAt);
    const itemType = itemOfferedType(property.type || property.title || '');
    const isAccommodation = itemType !== 'Place';
    const area = Number(property.area_covered);
    const rooms = Number(property.rooms);

    const address = {
        '@type': 'PostalAddress',
        ...(property.localidad ? { addressLocality: property.localidad } : {}),
        ...(property.provincia ? { addressRegion: property.provincia } : {}),
        addressCountry: 'AR',
    };

    const itemOffered = {
        '@type': itemType,
        name: property.title,
        address,
        ...(isAccommodation && area > 0 ? { floorSize: { '@type': 'QuantitativeValue', value: area, unitCode: 'MTK' } } : {}),
        ...(isAccommodation && rooms > 0 ? { numberOfRooms: rooms } : {}),
    };

    const listing = {
        '@type': 'RealEstateListing',
        '@id': `${url}#listing`,
        name: property.title,
        description: buildPropertyDescription(property),
        url,
        ...(property.imageUrls?.length ? { image: property.imageUrls } : {}),
        ...(datePosted ? { datePosted: datePosted.toISOString().split('T')[0] } : {}),
        offers: {
            '@type': 'Offer',
            ...(hasPrice ? { price: Number(property.price), priceCurrency: property.currency || 'USD' } : {}),
            availability: property.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            businessFunction: isRent ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
            itemOffered,
        },
    };

    const breadcrumbs = {
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Propiedades', item: `${SITE_URL}/propiedades` },
            { '@type': 'ListItem', position: 3, name: property.title, item: url },
        ],
    };

    return { '@context': 'https://schema.org', '@graph': [listing, breadcrumbs] };
}
