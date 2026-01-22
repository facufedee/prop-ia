import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { xmlFeedService } from "@/infrastructure/services/xmlFeedService";
import { Property, PropertyOperation, PropertyType } from "@/domain/models/Property";

// Revalidate every 1 hour (3600 seconds) or as needed
export const revalidate = 3600;

// Allow larger responses
export const maxDuration = 60;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Correct type for Next.js 15+ App Router params
) {
    const { id } = await params;

    if (!id) {
        return new NextResponse('Missing ID', { status: 400 });
    }

    try {
        // 1. Fetch properties
        // We use Admin SDK to bypass potential client-side rules and ensuring we get all data.
        // Querying for local properties
        const propertiesRef = adminDb.collection('properties');
        const snapshot = await propertiesRef
            .where('userId', '==', id)
            .where('status', '==', 'active') // Only published/active properties
            .get();

        if (snapshot.empty) {
            // Return empty feed structure instead of 404 to avoid breaking aggregators
            return new NextResponse(xmlFeedService.generateFeed([], id), {
                status: 200,
                headers: { 'Content-Type': 'application/xml' }
            });
        }

        // 2. Map Firestore data to Property interface
        // Note: Most existing data likely misses the new fields. Casting and defaults.
        const properties: Property[] = snapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                // Basic
                title: data.title || 'Propiedad sin título',
                content: data.description || data.content || '',
                url: `https://zetaprop.com.ar/propiedades/p/${doc.id}`,

                // Classifications - Data might be string, mapping is key.
                // Assuming data stored fits the enum or is close.
                type: (data.operation_type === 'Venta' ? 'For Sale' :
                    data.operation_type === 'Alquiler' ? 'For Rent' :
                        data.operation_type === 'Alquiler Temporal' ? 'For Rent' : 'For Sale') as PropertyOperation,

                property_type: (data.property_type || 'Casa') as PropertyType,

                // Financial
                price: data.price || 0,
                currency: data.currency || 'USD',
                expenses: data.expenses,

                // Location
                address: `${data.calle} ${data.altura}`,
                address_name: data.calle || 'S/N',
                address_number: data.altura || '0',
                city: data.localidad || '',
                region: data.partido || data.provincia || '',
                country: 'Argentina',
                location: {
                    latitude: data.lat || 0,
                    longitude: data.lng || 0
                },

                // Features - Some existing
                rooms: data.rooms || data.ambientes,
                bathrooms: data.bathrooms,
                floor_area: data.area_covered || data.metrosCuadrados,
                plot_area: data.total_area,

                // Media - Mapping imageUrls array to PropertyImage objects
                images: (data.imageUrls || []).map((url: string, index: number) => ({
                    url,
                    featured: index === 0 // Assume first is cover
                })),

                video_url: data.video_url,

                // Status
                status: data.status || 'active',

                // Identifiers
                real_estate_id: id,
                branchId: data.branchId
            } as Property;
        });

        // 3. Generate XML
        const xml = xmlFeedService.generateFeed(properties, id);

        // 4. Return Response
        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate=59'
            }
        });

    } catch (error) {
        console.error('Error generating feed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
