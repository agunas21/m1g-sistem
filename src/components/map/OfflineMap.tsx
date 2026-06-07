"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Kendi ikonumuzu CSS ile çizelim (unpkg yasaklamalarına karşı ve daha şık)
const customIcon = new L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const getPinIcon = (type: string) => {
  let bgColor = "#3b82f6"; // default blue
  if (type === "Kamp") bgColor = "#10b981"; // green
  if (type === "Tehlike") bgColor = "#f97316"; // orange
  if (type === "Toplanma") bgColor = "#8b5cf6"; // purple

  return new L.divIcon({
    className: 'custom-pin-icon',
    html: `<div style="background-color: ${bgColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 2px solid white; transform: rotate(-45deg); box-shadow: 2px 2px 5px rgba(0,0,0,0.4); position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const myLocationIcon = new L.divIcon({
  className: 'my-location-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.8); position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; background-color: #3b82f6; border-radius: 50%; opacity: 0.5; animation: pulse 2s infinite;"></div>
         </div>
         <style>
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
          }
         </style>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
});

function MapEventHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

interface OfflineMapProps {
  center?: [number, number];
  zoom?: number;
  teams?: Array<{
    id: string;
    name: string;
    location?: [number, number]; // [lat, lng]
    status: string;
  }>;
  pins?: Array<{
    id: string;
    name: string;
    type: string;
    location: [number, number];
  }>;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function OfflineMap({ 
  center = [38.4237, 27.1428], // İzmir
  zoom = 10,
  teams = [],
  pins = [],
  onMapClick
}: OfflineMapProps) {
  const [mounted, setMounted] = useState(false);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMounted(true);
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setMyPos([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Canlı konum alınamadı:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
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
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Uydu & Arazi (Hibrit)" checked>
          <TileLayer
            attribution='&copy; Google Maps'
            url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Karanlık Mod (Taktiksel)">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Google Arazi (Topoğrafik)">
          <TileLayer
            attribution='&copy; Google Maps'
            url="http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Standart Sokak (OSM)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapEventHandler onClick={onMapClick} />
      
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

      {pins.map((pin) => (
        <Marker key={pin.id} position={pin.location} icon={getPinIcon(pin.type)}>
          <Popup>
            <div className="text-neutral-900 text-center">
              <strong className="block text-sm">{pin.name}</strong>
              <span className="text-xs text-neutral-500 font-bold uppercase">{pin.type}</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {myPos && (
        <Marker position={myPos} icon={myLocationIcon}>
          <Popup>
            <div className="text-neutral-900 text-center">
              <strong className="block text-sm text-blue-600">Senin Konumun</strong>
              <span className="text-[10px] text-neutral-500">Mevcut Koordinatların</span>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
