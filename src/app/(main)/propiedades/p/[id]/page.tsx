
import type { Metadata, ResolvingMetadata } from 'next'
import PropertyDetailClient from './PropertyDetailClient'
import { publicService } from "@/infrastructure/services/publicService"

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = (await params).id

    // Fetch property content
    let property = null;
    try {
        property = await publicService.getPropertyById(id);
    } catch (error) {
        console.error("Error fetching property for metadata:", error);
    }

    if (!property) {
        return {
            title: 'Propiedad no encontrada | Zeta Prop'
        }
    }

    // Access parent metadata to extend (optional)
    const previousImages = (await parent).openGraph?.images || []

    let coverImage = '/assets/img/Logo ZetaProp Fondo Blanco 2.png';
    if (property.imageUrls && property.imageUrls.length > 0) {
        coverImage = property.imageUrls[0];
    }

    const price = property.currency + ' ' + property.price.toLocaleString('es-AR');

    return {
        title: `${property.operation_type} de ${property.title} en ${property.localidad} | Zeta Prop`,
        description: `Encontrá este ${property.title} en ${property.localidad}. Precio: ${price}. ${property.description ? property.description.substring(0, 100) + '...' : ''} Contactanos.`,
        openGraph: {
            images: [coverImage, ...previousImages],
        },
    }
}

export default async function Page({ params }: Props) {
    return <PropertyDetailClient />
}
