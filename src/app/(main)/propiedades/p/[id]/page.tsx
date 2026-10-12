import { notFound, permanentRedirect } from 'next/navigation'
import { loadPublicProperty } from '@/app/(main)/[operation]/[slug]/propertySeo'
import { propertyPath } from '@/lib/seo/propertyUrl'

type Props = {
    params: Promise<{ id: string }>
}

// Legacy URL: the detail lives at /{venta|alquiler}/{slug}-{id}. 308 so links and bookmarks keep working.
export default async function Page({ params }: Props) {
    const { id } = await params
    const property = await loadPublicProperty(id)
    if (!property) notFound()
    permanentRedirect(propertyPath(property))
}
