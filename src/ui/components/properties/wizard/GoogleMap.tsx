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

interface MapProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

export default function GoogleMapComponent({ lat, lng, onLocationSelect }: MapProps) {
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
