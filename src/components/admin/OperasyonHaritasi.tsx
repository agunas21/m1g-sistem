'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { getMovementMode, getRoadSegment, snapFullTrail, calculateDistanceKm, MovementInfo } from '@/lib/routing'

import { MapContainer, TileLayer, Marker, Polyline, Polygon, Circle, CircleMarker, Popup, useMap, useMapEvents, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { ASR1Sector } from '@/app/api/settings/operations/active/sectors/route'

// ── Tipler ──────────────────────────────────────────────────────────────────
interface PersonnelLocation {
  member_id:     string
  member_name:   string
  team_name:     string
  team_color:    string
  role:          string
  status:        'searching' | 'found_victim' | 'returning' | 'standby'
  lat?:          number
  lng?:          number
  accuracy?:     number
  battery?:      number
  speed?:        number | null    // km/h
  is_online:     boolean
  recorded_at?:  string
}

interface Props {
  operationId: string
  initialCenter?: [number, number]
  initialZoom?: number
  onMapClick?: (lat: number, lng: number) => void
  userId?: string
}

// ── Durum renkleri ─────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  searching:    'Tarama',
  found_victim: 'Kurtarma',
  returning:    'Dönüyor',
  standby:      'Beklemede',
}

const STATUS_COLORS: Record<string, string> = {
  searching:    '#22c55e',
  found_victim: '#ef4444',
  returning:    '#3b82f6',
  standby:      '#eab308',
}

// ── Mesafe Hesaplama ───────────────────────────────────────────────────────
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2-lat1) * (Math.PI/180);
    const dLon = (lon2-lon1) * (Math.PI/180); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

// ── Pin Icons ──────────────────────────────────────────────────────────────
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


// ── Özel Marker İkonları ve Bileşenleri ────────────────────────────────────

const CenterPinButton = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  return (
    <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', zIndex:1000 }}>
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const center = map.getCenter();
          onClick(center.lat, center.lng);
        }}
        style={{ background:'rgba(0,0,0,0.8)', padding:'8px 20px', borderRadius:20, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(0,0,0,0.5)' }}
      >
        <span style={{ fontSize:16 }}>📍</span>
        <span style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', letterSpacing:1 }}>MERKEZE PİN EKLE</span>
      </button>
    </div>
  );
};

const CenterCrosshair = () => {
  return (
    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', zIndex:1000, pointerEvents:'none', opacity:0.6 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    </div>
  );
};

// ── ASR-1 Sektör Yardımcı Fonksiyonları ─────────────────────────────────────
function getPolygonCenter(polygon: [number, number][]): [number, number] {
  if (!polygon || polygon.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLng = 0;
  for (const pt of polygon) {
    sumLat += pt[0];
    sumLng += pt[1];
  }
  return [sumLat / polygon.length, sumLng / polygon.length];
}

function calculatePolygonAreaKm2(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i][0] * (Math.PI / 180);
    const lon1 = coords[i][1] * (Math.PI / 180);
    const lat2 = coords[j][0] * (Math.PI / 180);
    const lon2 = coords[j][1] * (Math.PI / 180);
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  const area = Math.abs(total * 6378137 * 6378137 / 2) / 1000000;
  return Math.round(area * 100) / 100;
}

function makeSectorLabelIcon(sector: ASR1Sector) {
  if (typeof window === 'undefined') return undefined;
  const L = require('leaflet');
  
  const statusColor = 
    sector.status === 'Aktif Arama' ? '#22c55e' :
    sector.status === 'Yüksek Risk' ? '#ef4444' :
    sector.status === 'Tamamlandı' ? '#94a3b8' : '#eab308';

  const color = sector.color || statusColor;

  return L.divIcon({
    className: 'asr1-sector-label-marker',
    iconSize: [140, 50],
    iconAnchor: [70, 25],
    html: `
      <div style="
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid ${color};
        border-radius: 8px;
        padding: 4px 8px;
        color: #fff;
        text-align: center;
        box-shadow: 0 4px 14px rgba(0,0,0,0.7);
        cursor: pointer;
        user-select: none;
        backdrop-filter: blur(4px);
      ">
        <div style="font-size: 10px; font-weight: 800; letter-spacing: 1px; color: ${color}; text-transform: uppercase;">
          ASR-1 ${sector.code}
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
          ${sector.name}
        </div>
        ${sector.assignedTeamName ? `
          <div style="font-size: 9px; font-weight: 600; color: #38bdf8; margin-top: 1px;">
            🚩 ${sector.assignedTeamName}
          </div>
        ` : ''}
      </div>
    `
  });
}

