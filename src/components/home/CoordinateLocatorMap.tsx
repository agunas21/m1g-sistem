import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LatLon } from '@/lib/coordinates/types';

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

function MapCenter({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        // Ultimate force invalidation on mount for tricky mobile layouts
        const interval = setInterval(() => {
            map.invalidateSize();
        }, 200);

        const timeout = setTimeout(() => {
            clearInterval(interval);
        }, 3000);
        
        const handleResize = () => {
            map.invalidateSize();
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        const container = map.getContainer();
        if (container) {
            resizeObserver.observe(container);
        }
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            resizeObserver.disconnect();
        };
    }, [map]);
    return null;
}

export default function CoordinateLocatorMap({ currentLatLon, markers, userLocation, handleMapClick }: any) {
    const createMarkerIcon = (color: string) => {
        let hex = '#ef4444'; // red
        if (color === 'blue') hex = '#3b82f6';
        if (color === 'green') hex = '#10b981';

        return L.divIcon({
            className: 'custom-coord-icon',
            html: `<div style="background-color: ${hex}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.6); position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
                   </div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            popupAnchor: [0, -11]
        });
    };

    return (
        <>
        <MapContainer 
            center={[39.0, 35.0]} 
            zoom={6} 
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; Google Maps'
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
            <MapResizer />
            <MapEvents onMapClick={handleMapClick} />
            
            {currentLatLon && <MapCenter position={[currentLatLon.lat, currentLatLon.lon]} />}

            {markers.map((m: any) => (
                <Marker 
                    key={m.id} 
                    position={[m.latLon.lat, m.latLon.lon]}
                    icon={createMarkerIcon(m.color || 'red')}
                >
                    <Popup>
                        <div className="font-bold">{m.label}</div>
                        <div className="text-xs">{m.latLon.lat.toFixed(5)}, {m.latLon.lon.toFixed(5)}</div>
                    </Popup>
                </Marker>
            ))}
            
            {userLocation && (
                <Marker 
                    position={[userLocation.lat, userLocation.lon]}
                    icon={createMarkerIcon('green')}
                >
                    <Popup>Sizin Konumunuz</Popup>
                </Marker>
            )}
        </MapContainer>
        </>
    );
}
