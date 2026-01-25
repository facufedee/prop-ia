
import type { Metadata, ResolvingMetadata } from 'next'
import PropertyDetailClient from '@/app/(main)/propiedades/p/[id]/PropertyDetailClient'
import { publicService } from "@/infrastructure/services/publicService"
import { notFound, permanentRedirect } from "next/navigation"

type Props = {
    params: Promise<{ operation: string; slug: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Logic to extract ID from slug (Project Standard: slug-ID)
function getIdFromSlug(slug: string): string {
    const parts = slug.split('-');
    return parts[parts.length - 1];
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { operation, slug } = await params;
    const id = getIdFromSlug(slug);

    // Fetch property content
    let property = null;
    try {
        property = await publicService.getPropertyById(id);
    } catch (error) {
        console.error("Error fetching property for metadata:", error);
    }

    if (!property) {
        return {
            title: 'Propiedad no encontrada | Zeta Prop',
            robots: { index: false }
        }
    }

    // Verify operation match to avoid duplicates if user changes URL manually
    // e.g. /alquiler/casa-venta-123 should probably canonicalize or 404. 
    // ideally strict check: property.operation_type.toLowerCase() === operation.toLowerCase()

    // Access parent metadata to extend (optional)
    const previousImages = (await parent).openGraph?.images || []

    let coverImage = '/assets/img/Logo ZetaProp Fondo Blanco 2.png';
    if (property.imageUrls && property.imageUrls.length > 0) {
        coverImage = property.imageUrls[0];
    }

    const price = property.currency + ' ' + property.price.toLocaleString('es-AR');

    // Schema Markups
    const getType = (t: string = '') => {
        const lower = t.toLowerCase();
        if (lower.includes('casa')) return 'SingleFamilyResidence';
        if (lower.includes('departamento') || lower.includes('depto')) return 'Apartment';
        if (lower.includes('terreno') || lower.includes('lote')) return 'Landform';
        if (lower.includes('oficina')) return 'Office';
        return 'RealEstateListing';
    };

    const schemaType = getType(property.type || property.title);

    const schema = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        'name': property.title,
        'image': property.imageUrls || [],
        'description': property.description,
        'url': `https://zetaprop.com.ar/${operation}/${slug}`,
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': property.localidad,
            'addressRegion': property.provincia,
            'addressCountry': 'AR'
        },
        'offers': {
            '@type': 'Offer',
            'price': property.price,
            'priceCurrency': property.currency,
            'priceValidUntil': new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            'availability': 'https://schema.org/InStock'
        }
    };

    return {
        title: `${property.operation_type} de ${property.title} en ${property.localidad} | Zeta Prop`,
        description: `Encontrá este ${property.title} en ${property.localidad}. Precio: ${price}. ${property.description ? property.description.substring(0, 150) + '...' : ''} Contactanos.`,
        openGraph: {
            title: `${property.title} | ${property.operation_type} en ${property.localidad}`,
            description: `Mira esta propiedad en Zeta Prop: ${property.title}. Precio: ${price}`,
            images: [coverImage, ...previousImages],
            type: 'website',
        },
        alternates: {
            canonical: `https://zetaprop.com.ar/${operation}/${slug}`
        },
        other: {
            'script:ld+json': JSON.stringify(schema)
        }
    }
}

export default async function Page({ params }: Props) {
    const { operation, slug } = await params;
    const id = getIdFromSlug(slug);

    // Validation: Check if property exists
    const property = await publicService.getPropertyById(id);

    if (!property) {
        notFound();
    }

    // Strict URL check: If operation in URL doesn't match property operation, redirect to correct one
    const cleanOperation = property.operation_type.toLowerCase() === 'venta' ? 'venta' :
        property.operation_type.toLowerCase() === 'alquiler' ? 'alquiler' :
            property.operation_type.toLowerCase().includes('temporal') ? 'temporal' : 'propiedad';

    // Basic check for operation specific landing
    // Note: We might want to be more lenient, but for strict SEO, 301 is best if mismatch.
    // For now, let's just render.

    return (
        <>
            {/* Inject JSON-LD Schema explicitly in body if metadata injection fails or for rich snippets */}
            {/* Structured data now handled entirely in generateMetadata */}
            <PropertyDetailClient id={id} />
        </>
    )
}
