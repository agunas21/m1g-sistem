"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon paths in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface OfflineMapProps {
  center?: [number, number];
  zoom?: number;
  teams?: Array<{
    id: string;
    name: string;
    location?: [number, number]; // [lat, lng]
    status: string;
  }>;
}

export default function OfflineMap({ 
  center = [38.4237, 27.1428], // İzmir
  zoom = 10,
  teams = []
}: OfflineMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-neutral-900 animate-pulse rounded-xl flex items-center justify-center text-neutral-500">Harita Yükleniyor...</div>;
  }

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      zoomControl={true}
    >
      {/* Topografik Harita - Dağ, tepe, yükselti bilgilerini gösterir */}
      <TileLayer
        attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      />
      
      {teams.map((team, idx) => {
        // If team has no location, create a mock location near Izmir for demonstration
        const loc = team.location || [38.4237 + (idx * 0.05), 27.1428 + (idx * 0.05)];
        return (
          <Marker key={team.id} position={loc as [number, number]} icon={customIcon}>
            <Popup>
              <div className="text-neutral-900">
                <strong className="block text-sm">{team.name}</strong>
                <span className="text-xs text-neutral-500">Durum: {team.status}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
