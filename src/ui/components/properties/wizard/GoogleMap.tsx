"use client";

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -34.6037,
    lng: -58.3816
};

// WARNING: You need to replace this with your actual Google Maps API Key
// You can get one at https://console.cloud.google.com/
const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE";

interface MapProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function GoogleMapComponent({ lat, lng, onLocationSelect }: MapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState({ lat, lng });

    useEffect(() => {
        setMarkerPosition({ lat, lng });
    }, [lat, lng]);

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
            setMarkerPosition({ lat: newLat, lng: newLng });
            onLocationSelect(newLat, newLng);
        }
    };

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                <Loader2 className="animate-spin mr-2" /> Cargando Google Maps...
            </div>
        );
    }

    // If no API Key is provided, show a friendly warning (for development)
    if (GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-4 text-center">
                <p className="font-semibold mb-2">Google Maps API Key Missing</p>
                <p className="text-sm">Please add your API Key in <code>src/ui/components/properties/wizard/GoogleMap.tsx</code></p>
                <p className="text-xs mt-4 text-gray-400">Showing default view for now.</p>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={markerPosition}
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
            <Marker position={markerPosition} />
        </GoogleMap>
    );
}
