"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Kendi ikonumuzu CSS ile çizelim (unpkg yasaklamalarına karşı ve daha şık)
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10]
});

const TEAM_COLORS = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
];

const getTeamColor = (teamName: string) => {
    if (!teamName) return TEAM_COLORS[0];
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
        hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
};

const getPinIcon = (type: string) => {
  let bgColor = "#3b82f6"; // default blue
  if (type === "Kamp") bgColor = "#10b981"; // green
  if (type === "Tehlike") bgColor = "#f97316"; // orange
  if (type === "Toplanma") bgColor = "#8b5cf6"; // purple

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<div style="background-color: ${bgColor}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 2px solid white; transform: rotate(-45deg); box-shadow: 2px 2px 5px rgba(0,0,0,0.4); position: relative;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const myLocationIcon = L.divIcon({
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

function LocateControl({ pos, trigger }: { pos: [number, number] | null, trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (pos && trigger > 0) {
      map.flyTo(pos, 16, { animate: true });
    }
  }, [trigger]); // Sadece trigger değiştiğinde (butona tıklandığında) merkeze al
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
  members?: Array<{
    id: string;
    name: string;
    teamName: string;
    role: string;
    location: [number, number];
    path: [number, number][];
  }>;
  pins?: Array<{
    id: string;
    name: string;
    type: string;
    location: [number, number];
  }>;
  userId?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function OfflineMap({ 
  center = [38.4237, 27.1428], // İzmir
  zoom = 10,
  teams = [],
  members = [],
  pins = [],
  userId,
  onMapClick
}: OfflineMapProps) {
  const [mounted, setMounted] = useState(false);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const lastPingRef = useRef<number>(0);

  const pingLocation = async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastPingRef.current < 5000) return; // En fazla 5 saniyede bir at
      lastPingRef.current = now;

      if (!userId) return;

      try {
          await fetch('/api/settings/operations/active/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  memberId: userId,
                  lat,
                  lng
              })
          });
      } catch (e) {
          console.error("GPS Ping gönderilemedi", e);
      }
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            setMyPos([pos.coords.latitude, pos.coords.longitude]);
            setGpsError(null);
            pingLocation(pos.coords.latitude, pos.coords.longitude);
            setLocateTrigger(prev => prev + 1); // İlk bulduğunda merkeze al
        },
        (err) => {
            console.log("Konum hatası:", err);
            setGpsError("Konum izni verilmedi veya GPS kapalı.");
            alert("Konum alınamadı. Lütfen cihazınızın GPS'ini açın veya tarayıcı ayarlarından siteye konum izni verin.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            setMyPos([pos.coords.latitude, pos.coords.longitude]);
            pingLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.log("Canlı konum alınamadı:", err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
        alert("Cihazınız GPS desteklemiyor.");
    }
  };

  useEffect(() => {
    setMounted(true);
    // DO NOT auto-start tracking on mount to avoid Chrome's Unwanted Permission Policy blocking it!
    // User must explicitly click the "Beni Bul" button.
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-neutral-900 animate-pulse rounded-xl flex items-center justify-center text-neutral-500">Harita Yükleniyor...</div>;
  }

  return (
    <div className="relative w-full h-full">
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      zoomControl={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Çevrimdışı (Ege Bölgesi)">
          <TileLayer
            attribution='&copy; Çevrimdışı M1G Haritası'
            url="/tiles/{z}/{x}/{y}.png"
            maxZoom={12}
            minZoom={8}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Standart Sokak (OSM)" checked>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Uydu & Arazi (Hibrit)">
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
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
            url="https://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapEventHandler onClick={onMapClick} />
      
      {/* İpucu */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-black/80 backdrop-blur border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 pointer-events-none">
          <span className="text-[10px] font-bold text-neutral-300 tracking-wider">HARİTAYA TIKLAYARAK İŞARET (PİN) BIRAKABİLİRSİNİZ</span>
      </div>

      {members.map((m, idx) => {
        const tColor = getTeamColor(m.teamName);
        return (
            <div key={`member-group-${m.id}-${idx}`}>
                {m.path && m.path.length > 1 && (
                    <Polyline positions={m.path} color={tColor} weight={3} opacity={0.6} dashArray="5, 5" />
                )}
                <Marker position={m.location} icon={createCustomIcon(tColor)}>
                    <Popup>
                    <div className="text-neutral-900">
                        <strong className="block text-sm">{m.id.substring(0,8)}...</strong>
                        <span className="text-xs font-bold uppercase block mt-1" style={{color: tColor}}>{m.teamName} - {m.role}</span>
                    </div>
                    </Popup>
                </Marker>
            </div>
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
            <div className="text-neutral-900 text-center font-bold text-xs uppercase tracking-wider">
              Konumum
            </div>
          </Popup>
        </Marker>
      )}
      
      <LocateControl pos={myPos} trigger={locateTrigger} />
    </MapContainer>

    {/* GPS Butonu Overlay */}
    <button 
        onClick={() => {
            startTracking();
            if (myPos) setLocateTrigger(prev => prev + 1);
        }}
        className="absolute bottom-6 right-6 z-[400] bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center justify-center transition-all active:scale-95"
        title="Konumumu Bul"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    </button>
    </div>
  );
}
