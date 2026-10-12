import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import PropertyDetailClient from '@/app/(main)/propiedades/p/[id]/PropertyDetailClient'
import JsonLd from '@/ui/seo/JsonLd'
import { absolutePropertyUrl, propertyIdFromSlug, propertyPath } from '@/lib/seo/propertyUrl'
import {
    buildPropertyDescription,
    buildPropertyJsonLd,
    buildPropertyTitle,
    loadPublicProperty,
} from './propertySeo'

type Props = {
    params: Promise<{ operation: string; slug: string }>
}

// Current segments plus the legacy ones the old sitemap emitted ("temporal", "propiedad").
// Anything else is not a property URL, so it 404s without hitting Firestore.
const PROPERTY_OPERATION_SEGMENTS = new Set(['venta', 'alquiler', 'temporal', 'propiedad'])

async function resolveProperty(params: Props['params']) {
    const { operation, slug } = await params
    if (!PROPERTY_OPERATION_SEGMENTS.has(operation)) return null
    const property = await loadPublicProperty(propertyIdFromSlug(slug))
    return property ? { property, requestedPath: `/${operation}/${slug}` } : null
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const resolved = await resolveProperty(params)
    if (!resolved) {
        return { title: 'Propiedad no encontrada', robots: { index: false, follow: false } }
    }
    const { property } = resolved

    // First listing photo; without one, omit images so the file-based opengraph-image applies.
    const coverImage = property.imageUrls?.[0]
    const canonical = absolutePropertyUrl(property)
    const title = buildPropertyTitle(property)
    const description = buildPropertyDescription(property)

    return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
            title,
            description,
            url: canonical,
            ...(coverImage ? { images: [coverImage] } : {}),
            type: 'website',
        },
    }
}

export default async function Page({ params }: Props) {
    const resolved = await resolveProperty(params)
    if (!resolved) notFound()

    const { property, requestedPath } = resolved
    const canonicalPath = propertyPath(property)
    if (requestedPath !== canonicalPath) permanentRedirect(canonicalPath)

    return (
        <>
            <JsonLd data={buildPropertyJsonLd(property)} />
            <PropertyDetailClient id={property.id} initialProperty={property} />
        </>
    )
}