function makeIcon(color: string, initials: string, isSelected: boolean, speed?: number | null) {
  if (typeof window === 'undefined') return undefined
  const L = require('leaflet')

  const size  = isSelected ? 44 : 36
  const ring  = isSelected ? `box-shadow:0 0 0 3px #fff, 0 0 0 5px ${color};` : ''
  const move  = getMovementMode(speed)

  // Rozet (badge) ikonu: Araç için turuncu 🚗, Yaya için mavi 🚶
  let badgeHtml = '';
  if (move.mode === 'vehicle') {
    badgeHtml = `
      <div style="
        position:absolute;top:-4px;right:-4px;width:18px;height:18px;
        border-radius:50%;background:#f59e0b;border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.5);
      " title="${move.label}">🚗</div>`;
  } else if (move.mode === 'walking') {
    badgeHtml = `
      <div style="
        position:absolute;top:-4px;right:-4px;width:18px;height:18px;
        border-radius:50%;background:#0284c7;border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.5);
      " title="${move.label}">🚶</div>`;
  }

  return L.divIcon({
    className: '',
    iconSize:   [size, size + 20],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2.5px solid #fff;
          display:flex;align-items:center;justify-content:center;
          font-size:${isSelected ? 13 : 11}px;font-weight:600;color:#fff;
          cursor:pointer;${ring}transition:all .15s;
        ">${initials}</div>
        ${badgeHtml}
      </div>
      <div style="
        position:absolute;top:${size + 4}px;left:50%;transform:translateX(-50%);
        white-space:nowrap;background:rgba(15,20,35,.88);
        border:0.5px solid rgba(255,255,255,.15);border-radius:4px;
        padding:2px 6px;font-size:10px;color:#e2e8f0;pointer-events:none;
        display:flex;align-items:center;gap:3px;
      ">
        <span>${initials}</span>
        ${move.mode !== 'still' ? `<span style="font-size:9px;color:${move.mode === 'vehicle' ? '#f59e0b' : '#38bdf8'}">${move.icon}</span>` : ''}
      </div>
    `,
  })
}

function getInitials(name: string): string {
  if (!name) return "??";
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Harita kamera kontrolü (hook) ──────────────────────────────────────────
function MapController({ flyTo }: { flyTo: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 17, { duration: 1.2 })
  }, [flyTo, map])
  return null
}

function MapEventHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const MAX_TRAIL = 60

// ── Ana bileşen ────────────────────────────────────────────────────────────
export default function OperasyonHaritasi({
  operationId,
  initialCenter = [39.9334, 32.8597],
  initialZoom   = 14,
  onMapClick,
  userId
}: Props) {
  const [locations,  setLocations]  = useState<Record<string, PersonnelLocation>>({})
  const [trails,     setTrails]     = useState<Record<string, [number, number][]>>({})
  const [pins,       setPins]       = useState<any[]>([])
  const [selected,   setSelected]   = useState<string | null>(null)
  const [flyTo,      setFlyTo]      = useState<[number, number] | null>(null)
  const [mapReady,   setMapReady]   = useState(false)
  const [opStats,    setOpStats]    = useState({ name: "Yükleniyor...", activeCount: 0 })
  const [myPos,      setMyPos]      = useState<[number, number] | null>(null)
  
  // ASR-1 Sektörleme State'leri
  const [sectors, setSectors] = useState<ASR1Sector[]>([])
  const [selectedSector, setSelectedSector] = useState<ASR1Sector | null>(null)
  const [isDrawingSector, setIsDrawingSector] = useState(false)
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([])
  const [showSectorModal, setShowSectorModal] = useState(false)
  const [teamsList, setTeamsList] = useState<{ id: string, name: string }[]>([])
  const [newSectorForm, setNewSectorForm] = useState({
    code: 'Sektör A',
    name: 'Kuzey Afet Sektörü',
    status: 'Değerlendirme' as 'Değerlendirme' | 'Aktif Arama' | 'Tamamlandı' | 'Yüksek Risk',
    priority: 'Orta' as 'Kritik' | 'Orta' | 'Düşük',
    assignedTeamId: '',
    assignedTeamName: '',
    hazards: '',
    radioChannel: 'CH-1 / 446.00625 MHz',
    color: '#3b82f6'
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const lastPingRef = useRef<number>(0)
  const channelRef = useRef<any>(null)

  // ── İlk yükleme ve API eşleşmesi ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const resOp = await fetch('/api/settings/operations/active');
        const ops = await resOp.json();
        const op = ops.find((o: any) => o.id === operationId);
        if (!op) return;

        // ASR-1 Sektörlerini yükle
        fetch(`/api/settings/operations/active/sectors?operationId=${operationId}`)
          .then(r => r.json())
          .then(d => { if (d.sectors) setSectors(d.sectors); })
          .catch(() => { if (op.sectors) setSectors(op.sectors); });

        if (op.teams) {
          setTeamsList(op.teams.map((t: any) => ({ id: t.id, name: t.name })));
        }

        const resMem = await fetch('/api/members');
        const membersArr = await resMem.json();
        const memberMap = new Map<string, any>(membersArr.map((m: any) => [m.id, m]));

        const map: Record<string, PersonnelLocation> = {};
        const newTrails: Record<string, [number, number][]> = {};

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        let colorIdx = 0;

        op.teams.forEach((t: any) => {
          const teamColor = colors[colorIdx % colors.length];
          colorIdx++;
          t.members.forEach((m: any) => {
              const memInfo = memberMap.get(m.id);
              const spd = m.lastLocation?.speed ?? 0;
              map[m.id] = {
                  member_id: m.id,
                  member_name: memInfo?.fullName || m.id,
                  team_name: t.name,
                  team_color: teamColor,
                  role: m.role,
                  status: m.role === 'Lider' ? 'standby' : 'searching',
                  lat: m.lastLocation?.lat,
                  lng: m.lastLocation?.lng,
                  accuracy: m.lastLocation?.accuracy,
                  battery: m.lastLocation?.battery,
                  speed: spd,
                  is_online: m.lastLocation ? (Date.now() - m.lastLocation.timestamp < 10 * 60 * 1000) : false,
                  recorded_at: m.lastLocation ? new Date(m.lastLocation.timestamp).toISOString() : undefined
              };
              if (m.lastLocation) {
                  if (m.path && m.path.length > 0) {
                      const rawPoints: [number, number][] = m.path.map((p: any) => [p.lat, p.lng]);
                      newTrails[m.id] = rawPoints;
                      
                      // Geçmiş rotadaki kuşbakışı uzak atlamaları OSRM ile karayolu ağına snap et
                      snapFullTrail(rawPoints).then(snapped => {
                          setTrails(prev => ({ ...prev, [m.id]: snapped }));
                      }).catch(() => {});
                  } else {
                      newTrails[m.id] = [[m.lastLocation.lat, m.lastLocation.lng]];
                  }
              }
          });
        });
        setLocations(map);
        setTrails(newTrails);
        setPins(op.pins || []);
        setOpStats({ name: op.name, activeCount: Object.keys(map).length });

        // Ortala
        const locs = Object.values(map);
        const validLocs = locs.filter(l => l.lat !== undefined && l.lng !== undefined);
        if (validLocs.length > 0) {
            setFlyTo([validLocs[0].lat as number, validLocs[0].lng as number]);
        } else if (op.pins && op.pins.length > 0) {
            setFlyTo(op.pins[0].location);
        }
      } catch (err) {
          console.error("Harita verisi yüklenemedi", err);
      }
    }
    load()
  }, [operationId])

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    channelRef.current = supabase.channel('operations-channel');
    
    channelRef.current.on('broadcast', { event: 'location_update' }, (payload: any) => {
        const { memberId, lat, lng, battery, accuracy, speed: reportedSpeed, timestamp } = payload.payload;

        let calculatedSpeed = reportedSpeed;
        setLocations((prev: any) => {
            const p = prev[memberId];
            if (!p) return prev; 
            
            if (calculatedSpeed === undefined || calculatedSpeed === null) {
                if (p.lat && p.lng && p.recorded_at) {
                    const dist = getDistanceFromLatLonInKm(p.lat, p.lng, lat, lng);
                    const timeDiff = (timestamp - new Date(p.recorded_at).getTime()) / (1000 * 60 * 60);
                    if (timeDiff > 0) calculatedSpeed = dist / timeDiff;
                }
            }

            return {
                ...prev,
                [memberId]: {
                    ...p,
                    lat, lng, battery: battery || p.battery || 100,
                    accuracy: accuracy || p.accuracy || 15,
                    speed: calculatedSpeed ?? p.speed ?? 0,
                    is_online: true,
                    recorded_at: new Date(timestamp).toISOString()
                }
            };
        });

        // Rota güncelleme: Mesafe >= 300m ise OSRM ile karayolu eşlemesi yap, yoksa ham yaya noktasını ekle
        setTrails((prev: any) => {
            const existing = prev[memberId] ?? [];
            const lastPoint = existing[existing.length - 1];

            if (lastPoint) {
                const dist = calculateDistanceKm(lastPoint[0], lastPoint[1], lat, lng);
                if (dist >= 0.3) {
                    // Uzak mesafe / Araç hareketi: OSRM ile karayoluna oturt
                    getRoadSegment(lastPoint, [lat, lng]).then(roadPoints => {
                        setTrails(curr => {
                            const currExisting = curr[memberId] ?? [];
                            const updated = [...currExisting.slice(0, -1), ...roadPoints];
                            return { ...curr, [memberId]: updated.slice(-MAX_TRAIL) };
                        });
                    }).catch(() => {
                        setTrails(curr => ({
                            ...curr,
                            [memberId]: [...(curr[memberId] ?? []), [lat, lng] as [number, number]].slice(-MAX_TRAIL)
                        }));
                    });
                    return prev;
                }
            }

            // Normal yaya veya yakın nokta: Ham GPS koordinatını direkt ekle
            const updated = [...existing, [lat, lng] as [number, number]];
            return { ...prev, [memberId]: updated.slice(-MAX_TRAIL) };
        });
    }).subscribe();

    return () => { if(channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id)
    setSelectedSector(null)
    const loc = locations[id]
    if (loc && loc.lat !== undefined && loc.lng !== undefined) setFlyTo([loc.lat, loc.lng])
  }, [locations])

  // ── ASR-1 Sektör Çizim & Yönetim Fonksiyonları ────────────────────────────
  const getNextSectorCode = (currentSectors: ASR1Sector[]) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const used = new Set(currentSectors.map(s => s.code.replace(/[^A-Z]/g, '')));
    for (let i = 0; i < letters.length; i++) {
      if (!used.has(letters[i])) {
        return `Sektör ${letters[i]}`;
      }
    }
    return `Sektör ${currentSectors.length + 1}`;
  };

  const startSectorDrawing = () => {
    setIsDrawingSector(true);
    setDrawPoints([]);
    setSelected(null);
    setSelectedSector(null);
  };

  const handleCancelDrawing = () => {
    setIsDrawingSector(false);
    setDrawPoints([]);
  };

  const handleUndoDrawingPoint = () => {
    setDrawPoints(prev => prev.slice(0, -1));
  };

  const handleFinishDrawing = () => {
    if (drawPoints.length < 3) return;
    const defaultCode = getNextSectorCode(sectors);
    setNewSectorForm({
      code: defaultCode,
      name: `${defaultCode} Afet Sahası`,
      status: 'Değerlendirme',
      priority: 'Orta',
      assignedTeamId: teamsList[0]?.id || '',
      assignedTeamName: teamsList[0]?.name || '',
      hazards: '',
      radioChannel: 'CH-1 / 446.00625 MHz',
      color: '#3b82f6'
    });
    setShowSectorModal(true);
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (drawPoints.length < 3) return;

    const payload = {
      operationId,
      code: newSectorForm.code,
      name: newSectorForm.name,
      polygon: drawPoints,
      assignedTeamId: newSectorForm.assignedTeamId,
      assignedTeamName: newSectorForm.assignedTeamName,
      status: newSectorForm.status,
      priority: newSectorForm.priority,
      hazards: newSectorForm.hazards,
      radioChannel: newSectorForm.radioChannel,
      color: newSectorForm.color
    };

    try {
      const res = await fetch('/api/settings/operations/active/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sector) {
          setSectors(prev => [...prev.filter(s => s.id !== data.sector.id), data.sector]);
          setSelectedSector(data.sector);
        }
      }
    } catch (err) {
      console.error("Sektör kaydedilemedi", err);
    } finally {
      setIsDrawingSector(false);
      setDrawPoints([]);
      setShowSectorModal(false);
    }
  };

  const handleDeleteSector = async (sectorId: string) => {
    if (!confirm("Bu ASR-1 sektörünü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/settings/operations/active/sectors?operationId=${operationId}&sectorId=${sectorId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSectors(prev => prev.filter(s => s.id !== sectorId));
        if (selectedSector?.id === sectorId) setSelectedSector(null);
      }
    } catch (err) {
      console.error("Sektör silinemedi", err);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isDrawingSector) {
      setDrawPoints(prev => [...prev, [lat, lng]]);
    } else if (onMapClick) {
      onMapClick(lat, lng);
    }
  };

  // ── Konumumu Bul ve Gönder ────────────────────────────────────────────────
  const pingLocation = async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastPingRef.current < 5000) return; // Max 5 saniyede bir at
    lastPingRef.current = now;

    if (!userId) return;

    try {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'location_update',
                payload: { memberId: userId, lat, lng, timestamp: now }
            });
        }
        fetch('/api/settings/operations/active/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: userId, lat, lng })
        }).catch(() => {});
    } catch (e) {
        console.error("GPS Ping failed", e);
    }
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setMyPos([lat, lng]);
            setFlyTo([lat, lng]);
            pingLocation(lat, lng);
        },
        (err) => console.log("Konum hatası:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setMyPos([lat, lng]);
            pingLocation(lat, lng);
        },
        (err) => console.log("Canlı konum alınamadı:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
        alert("Cihazınız GPS desteklemiyor.");
    }
  };

  // ── "Konuma git" — Google Maps ────────────────────────────────────────────
  const openNavigation = useCallback((loc: PersonnelLocation) => {
    if (loc.lat === undefined || loc.lng === undefined) return;
    window.open(
      `https://maps.google.com/?q=${loc.lat},${loc.lng}&navigate=yes`,
      '_blank'
    )
  }, [])

  // ── Koordinat kopyala ────────────────────────────────────────────────────
  const copyCoords = useCallback((loc: PersonnelLocation) => {
    if (loc.lat === undefined || loc.lng === undefined) return;
    const text = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`
    navigator.clipboard.writeText(text).then(() => alert(`Kopyalandı: ${text}`))
  }, [])

  const people   = Object.values(locations)
  const selPer   = selected ? locations[selected] : null
  const onlineN  = people.filter(p => p.is_online).length

  // ── CSS ───────────────────────────────────────────────────────────────────
  const S = {
    wrap:    { display:'flex', height:'100%', width:'100%', background:'#1a1f2e', fontFamily:'system-ui', borderRadius: '1rem', overflow: 'hidden' } as const,
    sidebar: { width:300, background:'#111827', display:'flex', flexDirection:'column' as const, borderRight:'0.5px solid #2d3748', overflow:'hidden' },
    sHead:   { padding:'14px 16px', borderBottom:'0.5px solid #2d3748' },
    sTitle:  { fontSize:15, fontWeight:600, color:'#e2e8f0' },
    sSub:    { fontSize:12, color:'#64748b', marginTop:2 },
    badge:   { display:'inline-flex', alignItems:'center', gap:5, background:'#0f2e1a', border:'0.5px solid #1a4731', borderRadius:6, padding:'4px 8px', marginTop:8 },
    bdot:    { width:6, height:6, borderRadius:'50%', background:'#22c55e' },
    btxt:    { fontSize:11, color:'#4ade80' },
    plist:   { flex:1, overflowY:'auto' as const, padding:12 },
    mapWrap: { flex:1, position:'relative' as const, display:'flex', flexDirection:'column' as const },
    topbar:  { height:50, background:'rgba(17,24,39,.92)', borderBottom:'0.5px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:12, padding:'0 16px', zIndex:1000 },
    tbStat:  { fontSize:12, color:'#94a3b8' },
    tbVal:   { color:'#4ade80', fontWeight:500 },
    mapCont: { flex:1, position:'relative' as const },
    dpPanel: (open: boolean) => ({
      position:'absolute' as const, bottom:0, left:0, right:0,
      background:'rgba(17,24,39,.97)', borderTop:'0.5px solid rgba(255,255,255,.1)',
      padding:'16px 20px', zIndex:1000,
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition:'transform .25s ease',
    }),
  }

  return (
    <div className="relative flex w-full h-full bg-[#1a1f2e] font-sans rounded-2xl overflow-hidden">
      {/* ── Sol panel ────────────────────────────────────────── */}
      <div className={`
        absolute z-[1100]
        w-[85%] md:w-[320px] h-full
        bg-[#111827] flex flex-col border-r border-slate-800
        transform transition-transform duration-300 shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        shrink-0
      `}>
        <div style={S.sHead}>
          <div className="flex items-center justify-between">
              <div style={S.sTitle}>Canlı takip</div>
              <button className="text-slate-400 p-2 hover:bg-slate-800 rounded-lg" onClick={() => setIsSidebarOpen(false)}>✕</button>
          </div>
          <div style={S.sSub}>{opStats.name}</div>
          <div style={S.badge}>
            <div style={S.bdot} />
            <span style={S.btxt}>{onlineN} personel aktif</span>
          </div>
        </div>

        <div style={S.plist}>
          {people.map(p => {
            const initials = getInitials(p.member_name)
            const sc = STATUS_COLORS[p.status] ?? '#94a3b8'
            const isActive = selected === p.member_id
            return (
              <div
                key={p.member_id}
                onClick={() => {
                  handleSelect(p.member_id);
                  if(window.innerWidth < 768) setIsSidebarOpen(false); // Otomatik kapat
                }}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 12px', borderRadius:8, cursor:'pointer',
                  border:`0.5px solid ${isActive ? '#2563eb' : 'transparent'}`,
                  background: isActive ? '#1e3a5f' : 'transparent',
                  marginBottom:4, transition:'background .15s',
                }}
              >
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background: p.team_color + '33',
                  border:`2px solid ${p.team_color}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:500, color:'#fff', flexShrink:0,
                }}>
                  {initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.member_name}
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>{p.team_name} — {p.role}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background: p.lat ? sc : '#64748b' }} />
                    <span style={{ fontSize:11, color: p.lat ? sc : '#64748b' }}>{p.lat ? STATUS_LABELS[p.status] : 'Konum Bekleniyor'}</span>
                  </div>
                </div>
                <div style={{ fontSize:11, color: (p.battery ?? 100) < 20 ? '#f87171' : '#94a3b8', flexShrink:0 }}>
                  {p.battery !== undefined ? `🔋${Math.round(p.battery)}%` : 'Bekleniyor'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Harita alanı ─────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {/* Üst bar */}
        <div style={S.topbar}>
          <button 
            className="mr-3 text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 p-2 rounded-lg backdrop-blur shadow-lg transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span style={{ fontSize:16, color:'#4ade80' }}>●</span>
          <span style={{ fontSize:15, fontWeight:600, color:'#e2e8f0' }} className="ml-1">Operasyon izleme</span>

          {/* ASR-1 Sektör Butonu */}
          <button
            onClick={startSectorDrawing}
            disabled={isDrawingSector}
            className={`ml-3 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isDrawingSector 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 text-white'
            }`}
            title="INSARAG ASR-1 Geniş Alan Sektör Çizimi"
          >
            <span>📐</span>
            <span className="hidden sm:inline">ASR-1 Sektör Çiz</span>
          </button>

          {sectors.length > 0 && (
            <span 
              className="ml-2 px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-500/25 transition-colors hidden sm:inline-flex items-center gap-1"
              onClick={() => {
                if (selectedSector) setSelectedSector(null);
                else {
                  setSelectedSector(sectors[0]);
                  setFlyTo(getPolygonCenter(sectors[0].polygon));
                }
              }}
              title="Kayıtlı ASR-1 Sektörleri"
            >
              <span>🏷️</span> {sectors.length} Sektör
            </span>
          )}

          <span style={{ width:'1px', height:18, background:'#374151' }} className="mx-2 hidden sm:inline" />
          <span style={S.tbStat} className="hidden sm:inline">Aktif: <span style={S.tbVal}>{onlineN}</span></span>
          <span style={S.tbStat} className="ml-auto">Toplam: <span style={S.tbVal}>{people.length}</span></span>
        </div>

        {/* Leaflet harita */}
        <div style={S.mapCont}>
          {/* ASR-1 Çizim Yüzen Kontrol Çubuğu */}
          {isDrawingSector && (
            <div style={{
              position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1100, display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #f59e0b',
              padding: '8px 16px', borderRadius: 30, boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)'
            }}>
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📐</span> ASR-1 Çizim: <span style={{ color: '#fff' }}>{drawPoints.length} köşe</span>
              </span>
              
              <button
                onClick={handleFinishDrawing}
                disabled={drawPoints.length < 3}
                style={{
                  background: drawPoints.length >= 3 ? '#16a34a' : '#334155',
                  color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, cursor: drawPoints.length >= 3 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
                }}
              >
                ✓ Sektörü Tamamla
              </button>

              <button
                onClick={handleUndoDrawingPoint}
                disabled={drawPoints.length === 0}
                style={{
                  background: '#374151', color: '#e2e8f0', border: 'none', padding: '6px 12px',
                  borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: drawPoints.length > 0 ? 'pointer' : 'not-allowed'
                }}
                title="Son noktayı geri al"
              >
                ↩ Geri
              </button>

              <button
                onClick={handleCancelDrawing}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px',
                  borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >
                ✕ İptal
              </button>
            </div>
          )}

          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height:'100%', width:'100%', background:'#111827' }}
            zoomControl={true}
            whenReady={() => setMapReady(true)}
          >
            {/* Katman Secenekleri: Uydu Hibrit, Karanlik Taktik, Topografik ve Sokak */}
            <LayersControl position="topright">
              <LayersControl.BaseLayer name="Uydu & Arazi (Google Hibrit)" checked>
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Karanlık Taktik (Esri Dark)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Google Arazi (Topoğrafik)">
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Standart Sokak (OSM)">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {mapReady && <MapController flyTo={flyTo} />}
            <MapEventHandler onClick={handleMapClick} />
            {onMapClick && !isDrawingSector && <CenterPinButton onClick={onMapClick} />}
            {onMapClick && !isDrawingSector && <CenterCrosshair />}

            {/* ASR-1 Sektörleri */}
            {sectors.map((sec) => {
              const isSecSelected = selectedSector?.id === sec.id;
              const center = getPolygonCenter(sec.polygon);
              const icon = makeSectorLabelIcon(sec);

              return (
                <div key={sec.id}>
                  <Polygon
                    positions={sec.polygon}
                    pathOptions={{
                      color: sec.color,
                      fillColor: sec.color,
                      fillOpacity: isSecSelected ? 0.35 : 0.16,
                      weight: isSecSelected ? 4 : 2.5,
                      dashArray: sec.status === 'Değerlendirme' ? '6, 6' : undefined
                    }}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        setSelectedSector(sec);
                        setSelected(null);
                      }
                    }}
                  />
                  {icon && (
                    <Marker
                      position={center}
                      icon={icon}
                      eventHandlers={{
                        click: (e) => {
                          L.DomEvent.stopPropagation(e);
                          setSelectedSector(sec);
                          setSelected(null);
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* ASR-1 Çizim Önizlemesi */}
            {isDrawingSector && drawPoints.length > 0 && (
              <>
                {drawPoints.map((pt, idx) => (
                  <CircleMarker
                    key={idx}
                    center={pt}
                    radius={6}
                    pathOptions={{ color: '#f59e0b', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
                  />
                ))}
                {drawPoints.length >= 2 && (
                  <Polyline
                    positions={drawPoints}
                    pathOptions={{ color: '#f59e0b', weight: 2.5, dashArray: '6, 6' }}
                  />
                )}
                {drawPoints.length >= 3 && (
                  <Polygon
                    positions={drawPoints}
                    pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.22, weight: 2 }}
                  />
                )}
              </>
            )}

            {pins.map((pin) => (
              <Marker key={pin.id} position={pin.location} icon={getPinIcon(pin.type)}>
                <Popup>
                  <div style={{color: 'black', textAlign: 'center'}}>
                    <strong style={{display: 'block', fontSize: '14px'}}>{pin.name}</strong>
                    <span style={{fontSize: '12px', color: '#666', fontWeight: 'bold'}}>{pin.type}</span>
                    <div style={{marginTop: '10px'}}>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pin.location[0]},${pin.location[1]}`}
                        target="_blank" rel="noreferrer"
                        style={{display: 'inline-block', backgroundColor: '#2563eb', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold'}}
                      >
                        Konuma Git
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {myPos && (
              <Marker position={myPos} icon={myLocationIcon}>
                <Popup>
                  <div style={{color: 'black', textAlign: 'center', fontWeight: 'bold', fontSize: '12px'}}>
                    Konumum
                  </div>
                </Popup>
              </Marker>
            )}

            {people.map(p => {
              if (p.lat === undefined || p.lng === undefined) return null;
              const isSelected = selected === p.member_id
              const icon = makeIcon(p.team_color, getInitials(p.member_name), isSelected, p.speed)
              if (!icon) return null

              return (
                <div key={p.member_id}>
                  <Circle
                    center={[p.lat, p.lng]}
                    radius={p.accuracy || 15}
                    pathOptions={{ color: p.team_color, fillColor: p.team_color, fillOpacity:0.06, weight:1, opacity:0.3 }}
                  />

                  {trails[p.member_id]?.length > 1 && (
                    <>
                      <Polyline
                        positions={trails[p.member_id]}
                        pathOptions={{ color: p.team_color, weight: 6, opacity: 0.25, lineCap: 'round', lineJoin: 'round', smoothFactor: 1.5 }}
                      />
                      <Polyline
                        positions={trails[p.member_id]}
                        pathOptions={{ color: p.team_color, weight: 3, opacity: 0.9, lineCap: 'round', lineJoin: 'round', smoothFactor: 1.5 }}
                      />
                    </>
                  )}

                  <Marker
                    position={[p.lat, p.lng]}
                    icon={icon}
                    eventHandlers={{ click: () => handleSelect(p.member_id) }}
                  />
                </div>
              )
            })}
          </MapContainer>

          {/* İpucu Overlay KALDIRILDI - Artık harita içinde buton var */}          {/* Konumum Butonu */}
          <button 
              onClick={() => {
                if (myPos) {
                  setFlyTo(myPos)
                } else {
                  startTracking();
                  alert("Konumunuz henüz bulunamadı veya cihazınız desteklemiyor.");
                }
              }}
              style={{ position:'absolute', bottom:24, right:24, zIndex:400, background: myPos ? '#2563eb' : '#64748b', border:'none', color:'#fff', padding:12, borderRadius:'50%', cursor:'pointer', boxShadow:'0 0 15px rgba(37,99,235,0.5)' }}
              title="Konumumu Bul"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
          </button>
        </div>

        {/* ── Detay paneli (personel veya sektör tıklanınca açılır) ──── */}
        <div style={S.dpPanel(!!selPer || !!selectedSector)}>
          {/* ASR-1 Sektör Detay Kartı */}
          {selectedSector && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{
                  width:42, height:42, borderRadius:10,
                  background: (selectedSector.color || '#3b82f6') + '22',
                  border: `2px solid ${selectedSector.color || '#3b82f6'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, flexShrink:0
                }}>
                  📐
                </div>
                <div style={{ flex: 1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>
                    ASR-1 {selectedSector.code}
                  </div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selectedSector.name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSector(null)}
                  style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:'#64748b', fontSize:24, lineHeight:1 }}
                >×</button>
              </div>

              {/* Durum & Öncelik Rozetleri */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: selectedSector.status === 'Aktif Arama' ? 'rgba(34,197,94,0.2)' : selectedSector.status === 'Yüksek Risk' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                  color: selectedSector.status === 'Aktif Arama' ? '#4ade80' : selectedSector.status === 'Yüksek Risk' ? '#f87171' : '#facc15',
                  border: `1px solid ${selectedSector.color || '#3b82f6'}44`
                }}>
                  ● {selectedSector.status}
                </span>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Öncelik: {selectedSector.priority}
                </span>
              </div>

              {/* İstatistikler */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:12 }} className="overflow-x-auto pb-2 md:pb-0">
                <div style={{ background:'#1f2937', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#38bdf8' }}>
                    {calculatePolygonAreaKm2(selectedSector.polygon)} km²
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Tahmini Kapsama Alanı</div>
                </div>
                <div style={{ background:'#1f2937', borderRadius:8, padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#f59e0b' }}>
                    {selectedSector.polygon.length} Köşe
                  </div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>Sınır Koordinatı</div>
                </div>
              </div>

              {/* Görevli Tim Bilgisi */}
              <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>GÖREVLİ TİM</div>
                <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚩</span>
                  <span>{selectedSector.assignedTeamName || 'Henüz tim atanmadı'}</span>
                </div>
              </div>

              {/* Tehlikeler ve KBRN */}
              {selectedSector.hazards && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>⚠️ RİSK & TEHLİKELER</div>
                  <div style={{ fontSize: 12, color: '#fecaca', marginTop: 2 }}>{selectedSector.hazards}</div>
                </div>
              )}

              {/* Telsiz Kanalı */}
              {selectedSector.radioChannel && (
                <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>TELSİZ FREKANSI / KANAL</div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 2, fontFamily: 'monospace' }}>📻 {selectedSector.radioChannel}</div>
                </div>
              )}

              {/* Aksiyon butonları */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const center = getPolygonCenter(selectedSector.polygon);
                    setFlyTo(center);
                  }}
                  style={{
                    flex: 2, padding: '10px 0', borderRadius: 8, background: '#2563eb',
                    color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Haritada Ortala
                </button>
                <button
                  onClick={() => handleDeleteSector(selectedSector.id)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, background: 'rgba(239,68,68,0.15)',
                    color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Sektörü Sil
                </button>
              </div>
            </div>
          )}

          {/* Personel Detay Kartı */}
          {!selectedSector && selPer && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{
                  width:42, height:42, borderRadius:'50%',
                  background: selPer.team_color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:500, color:'#fff',
                  border:'2px solid rgba(255,255,255,.2)',
                  flexShrink:0,
                }}>
                  {getInitials(selPer.member_name)}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, color:'#f1f5f9' }}>{selPer.member_name}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{selPer.team_name} — {selPer.role}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="kapat"
                  style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:'#64748b', fontSize:24, lineHeight:1 }}
                >×</button>
              </div>

              {selPer.lat !== undefined ? (
                  <>
                    {/* Hareket Türü Göstergesi */}
                    {(() => {
                      const move = getMovementMode(selPer.speed);
                      return (
                        <div style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'8px 12px', borderRadius:8, marginBottom:10,
                          background: move.mode === 'vehicle' ? 'rgba(245,158,11,0.15)' : move.mode === 'walking' ? 'rgba(56,189,248,0.15)' : 'rgba(30,41,59,0.5)',
                          border: `1px solid ${move.mode === 'vehicle' ? 'rgba(245,158,11,0.3)' : move.mode === 'walking' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)'}`
                        }}>
                          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>Hareket Durumu:</span>
                          <span style={{
                            fontSize:12, fontWeight:700,
                            color: move.mode === 'vehicle' ? '#fbbf24' : move.mode === 'walking' ? '#38bdf8' : '#cbd5e1',
                            display:'flex', alignItems:'center', gap:6
                          }}>
                            <span>{move.icon}</span>
                            <span>{move.label}</span>
                          </span>
                        </div>
                      );
                    })()}

                    {/* İstatistik kartları */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }} className="overflow-x-auto pb-2 md:pb-0">
                      {[
                        { label:'Batarya', value:`${Math.round(Number(selPer.battery ?? 100))}%`, color: Number(selPer.battery ?? 100) < 20 ? '#f87171' : '#4ade80' },
                        { label:'GPS ±m',  value:`±${Math.round(Number(selPer.accuracy ?? 15))}m`, color:'#93c5fd' },
                        { label:'Hız',     value:`${selPer.speed != null ? Math.round(Number(selPer.speed)) : 0} km/s`, color: Number(selPer.speed) > 15 ? '#fbbf24' : '#e2e8f0' },
                        { label:'Sinyal',  value: selPer.recorded_at ? new Date(selPer.recorded_at).toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }) : '—', color:'#e2e8f0' },
                      ].map(s => (
                        <div key={s.label} style={{ background:'#1f2937', borderRadius:8, padding:'10px 8px', textAlign:'center', minWidth: '70px' }}>
                          <div style={{ fontSize:14, fontWeight:600, color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Aksiyon butonları */}
                    <div className="flex flex-col md:flex-row gap-2">
                      <button
                        onClick={() => openNavigation(selPer)}
                        style={{
                          flex:2, padding:'12px 0', borderRadius:8,
                          background:'#1d4ed8', border:'0.5px solid #2563eb',
                          color:'#fff', cursor:'pointer', fontSize:14, fontWeight:500,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                        }}
                      >
                        ↗ Konuma git
                      </button>
                      <button
                        onClick={() => copyCoords(selPer)}
                        style={{
                          flex:1, padding:'12px 0', borderRadius:8,
                          background:'transparent', border:'0.5px solid rgba(255,255,255,.15)',
                          color:'#94a3b8', cursor:'pointer', fontSize:13,
                        }}
                      >
                        Koordinat kopyala
                      </button>
                      <button
                        onClick={() => { if(selPer.lat) setFlyTo([selPer.lat, selPer.lng as number]) }}
                        style={{
                          flex:1, padding:'12px 0', borderRadius:8,
                          background:'transparent', border:'0.5px solid rgba(255,255,255,.15)',
                          color:'#94a3b8', cursor:'pointer', fontSize:13,
                        }}
                      >
                        Haritada ortala
                      </button>
                    </div>
                  </>
              ) : (
                  <div className="text-center py-6 text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
                    Henüz GPS sinyali alınmadı. Cihaz bekleniyor...
                  </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ASR-1 Sektör Oluşturma Modalı ─────────────────────────────── */}
      {showSectorModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📐</span>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">Yeni ASR-1 Sektörü Tanımla</h3>
                  <p className="text-xs text-neutral-400">INSARAG Seviye 1: Geniş Alan Sektörlemesi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSectorModal(false)}
                className="text-neutral-400 hover:text-white text-xl p-1"
              >✕</button>
            </div>

            <form onSubmit={handleSaveSector} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Sektör Kodu *</label>
                  <input 
                    type="text" 
                    required
                    value={newSectorForm.code} 
                    onChange={e => setNewSectorForm({ ...newSectorForm, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
                    placeholder="örn: Sektör A"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Öncelik Seviyesi</label>
                  <select
                    value={newSectorForm.priority}
                    onChange={e => setNewSectorForm({ ...newSectorForm, priority: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Kritik">1 - Kritik (Acil)</option>
                    <option value="Orta">2 - Orta Öncelik</option>
                    <option value="Düşük">3 - Düşük</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Sektör Tanımı / Bölge Adı *</label>
                <input 
                  type="text" 
                  required
                  value={newSectorForm.name} 
                  onChange={e => setNewSectorForm({ ...newSectorForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  placeholder="örn: Manavkuyu Afet Bölgesi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Operasyonel Durum</label>
                  <select
                    value={newSectorForm.status}
                    onChange={e => setNewSectorForm({ ...newSectorForm, status: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Değerlendirme">🟡 Değerlendirme Sürüyor</option>
                    <option value="Aktif Arama">🟢 Aktif Arama Kurtarma</option>
                    <option value="Yüksek Risk">🔴 Yüksek Risk / Tehlike</option>
                    <option value="Tamamlandı">⚪ Arama Tamamlandı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Görevlendirilen Tim</label>
                  <select
                    value={newSectorForm.assignedTeamId}
                    onChange={e => {
                      const team = teamsList.find(t => t.id === e.target.value);
                      setNewSectorForm({ 
                        ...newSectorForm, 
                        assignedTeamId: e.target.value,
                        assignedTeamName: team ? team.name : ''
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Tim Seçilmedi --</option>
                    {teamsList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Tehlikeler / Risk Notları</label>
                <input 
                  type="text" 
                  value={newSectorForm.hazards} 
                  onChange={e => setNewSectorForm({ ...newSectorForm, hazards: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  placeholder="örn: Doğalgaz kaçağı, çökmüş viyadük, KBRN şüphesi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Telsiz Frekansı / Kanal</label>
                  <input 
                    type="text" 
                    value={newSectorForm.radioChannel} 
                    onChange={e => setNewSectorForm({ ...newSectorForm, radioChannel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                    placeholder="örn: CH-1 / 446.00625"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Sektör Rengi</label>
                  <div className="flex items-center gap-2 mt-1">
                    {['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewSectorForm({ ...newSectorForm, color: c })}
                        style={{ background: c }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${newSectorForm.color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-70'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span>Belirlenen Alan Büyüklüğü:</span>
                <span className="text-amber-400 font-bold font-mono">
                  {calculatePolygonAreaKm2(drawPoints)} km² ({drawPoints.length} köşe noktası)
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSectorModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-neutral-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-600/30"
                >
                  Sektörü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
