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
    const [icons, setIcons] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });

            setIcons({
                red: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                }),
                blue: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                }),
                green: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                })
            });
        }
    }, []);

    if (!icons) return <div className="flex items-center justify-center h-full text-neutral-500">Harita yükleniyor...</div>;

    return (
        <>
        <MapContainer 
            center={[39.0, 35.0]} 
            zoom={6} 
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            />
            <MapResizer />
            <MapEvents onMapClick={handleMapClick} />
            
            {currentLatLon && <MapCenter position={[currentLatLon.lat, currentLatLon.lon]} />}

            {markers.map((m: any) => (
                <Marker 
                    key={m.id} 
                    position={[m.latLon.lat, m.latLon.lon]}
                    icon={m.color === 'red' ? icons.red : icons.blue}
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
                    icon={icons.green}
                >
                    <Popup>Sizin Konumunuz</Popup>
                </Marker>
            )}
        </MapContainer>
        </>
    );
}
