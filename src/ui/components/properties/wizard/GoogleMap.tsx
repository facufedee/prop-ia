"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useState, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

interface MapProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function GoogleMapComponent({ lat, lng, onLocationSelect }: MapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            onLocationSelect(newLat, newLng);
        }
    };

    // Ensure valid coordinates
    const center = useMemo(() => ({
        lat: Number(lat) || -34.6037,
        lng: Number(lng) || -58.3816
    }), [lat, lng]);

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            <MarkerF key={`${center.lat}-${center.lng}`} position={center} />
        </GoogleMap>
    );
}
