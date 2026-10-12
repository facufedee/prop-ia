import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { publicService } from '@/infrastructure/services/publicService'
import { loadPublicProperty, toSerializable } from '@/app/(main)/[operation]/[slug]/propertySeo'
import { propertyPath, SITE_URL } from '@/lib/seo/propertyUrl'
import AgencyPropertiesClient from './AgencyPropertiesClient'

type Props = {
    params: Promise<{ slug: string }>
}

/** Agency listing for /propiedades/{agencySlug}; shared by metadata and page within one request. */
const loadAgencyListing = cache(async (slug: string) => {
    try {
        const result = await publicService.getPropertiesByAgencySlug(slug)
        return result ? toSerializable(result) : null
    } catch (error) {
        console.error('Error fetching agency listing:', error)
        return null
    }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const listing = await loadAgencyListing(slug)
    if (!listing) return { robots: { index: false, follow: true } }

    const name = listing.agency.agencyName || listing.agency.displayName
    const url = `${SITE_URL}/propiedades/${slug}`
    const title = `Propiedades de ${name}`
    const description = `Propiedades en venta y alquiler publicadas por ${name} en Zeta Prop. Mirá fotos, precios y características, y contactá a la inmobiliaria.`

    return {
        // The (main) layout template appends the brand.
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url },
        twitter: { card: 'summary', title, description },
    }
}

export default async function Page({ params }: Props) {
    const { slug } = await params
    const listing = await loadAgencyListing(slug)

    if (!listing) {
        // Legacy property links used /propiedades/{propertyId}.
        const property = await loadPublicProperty(slug)
        if (property) permanentRedirect(propertyPath(property))
        notFound()
    }

    return <AgencyPropertiesClient slug={slug} initialData={listing} />
}
