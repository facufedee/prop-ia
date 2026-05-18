"use client";

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
    interface Window {
        gm_authFailure: () => void;
    }
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

interface PublicMapProps {
    lat: number;
    lng: number;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function PublicMap({ lat, lng }: PublicMapProps) {
    const [mapError, setMapError] = useState(false);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Detect Google Maps Authentication Failure (like RefererNotAllowed)
    useEffect(() => {
        window.gm_authFailure = () => {
            console.warn("Google Maps API Key rejected (Auth Failure). Falling back to iframe.");
            setMapError(true);
        };
    }, []);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey || "",
        libraries
    });

    const center = useMemo(() => ({
        lat: Number(lat),
        lng: Number(lng)
    }), [lat, lng]);

    // Fallback if no API Key is provided OR if there is a Load Error (e.g. RefererNotAllowed)
    if (!apiKey || loadError || mapError) {
        if (loadError || mapError) console.warn("Google Maps Load Error (Referer/Key?):", loadError || "Auth Failure");
        return (
            <iframe
                width="100%"
                height="100%"
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                className="w-full h-full"
            ></iframe>
        );
    }

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
