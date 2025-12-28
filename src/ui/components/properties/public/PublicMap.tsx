"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%'
};

interface PublicMapProps {
    lat: number;
    lng: number;
}

export default function PublicMap({ lat, lng }: PublicMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    });

    const center = useMemo(() => ({
        lat: Number(lat),
        lng: Number(lng)
    }), [lat, lng]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
            }}
        >
            <MarkerF position={center} />
        </GoogleMap>
    );
}
