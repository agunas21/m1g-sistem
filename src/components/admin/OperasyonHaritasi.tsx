'use client'

import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { getMovementMode, getRoadSegment, snapFullTrail, calculateDistanceKm, MovementInfo } from '@/lib/routing'

import { MapContainer, TileLayer, Marker, Polyline, Polygon, Circle, CircleMarker, Popup, useMap, useMapEvents, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { ASR1Sector } from '@/app/api/settings/operations/active/sectors/route'
import type { INSARAGWorksite, VictimExtrication } from '@/app/api/settings/operations/active/worksites/route'

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
  if (type === "SOS" || type === "Acil" || type === "Kritik Durum" || type.includes("SOS")) {
    return L.divIcon({
      className: 'custom-pin-sos-icon',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; background: rgba(239, 68, 68, 0.4); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
          <div style="width: 28px; height: 28px; background: #dc2626; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239,68,68,0.9); font-size: 13px;">
            🚨
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

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

// ── ASR-1 Sektör & ASR-2 Coğrafi Analiz Yardımcı Fonksiyonları ─────────────
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

// Ray-Casting Point-in-Polygon (ASR-2 Sektör İçi Enkaz ve Personel Tespiti)
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  if (!polygon || polygon.length < 3) return false;
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Doğa Arama (Wilderness SAR) LKP Noktasından Çember Poligonu Üretimi
function createGeoCirclePolygon(center: [number, number], radiusMeters: number, points = 32): [number, number][] {
  const coords: [number, number][] = [];
  const latRad = (center[0] * Math.PI) / 180;
  const degLatPerMeter = 1 / 110574;
  const degLngPerMeter = 1 / (111320 * Math.cos(latRad));
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = Math.sin(angle) * radiusMeters * degLatPerMeter;
    const dLng = Math.cos(angle) * radiusMeters * degLngPerMeter;
    coords.push([center[0] + dLat, center[1] + dLng]);
  }
  return coords;
}

function formatPolygonArea(rawCoords: any[]): {
  primary: string;
  secondary: string;
  fullText: string;
} {
  if (!rawCoords || rawCoords.length < 3) {
    return { primary: '0 m²', secondary: '0 km²', fullText: '0 m²' };
  }

  const coords: [number, number][] = [];
  for (const p of rawCoords) {
    if (Array.isArray(p) && p.length >= 2) {
      coords.push([Number(p[0]), Number(p[1])]);
    } else if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
      coords.push([p.lat, p.lng]);
    }
  }

  if (coords.length < 3) {
    return { primary: '0 m²', secondary: '0 km²', fullText: '0 m²' };
  }

  // WGS84 Geodezik Projeksiyon Alan Hesabı (Her ölçekte kesin ve gerçekçi sonuç verir)
  let lat0 = 0;
  for (const p of coords) lat0 += p[0];
  lat0 = (lat0 / coords.length) * (Math.PI / 180);
  const kx = Math.cos(lat0) * 111319.49;
  const ky = 110574.0;

  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const xi = coords[i][1] * kx;
    const yi = coords[i][0] * ky;
    const xj = coords[j][1] * kx;
    const yj = coords[j][0] * ky;
    area += xi * yj - xj * yi;
  }
  const m2 = Math.abs(area / 2);
  const km2 = m2 / 1000000;

  if (m2 < 10000) {
    // 10.000 m² altı (bina, parsel, küçük enkaz sahası)
    const m2Formatted = `${Math.round(m2).toLocaleString('tr-TR')} m²`;
    const km2Formatted = `${km2.toFixed(3)} km²`;
    return {
      primary: m2Formatted,
      secondary: `~${km2Formatted}`,
      fullText: `${m2Formatted} (${km2Formatted})`
    };
  } else if (km2 < 1) {
    // 10.000 m² ile 1 km² arası (mahalle, yerleşke, fabrika sahası)
    const km2Formatted = `${km2.toFixed(3)} km²`;
    const m2Formatted = `${Math.round(m2).toLocaleString('tr-TR')} m²`;
    return {
      primary: km2Formatted,
      secondary: m2Formatted,
      fullText: `${km2Formatted} (${m2Formatted})`
    };
  } else {
    // 1 km² üstü (geniş arama kurtarma alanı)
    const km2Formatted = `${km2.toFixed(2)} km²`;
    const haFormatted = `${(km2 * 100).toFixed(1)} Hektar`;
    return {
      primary: km2Formatted,
      secondary: haFormatted,
      fullText: `${km2Formatted} (${haFormatted})`
    };
  }
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

function makeWorksiteIcon(ws: INSARAGWorksite) {
  if (typeof window === 'undefined') return undefined;
  const L = require('leaflet');

  const statusColor =
    ws.status === 'Acil Müdahale' || ws.status === 'Canlı Tespiti Var' ? '#ef4444' :
    ws.status === 'Arama Sürüyor' ? '#f59e0b' :
    ws.status === 'Temizlendi' ? '#10b981' :
    ws.status === 'Yüksek Risk' ? '#7f1d1d' : '#3b82f6';

  const pulseEffect = (ws.status === 'Acil Müdahale' || ws.status === 'Canlı Tespiti Var')
    ? 'box-shadow: 0 0 15px rgba(239, 68, 68, 0.85); animation: pulse 1.5s infinite;'
    : 'box-shadow: 0 4px 12px rgba(0,0,0,0.6);';

  const hazardBadge = ws.hazards && ws.hazards.length > 0 
    ? `<div style="background:#dc2626; color:#fff; font-size:8px; font-weight:800; padding:1px 4px; border-radius:3px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">⚠️ ${ws.hazards[0]}</div>`
    : '';

  return L.divIcon({
    className: 'insarag-worksite-marker',
    iconSize: [110, 64],
    iconAnchor: [55, 32],
    html: `
      <div style="
        background: rgba(15, 23, 42, 0.95);
        border: 2px solid ${statusColor};
        border-radius: 8px;
        padding: 4px 6px;
        color: #fff;
        text-align: center;
        font-family: monospace, sans-serif;
        cursor: pointer;
        user-select: none;
        backdrop-filter: blur(4px);
        ${pulseEffect}
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:2px; margin-bottom:2px;">
          <span style="font-size:9px; font-weight:900; color:${statusColor}; letter-spacing:0.5px;">ASR-3 [${ws.code}]</span>
          <span style="font-size:8px; font-weight:700; color:#94a3b8;">TUR-M1G</span>
        </div>
        <div style="font-size:10px; font-weight:700; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${ws.name}
        </div>
        <div style="display:flex; justify-content:space-around; align-items:center; margin-top:2px; font-size:10px; font-weight:900; background:rgba(0,0,0,0.4); border-radius:4px; padding:1px 0;">
          <span style="color:#22c55e;">${ws.victims?.liveExtracted || 0} L</span>
          <span style="color:#64748b;">|</span>
          <span style="color:#ef4444;">${ws.victims?.deceasedExtracted || 0} D</span>
        </div>
        ${hazardBadge}
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
function MapController({ flyTo, isFullscreen }: { flyTo: [number, number] | null; isFullscreen?: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 17, { duration: 1.2 })
  }, [flyTo, map])
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 60)
    const t2 = setTimeout(() => map.invalidateSize(), 260)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isFullscreen, map])
  return null
}

function MapEventHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useMapEvents({
    click(e) {
      if (onClickRef.current) onClickRef.current(e.latlng.lat, e.latlng.lng);
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
  
  // ASR-1 Sektörleme & Doğa Arama LKP State'leri
  const [sectors, setSectors] = useState<ASR1Sector[]>([])
  const [selectedSector, setSelectedSector] = useState<ASR1Sector | null>(null)
  const [isDrawingSector, setIsDrawingSector] = useState(false)
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null)
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

  // Doğa Arama (Wilderness SAR) LKP Kayıp Çemberi State'leri
  const [isAddingLkp, setIsAddingLkp] = useState(false)
  const [lkpClickPos, setLkpClickPos] = useState<[number, number] | null>(null)
  const [showLkpModal, setShowLkpModal] = useState(false)
  const [lkpForm, setLkpForm] = useState({
    missingPersonName: 'Kayıp Şahıs',
    profileName: 'Doğa Yürüyüşçüsü (Hiker)' as 'Çocuk (1-6 Yaş)' | 'Demans / Alzheimer Yaşlı' | 'Doğa Yürüyüşçüsü (Hiker)' | 'Avcı / Mantar Toplayıcı',
    radius50m: 1500,
    radius95m: 5000,
    lastSeenTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    assignedTeamName: '',
    notes: ''
  })

  // ASR-3/4/5 INSARAG Enkaz Triyaj & START Kazazede Çıkarma State'leri
  const [worksites, setWorksites] = useState<INSARAGWorksite[]>([])
  const [selectedWorksite, setSelectedWorksite] = useState<INSARAGWorksite | null>(null)
  const [isAddingWorksite, setIsAddingWorksite] = useState(false)
  const [editingWorksiteId, setEditingWorksiteId] = useState<string | null>(null)
  const [showWorksiteHistoryModal, setShowWorksiteHistoryModal] = useState(false)
  const [worksiteClickPos, setWorksiteClickPos] = useState<[number, number] | null>(null)
  const [showWorksiteModal, setShowWorksiteModal] = useState(false)
  const [showExtricationModal, setShowExtricationModal] = useState(false)
  const [extricationForm, setExtricationForm] = useState({
    triage: 'Kırmızı (Acil)' as 'Yeşil (Hafif)' | 'Sarı (Orta)' | 'Kırmızı (Acil)' | 'Siyah (Vefat/Ex)',
    victimInfo: '',
    locationInRubble: 'Yaşam Üçgeni / Enkaz İçi',
    handedOverTo: '112 Ambulans / UMKE'
  })
  const [worksiteForm, setWorksiteForm] = useState({
    code: 'A-1',
    name: 'Yıkık Bina Enkazı',
    address: '',
    asrLevel: 'ASR-3' as 'ASR-3' | 'ASR-4' | 'ASR-5',
    structureType: 'Betonarme' as 'Betonarme' | 'Yığma' | 'Çelik' | 'Ahşap' | 'Diğer',
    collapseType: 'Sandviç (Pancake)' as 'Sandviç (Pancake)' | 'V-Tipi' | 'Yana Yatma' | 'Kısmi Çökme' | 'Yumuşak Kat',
    status: 'Canlı Tespiti Var' as 'Acil Müdahale' | 'Canlı Tespiti Var' | 'Arama Sürüyor' | 'Tahliye Edildi' | 'Temizlendi' | 'Yüksek Risk',
    priority: 'Kritik (P1)' as 'Kritik (P1)' | 'Yüksek (P2)' | 'Düşük (P3)',
    liveExtracted: 0,
    deceasedExtracted: 0,
    suspectedLive: 1,
    suspectedDeceased: 0,
    k9Status: 'Yapılmadı' as 'Yapılmadı' | 'Pozitif (Tepki Var)' | 'Negatif (Temiz)',
    acousticStatus: 'Yapılmadı' as 'Yapılmadı' | 'Ses Alındı' | 'Negatif (Sessiz)',
    cameraStatus: 'Yapılmadı' as 'Yapılmadı' | 'Temas Var' | 'Negatif',
    hazards: [] as string[],
    assignedTeamName: '',
    radioChannel: 'CH-1 / 446.00625 MHz',
    notes: '',
    updateNote: ''
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [showQuickGuide, setShowQuickGuide] = useState(true)
  const lastPingRef = useRef<number>(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!isFullscreen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showSectorModal && !showWorksiteModal && !showWorksiteHistoryModal && !showLkpModal && !showExtricationModal) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isFullscreen, showSectorModal, showWorksiteModal, showWorksiteHistoryModal, showLkpModal, showExtricationModal])

  // ── İlk yükleme ve API eşleşmesi ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Bağımsız olarak önce sektör ve enkazları önbelleksiz (no-store) çek
        const [secRes, wsRes, resOp] = await Promise.all([
          fetch(`/api/settings/operations/active/sectors?operationId=${operationId}`, { cache: 'no-store' }).catch(() => null),
          fetch(`/api/settings/operations/active/worksites?operationId=${operationId}`, { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/operations/active', { cache: 'no-store' })
        ]);

        let loadedSectors: ASR1Sector[] = [];
        let loadedWorksites: INSARAGWorksite[] = [];

        if (secRes && secRes.ok) {
          const d = await secRes.json();
          if (Array.isArray(d.sectors)) {
            loadedSectors = d.sectors;
            setSectors(d.sectors);
          }
        }
        if (wsRes && wsRes.ok) {
          const d = await wsRes.json();
          if (Array.isArray(d.worksites)) {
            loadedWorksites = d.worksites;
            setWorksites(d.worksites);
          }
        }

        const ops = await resOp.json();
        const op = Array.isArray(ops) ? ops.find((o: any) => o.id === operationId) : null;
        if (!op) return;

        if (loadedSectors.length === 0 && Array.isArray(op.sectors) && op.sectors.length > 0) {
          loadedSectors = op.sectors;
          setSectors(op.sectors);
        }
        if (loadedWorksites.length === 0 && Array.isArray(op.worksites) && op.worksites.length > 0) {
          loadedWorksites = op.worksites;
          setWorksites(op.worksites);
        }

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
        } else if (loadedWorksites.length > 0) {
            setFlyTo(loadedWorksites[0].location);
        } else if (loadedSectors.length > 0 && loadedSectors[0].polygon?.length > 0) {
            setFlyTo(getPolygonCenter(loadedSectors[0].polygon));
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

            const updated = [...existing, [lat, lng] as [number, number]];
            return { ...prev, [memberId]: updated.slice(-MAX_TRAIL) };
        });
    });

    // Realtime ASR-1 Sektör güncellemeleri
    channelRef.current.on('broadcast', { event: 'sector_update' }, (payload: any) => {
        if (payload?.payload?.sector) {
            const sec = payload.payload.sector;
            setSectors(prev => [...prev.filter(s => s.id !== sec.id), sec]);
        }
    });

    channelRef.current.on('broadcast', { event: 'sector_delete' }, (payload: any) => {
        if (payload?.payload?.sectorId) {
            setSectors(prev => prev.filter(s => s.id !== payload.payload.sectorId));
        }
    });

    // Realtime ASR-3 Enkaz güncellemeleri
    channelRef.current.on('broadcast', { event: 'worksite_update' }, (payload: any) => {
        if (payload?.payload?.worksite) {
            const ws = payload.payload.worksite;
            setWorksites(prev => [...prev.filter(w => w.id !== ws.id), ws]);
        }
    });

    channelRef.current.on('broadcast', { event: 'worksite_delete' }, (payload: any) => {
        if (payload?.payload?.worksiteId) {
            setWorksites(prev => prev.filter(w => w.id !== payload.payload.worksiteId));
        }
    });

    channelRef.current.subscribe();

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
    setIsAddingWorksite(false);
    setIsAddingLkp(false);
    setEditingSectorId(null);
    setDrawPoints([]);
    setSelected(null);
    setSelectedSector(null);
  };

  const handleCancelDrawing = () => {
    setIsDrawingSector(false);
    setEditingSectorId(null);
    setDrawPoints([]);
  };

  const handleUndoDrawingPoint = () => {
    setDrawPoints(prev => prev.slice(0, -1));
  };

  const handleFinishDrawing = () => {
    if (drawPoints.length < 3) return;
    const defaultCode = getNextSectorCode(sectors);
    setEditingSectorId(null);
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

  const handleStartEditSector = (sec: ASR1Sector) => {
    setEditingSectorId(sec.id);
    setDrawPoints(sec.polygon);
    setNewSectorForm({
      code: sec.code,
      name: sec.name,
      status: sec.status,
      priority: sec.priority,
      assignedTeamId: sec.assignedTeamId || '',
      assignedTeamName: sec.assignedTeamName || '',
      hazards: sec.hazards || '',
      radioChannel: sec.radioChannel || 'CH-1 / 446.00625 MHz',
      color: sec.color || '#3b82f6'
    });
    setShowSectorModal(true);
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    const polyToSave = editingSectorId ? (selectedSector?.polygon || drawPoints) : drawPoints;
    if (!polyToSave || polyToSave.length < 3) return;

    const payload = {
      operationId,
      id: editingSectorId || undefined,
      code: newSectorForm.code,
      name: newSectorForm.name,
      polygon: polyToSave,
      assignedTeamId: newSectorForm.assignedTeamId,
      assignedTeamName: newSectorForm.assignedTeamName,
      status: newSectorForm.status,
      priority: newSectorForm.priority,
      hazards: newSectorForm.hazards,
      radioChannel: newSectorForm.radioChannel,
      color: newSectorForm.color,
      sectorType: selectedSector?.sectorType || 'ASR-1',
      lkpMeta: selectedSector?.lkpMeta
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
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Sektör kaydedilemedi: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error("Sektör kaydedilemedi", err);
      alert("Sektör kaydedilirken bağlantı hatası oluştu.");
    } finally {
      setIsDrawingSector(false);
      setEditingSectorId(null);
      setDrawPoints([]);
      setShowSectorModal(false);
    }
  };

  // Doğa Arama (Wilderness SAR) LKP Kayıp Çemberi Kaydetme
  const handleSaveLkp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lkpClickPos) return;

    const poly95 = createGeoCirclePolygon(lkpClickPos, lkpForm.radius95m, 36);
    const lkpCount = sectors.filter(s => s.sectorType === 'LKP').length + 1;

    const payload = {
      operationId,
      code: `LKP-${lkpCount}`,
      name: `${lkpForm.missingPersonName} (${lkpForm.profileName})`,
      polygon: poly95,
      assignedTeamName: lkpForm.assignedTeamName,
      status: 'Aktif Arama',
      priority: 'Kritik',
      hazards: `Son Görülme: ${lkpForm.lastSeenTime} | %50 Çember: ${lkpForm.radius50m}m | %95 Çember: ${lkpForm.radius95m}m`,
      radioChannel: 'CH-1 / 446.00625 MHz',
      color: '#f59e0b',
      sectorType: 'LKP',
      lkpMeta: {
        center: lkpClickPos,
        profileName: lkpForm.profileName,
        radius50m: lkpForm.radius50m,
        radius95m: lkpForm.radius95m,
        missingPersonName: lkpForm.missingPersonName,
        lastSeenTime: lkpForm.lastSeenTime
      }
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
      console.error("LKP çemberi kaydedilemedi", err);
    } finally {
      setIsAddingLkp(false);
      setLkpClickPos(null);
      setShowLkpModal(false);
    }
  };

  // GPX Rota, Sektör ve Enkaz Dışa Aktarma (Garmin / Google Earth / AFAD CBS Uyumlu)
  const handleExportGPX = () => {
    const nowIso = new Date().toISOString();
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="M1G Arama Kurtarma C4ISR" xmlns="http://www.topografix.com/GPX/1/1">\n`;
    gpx += `  <metadata><name>${opStats.name || operationId} - Saha Harita Verisi</name><time>${nowIso}</time></metadata>\n`;

    // 1. Enkazlar (Worksites) Waypoint olarak
    worksites.forEach(ws => {
      gpx += `  <wpt lat="${ws.location[0]}" lon="${ws.location[1]}">\n`;
      gpx += `    <name>[${ws.asrLevel || 'ASR-3'} ${ws.code}] ${ws.name}</name>\n`;
      gpx += `    <desc>Durum: ${ws.status} | Öncelik: ${ws.priority} | Canlı: ${ws.victims?.liveExtracted || 0} | Vefat: ${ws.victims?.deceasedExtracted || 0} | Tim: ${ws.assignedTeamName || '-'}</desc>\n`;
      gpx += `  </wpt>\n`;
    });

    // 2. Pinler Waypoint olarak
    pins.forEach(pin => {
      if (Array.isArray(pin.location)) {
        gpx += `  <wpt lat="${pin.location[0]}" lon="${pin.location[1]}">\n`;
        gpx += `    <name>[${pin.type}] ${pin.name}</name>\n`;
        gpx += `  </wpt>\n`;
      }
    });

    // 3. ASR-1 Sektörleri Route olarak
    sectors.forEach(sec => {
      gpx += `  <rte>\n    <name>[${sec.sectorType || 'ASR-1'} ${sec.code}] ${sec.name}</name>\n`;
      sec.polygon.forEach(pt => {
        gpx += `    <rtept lat="${pt[0]}" lon="${pt[1]}"></rtept>\n`;
      });
      if (sec.polygon.length > 0) {
        gpx += `    <rtept lat="${sec.polygon[0][0]}" lon="${sec.polygon[0][1]}"></rtept>\n`;
      }
      gpx += `  </rte>\n`;
    });

    // 4. Personel Yürüyüş İzleri (Trails) Track olarak
    Object.entries(trails).forEach(([memberId, pts]) => {
      if (!pts || pts.length === 0) return;
      const pName = locations[memberId]?.member_name || memberId;
      gpx += `  <trk>\n    <name>${pName} (${locations[memberId]?.team_name || 'Saha'})</name>\n    <trkseg>\n`;
      pts.forEach(pt => {
        gpx += `      <trkpt lat="${pt[0]}" lon="${pt[1]}"></trkpt>\n`;
      });
      gpx += `    </trkseg>\n  </trk>\n`;
    });

    gpx += `</gpx>`;
    const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `M1G-${operationId}-Saha-Harita.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSector = async (sectorId: string) => {
    if (!confirm("Bu ASR-1 sektörünü / arama çemberini silmek istediğinize emin misiniz?")) return;
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

  // ── ASR-3/4/5 INSARAG Enkaz Yönetim Fonksiyonları ────────────────────────
  const handleQuickVictimUpdate = async (
    wsOrType: INSARAGWorksite | 'live' | 'deceased' | 'suspectedLive' | 'liveExtracted' | 'deceasedExtracted',
    typeOrDelta: 'live' | 'deceased' | 'suspectedLive' | 'liveExtracted' | 'deceasedExtracted' | number,
    maybeDelta?: number
  ) => {
    const targetWs = (typeof wsOrType === 'object' && wsOrType !== null) ? wsOrType : selectedWorksite;
    if (!targetWs) return;
    const rawType = (typeof wsOrType === 'object') ? String(typeOrDelta) : String(wsOrType);
    const delta = (typeof wsOrType === 'object') ? Number(maybeDelta || 0) : Number(typeOrDelta || 0);

    const isLive = rawType === 'live' || rawType === 'liveExtracted';
    const isDeceased = rawType === 'deceased' || rawType === 'deceasedExtracted';
    const isSuspected = rawType === 'suspectedLive';

    const currentLive = targetWs.victims?.liveExtracted || 0;
    const currentDeceased = targetWs.victims?.deceasedExtracted || 0;
    const currentSuspected = targetWs.victims?.suspectedLive || 0;

    const updatedVictims = {
      ...targetWs.victims,
      liveExtracted: isLive ? Math.max(0, currentLive + delta) : currentLive,
      deceasedExtracted: isDeceased ? Math.max(0, currentDeceased + delta) : currentDeceased,
      suspectedLive: isSuspected ? Math.max(0, currentSuspected + delta) : currentSuspected,
      suspectedDeceased: targetWs.victims?.suspectedDeceased || 0
    };

    const actionMsg = isLive
      ? `${delta > 0 ? '+1' : '-1'} Canlı Çıkarıldı (Toplam: ${updatedVictims.liveExtracted})`
      : isDeceased
      ? `${delta > 0 ? '+1' : '-1'} Vefat Kaydı (Toplam: ${updatedVictims.deceasedExtracted})`
      : `${delta > 0 ? '+1' : '-1'} Şüpheli Canlı Tespiti (Toplam: ${updatedVictims.suspectedLive})`;

    try {
      const res = await fetch('/api/settings/operations/active/worksites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId,
          ...targetWs,
          victims: updatedVictims,
          logAction: actionMsg
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.worksite) {
          setSelectedWorksite(data.worksite);
          setWorksites(prev => prev.map(w => w.id === data.worksite.id ? data.worksite : w));
        }
      }
    } catch (err) {
      console.error("Enkaz kazazede sayısı güncellenemedi", err);
    }
  };

  // START Triyaj & Kazazede Çıkarma Kartı Kaydetme
  const handleSaveExtrication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorksite) return;

    const isEx = extricationForm.triage.startsWith('Siyah');
    const updatedVictims = {
      ...selectedWorksite.victims,
      liveExtracted: isEx ? (selectedWorksite.victims?.liveExtracted || 0) : (selectedWorksite.victims?.liveExtracted || 0) + 1,
      deceasedExtracted: isEx ? (selectedWorksite.victims?.deceasedExtracted || 0) + 1 : (selectedWorksite.victims?.deceasedExtracted || 0),
      suspectedLive: Math.max(0, (selectedWorksite.victims?.suspectedLive || 0) - 1),
      suspectedDeceased: selectedWorksite.victims?.suspectedDeceased || 0
    };

    const newExt: VictimExtrication = {
      id: `EXT-${Date.now()}`,
      timeString: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('tr-TR'),
      triage: extricationForm.triage,
      victimInfo: extricationForm.victimInfo || 'Kimliği Belirsiz Kazazede',
      locationInRubble: extricationForm.locationInRubble || 'Enkaz İçi',
      handedOverTo: extricationForm.handedOverTo || '112 Acil Sağlık',
      recordedBy: 'Komuta / Kurtarma Timi'
    };

    const updatedExtrications = [newExt, ...(selectedWorksite.extrications || [])];

    try {
      const res = await fetch('/api/settings/operations/active/worksites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId,
          ...selectedWorksite,
          victims: updatedVictims,
          extrications: updatedExtrications,
          logAction: `🚑 Kazazede Çıkarıldı [${newExt.triage}]: ${newExt.victimInfo} (${newExt.locationInRubble}) ➔ ${newExt.handedOverTo}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.worksite) {
          setSelectedWorksite(data.worksite);
          setWorksites(prev => prev.map(w => w.id === data.worksite.id ? data.worksite : w));
        }
      }
    } catch (err) {
      console.error("Kazazede triyaj kartı kaydedilemedi", err);
    } finally {
      setShowExtricationModal(false);
      setExtricationForm({
        triage: 'Kırmızı (Acil)',
        victimInfo: '',
        locationInRubble: 'Yaşam Üçgeni / Enkaz İçi',
        handedOverTo: '112 Ambulans / UMKE'
      });
    }
  };

  const handleStartEditWorksite = (ws: INSARAGWorksite) => {
    setEditingWorksiteId(ws.id);
    setWorksiteClickPos(ws.location);
    setWorksiteForm({
      code: ws.code,
      name: ws.name,
      address: ws.address || '',
      asrLevel: ws.asrLevel || 'ASR-3',
      structureType: ws.structureType,
      collapseType: ws.collapseType,
      status: ws.status,
      priority: ws.priority,
      liveExtracted: ws.victims?.liveExtracted || 0,
      deceasedExtracted: ws.victims?.deceasedExtracted || 0,
      suspectedLive: ws.victims?.suspectedLive || 0,
      suspectedDeceased: ws.victims?.suspectedDeceased || 0,
      k9Status: ws.techSearch?.k9 || 'Yapılmadı',
      acousticStatus: ws.techSearch?.acoustic || 'Yapılmadı',
      cameraStatus: ws.techSearch?.camera || 'Yapılmadı',
      hazards: ws.hazards || [],
      assignedTeamName: ws.assignedTeamName || '',
      radioChannel: ws.radioChannel || 'CH-1 / 446.00625 MHz',
      notes: ws.notes || '',
      updateNote: ''
    });
    setShowWorksiteModal(true);
  };

  const handleSaveWorksite = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = editingWorksiteId ? selectedWorksite?.location || worksiteClickPos : worksiteClickPos;
    if (!loc) return;

    const payload = {
      operationId,
      id: editingWorksiteId || undefined,
      code: worksiteForm.code,
      name: worksiteForm.name,
      address: worksiteForm.address,
      location: loc,
      asrLevel: worksiteForm.asrLevel,
      structureType: worksiteForm.structureType,
      collapseType: worksiteForm.collapseType,
      status: worksiteForm.status,
      priority: worksiteForm.priority,
      victims: {
        liveExtracted: Number(worksiteForm.liveExtracted) || 0,
        deceasedExtracted: Number(worksiteForm.deceasedExtracted) || 0,
        suspectedLive: Number(worksiteForm.suspectedLive) || 0,
        suspectedDeceased: Number(worksiteForm.suspectedDeceased) || 0,
      },
      techSearch: {
        k9: worksiteForm.k9Status,
        acoustic: worksiteForm.acousticStatus,
        camera: worksiteForm.cameraStatus
      },
      extrications: editingWorksiteId ? selectedWorksite?.extrications : [],
      hazards: worksiteForm.hazards,
      assignedTeamName: worksiteForm.assignedTeamName,
      radioChannel: worksiteForm.radioChannel,
      notes: worksiteForm.notes,
      updateNote: worksiteForm.updateNote,
      markingDate: new Date().toLocaleString('tr-TR')
    };

    try {
      const res = await fetch('/api/settings/operations/active/worksites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.worksite) {
          setWorksites(prev => [...prev.filter(w => w.id !== data.worksite.id), data.worksite]);
          setSelectedWorksite(data.worksite);
        }
      }
    } catch (err) {
      console.error("Enkaz kaydedilemedi", err);
    } finally {
      setIsAddingWorksite(false);
      setEditingWorksiteId(null);
      setWorksiteClickPos(null);
      setShowWorksiteModal(false);
    }
  };

  const handleDeleteWorksite = async (worksiteId: string) => {
    if (!confirm("Bu INSARAG enkaz kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/settings/operations/active/worksites?operationId=${operationId}&worksiteId=${worksiteId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWorksites(prev => prev.filter(w => w.id !== worksiteId));
        if (selectedWorksite?.id === worksiteId) setSelectedWorksite(null);
      }
    } catch (err) {
      console.error("Enkaz silinemedi", err);
    }
  };

  const isDrawingSectorRef = useRef(isDrawingSector);
  const isAddingWorksiteRef = useRef(isAddingWorksite);
  const isAddingLkpRef = useRef(isAddingLkp);
  useEffect(() => {
    isDrawingSectorRef.current = isDrawingSector;
  }, [isDrawingSector]);
  useEffect(() => {
    isAddingWorksiteRef.current = isAddingWorksite;
  }, [isAddingWorksite]);
  useEffect(() => {
    isAddingLkpRef.current = isAddingLkp;
  }, [isAddingLkp]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isDrawingSectorRef.current) {
      setDrawPoints(prev => [...prev, [lat, lng]]);
    } else if (isAddingLkpRef.current) {
      setLkpClickPos([lat, lng]);
      setIsAddingLkp(false);
      setLkpForm(prev => ({
        ...prev,
        assignedTeamName: teamsList[0]?.name || ''
      }));
      setShowLkpModal(true);
    } else if (isAddingWorksiteRef.current) {
      setWorksiteClickPos([lat, lng]);
      setIsAddingWorksite(false);
      const nextCode = `A-${worksites.length + 1}`;
      setWorksiteForm(prev => ({
        ...prev,
        code: nextCode,
        name: `Enkaz ${nextCode}`,
        address: '',
        asrLevel: 'ASR-3',
        assignedTeamName: teamsList[0]?.name || ''
      }));
      setShowWorksiteModal(true);
    } else if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick, worksites.length, teamsList]);

  // ── Eski/Geçmiş GPS Verilerini Sıfırlama ─────────────────────────────────
  const handleClearOperationGPS = async () => {
    if (!confirm("⚠️ Bu operasyondaki tüm eski GPS konum geçmişini ve rotaları sıfırlamak istiyor musunuz?\n\nBu işlem önceki tatbikatlardan kalan yanlış/eski konumları temizler ve sadece sahada olan üyelerden gelen yeni canlı sinyalleri gösterir.")) {
      return;
    }
    try {
      const res = await fetch(`/api/settings/operations/active/location?operationId=${operationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setLocations(prev => {
          const reset: Record<string, PersonnelLocation> = {};
          for (const [k, v] of Object.entries(prev)) {
            reset[k] = { ...v, lat: undefined, lng: undefined, is_online: false, speed: 0, recorded_at: undefined };
          }
          return reset;
        });
        setTrails({});
        setSelected(null);
        alert("Eski GPS verileri ve rotalar temizlendi. Sistem artık sadece sahada yeni sinyal atan üyeleri gösterecektir.");
      } else {
        alert("GPS verileri temizlenirken bir hata oluştu.");
      }
    } catch (e) {
      console.error("GPS reset error", e);
      alert("GPS verileri temizlenemedi.");
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
      maxHeight: isFullscreen ? '55vh' : '56%',
      overflowY: 'auto' as const,
      background:'rgba(17,24,39,.97)', borderTop:'0.5px solid rgba(255,255,255,.1)',
      padding:'16px 20px', zIndex:1000,
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition:'transform .25s ease',
    }),
  }

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-[9990] flex w-screen h-screen bg-[#1a1f2e] font-sans rounded-none overflow-hidden"
        : "relative flex w-full h-full bg-[#1a1f2e] font-sans rounded-2xl overflow-hidden"
    }>
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
        {/* Üst Komuta & Hızlı İşlem Çubuğu (İlk kez kullananlar için sadeleştirilmiş tasarım) */}
        <div className="min-h-[56px] bg-[#0f172a] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-[1000]">
          {/* Sol Grup: Personel Listesi & Özet Sayaçlar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/70 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap shadow-sm transition-all"
              title="Sahadaki personellerin canlı konum, batarya ve durum listesini aç/kapat"
            >
              <span>👥</span>
              <span>Personel Listesi</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black">
                {onlineN}/{people.length} Aktif
              </span>
            </button>

            {sectors.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedSector) setSelectedSector(null);
                  else {
                    setSelectedSector(sectors[0]);
                    setFlyTo(getPolygonCenter(sectors[0].polygon));
                  }
                }}
                className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                title="Çizilmiş arama bölgelerine (sektörlere) odaklanmak için tıklayın"
              >
                <span>📐</span>
                <span>{sectors.length} Bölge/Sektör</span>
              </button>
            )}

            {worksites.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedWorksite) setSelectedWorksite(null);
                  else {
                    setSelectedWorksite(worksites[0]);
                    setFlyTo(worksites[0].location);
                  }
                }}
                className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                title="İşaretlenmiş bina/enkaz noktalarına odaklanmak için tıklayın"
              >
                <span>🏢</span>
                <span>{worksites.length} Enkaz/Nokta</span>
              </button>
            )}
          </div>

          {/* Sağ Grup: Adım Adım Saha İşaretleme Butonları & Araçlar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Adım: Alan / Sektör Çiz */}
            <button
              type="button"
              onClick={startSectorDrawing}
              disabled={isDrawingSector}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm ${
                isDrawingSector
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 border border-blue-400/40 text-white'
              }`}
              title="1. Adım: Harita üzerinde arama yapılacak mahalleyi/bölgeyi köşe noktalarına tıklayarak çerçeveleyin (INSARAG ASR-1)"
            >
              <span className="px-1.5 py-0.2 bg-black/25 rounded text-[10px] font-black">1</span>
              <span>📐 {isDrawingSector ? 'Köşeleri Seçin...' : 'Alan / Sektör Çiz'}</span>
            </button>

            {/* 2. Adım: Enkaz / Bina Ekle */}
            <button
              type="button"
              onClick={() => {
                setIsAddingWorksite(prev => !prev);
                setIsDrawingSector(false);
                setIsAddingLkp(false);
                setSelected(null);
                setSelectedSector(null);
                setSelectedWorksite(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm ${
                isAddingWorksite
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-400 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white'
              }`}
              title="2. Adım: Yıkık bina, enkaz veya kritik müdahale noktasını haritaya tıklayarak işaretleyin (INSARAG ASR-3/4/5)"
            >
              <span className="px-1.5 py-0.2 bg-black/25 rounded text-[10px] font-black">2</span>
              <span>🏗️ {isAddingWorksite ? 'Haritada Noktaya Tıklayın' : 'Enkaz / Bina Ekle'}</span>
            </button>

            {/* 3. Adım: Doğa Arama Kayıp Çemberi */}
            <button
              type="button"
              onClick={() => {
                setIsAddingLkp(prev => !prev);
                setIsDrawingSector(false);
                setIsAddingWorksite(false);
                setSelected(null);
                setSelectedSector(null);
                setSelectedWorksite(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm ${
                isAddingLkp
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-500 border border-purple-400/40 text-white'
              }`}
              title="3. Adım: Doğada kaybolan kişinin son görüldüğü noktayı (LKP) işaretleyip %50 ve %95 bulunma çemberi oluşturun"
            >
              <span className="px-1.5 py-0.2 bg-black/25 rounded text-[10px] font-black">3</span>
              <span>🧭 {isAddingLkp ? 'Son Görülme Noktasına Tıklayın' : 'Kayıp Çemberi'}</span>
            </button>

            {/* Yardım / Hızlı Rehber Butonu */}
            <button
              type="button"
              onClick={() => setShowQuickGuide(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap border transition-all ${
                showQuickGuide
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Harita kullanım rehberini göster/gizle"
            >
              <span>💡</span>
              <span className="hidden md:inline">Nasıl Kullanılır?</span>
            </button>

            {/* Araçlar Açılır Menüsü (GPX İndir & GPS Sıfırla kalabalık yapmasın diye tek menüde) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowToolsMenu(prev => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all"
                title="GPX Harita İndirme ve GPS Geçmişi Sıfırlama Araçları"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Araçlar</span>
                <span className="text-[10px] opacity-70">▾</span>
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-[2000] space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsMenu(false);
                      handleExportGPX();
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-sky-500/15 text-left text-xs font-bold text-sky-300 flex items-center gap-2 transition-colors"
                  >
                    <span>📥</span>
                    <div>
                      <div>Harita Verisini İndir (.GPX)</div>
                      <div className="text-[10px] font-normal text-slate-400">Garmin, Google Earth & AFAD uyumlu</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsMenu(false);
                      handleClearOperationGPS();
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-rose-500/15 text-left text-xs font-bold text-rose-300 flex items-center gap-2 transition-colors"
                  >
                    <span>🧹</span>
                    <div>
                      <div>Eski GPS İzlerini Sıfırla</div>
                      <div className="text-[10px] font-normal text-slate-400">Önceki tatbikat konumlarını temizler</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Tam Ekran / Tam Boy Butonu */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shadow-sm ${
                isFullscreen
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white'
              }`}
              title={isFullscreen ? 'Tam Ekrandan Çık (ESC)' : 'Haritayı Tam Ekran Yap'}
            >
              <span>{isFullscreen ? '🗗' : '⛶'}</span>
              <span>{isFullscreen ? 'Küçült (ESC)' : 'Tam Ekran'}</span>
            </button>
          </div>
        </div>

        {/* İlk Kez Kullananlar İçin Adım Adım Hızlı Rehber Şeridi */}
        {showQuickGuide && (
          <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 z-[999]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <span>💡</span> Hızlı Kullanım Rehberi:
              </span>
              <span>
                <strong className="text-blue-400">1. Alan/Sektör Çiz:</strong> Haritada 3+ köşeye tıklayıp arama bölgesini çerçeveleyin.
              </span>
              <span>
                <strong className="text-emerald-400">2. Enkaz/Bina Ekle:</strong> Yıkık binaya tıklayıp kazazede ve çalışma seviyesini (ASR-3/4/5) girin.
              </span>
              <span>
                <strong className="text-purple-400">3. Kayıp Çemberi:</strong> Doğada kaybolan kişinin son görüldüğü yere tıklayın.
              </span>
              <span className="text-slate-400 italic">
                (Haritadaki herhangi bir sektöre veya enkaza tıklayarak bilgileri güncelleyebilirsiniz.)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickGuide(false)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-bold whitespace-nowrap"
            >
              Gizle ✕
            </button>
          </div>
        )}
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

          {isAddingWorksite && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'rgba(15,23,42,0.92)', border: '1.5px solid #10b981',
              borderRadius: 30, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
            }}>
              <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>
                📍 ASR-3/4/5: Haritada enkazın / binanın konumuna tıklayın
              </span>
              <button
                onClick={() => setIsAddingWorksite(false)}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px',
                  borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                ✕ İptal
              </button>
            </div>
          )}

          {isAddingLkp && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'rgba(15,23,42,0.94)', border: '1.5px solid #a855f7',
              borderRadius: 30, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
            }}>
              <span style={{ fontSize: 13, color: '#d8b4fe', fontWeight: 700 }}>
                🧭 LKP (Doğa Arama): Kayıp şahsın son görüldüğü noktaya tıklayın
              </span>
              <button
                onClick={() => setIsAddingLkp(false)}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px',
                  borderRadius: 16, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                }}
              >
                ✕ İptal
              </button>
            </div>
          )}

          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height:'100%', width:'100%', background:'#111827', cursor: (isDrawingSector || isAddingWorksite || isAddingLkp) ? 'crosshair' : undefined }}
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

            {mapReady && <MapController flyTo={flyTo} isFullscreen={isFullscreen} />}
            <MapEventHandler onClick={handleMapClick} />
            {onMapClick && !isDrawingSector && !isAddingWorksite && !isAddingLkp && <CenterPinButton onClick={onMapClick} />}
            {onMapClick && !isDrawingSector && !isAddingWorksite && !isAddingLkp && <CenterCrosshair />}

            {/* ASR-1 Sektörleri & Doğa Arama LKP Olasılık Çemberleri */}
            {sectors.map((sec) => {
              const isSecSelected = selectedSector?.id === sec.id;
              const center = sec.lkpMeta?.center || getPolygonCenter(sec.polygon);
              const icon = makeSectorLabelIcon(sec);

              return (
                <Fragment key={sec.id}>
                  <Polygon
                    positions={sec.polygon}
                    pathOptions={{
                      color: sec.color,
                      fillColor: sec.color,
                      fillOpacity: isSecSelected ? 0.32 : 0.14,
                      weight: isSecSelected ? 4 : 2.5,
                      dashArray: (sec.status === 'Değerlendirme' || sec.sectorType === 'LKP') ? '6, 6' : undefined
                    }}
                    eventHandlers={{
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        setSelectedSector(sec);
                        setSelectedWorksite(null);
                        setSelected(null);
                      }
                    }}
                  />
                  {/* Eğer LKP Kayıp Arama Çemberi ise %50 İç Olasılık Halkasını da Çiz */}
                  {sec.sectorType === 'LKP' && sec.lkpMeta && (
                    <Circle
                      center={sec.lkpMeta.center}
                      radius={sec.lkpMeta.radius50m}
                      pathOptions={{
                        color: '#22c55e',
                        fillColor: '#22c55e',
                        fillOpacity: 0.18,
                        weight: 2.5,
                        dashArray: '4, 4'
                      }}
                    />
                  )}
                  {icon && (
                    <Marker
                      position={center}
                      icon={icon}
                      eventHandlers={{
                        click: (e) => {
                          L.DomEvent.stopPropagation(e);
                          setSelectedSector(sec);
                          setSelectedWorksite(null);
                          setSelected(null);
                        }
                      }}
                    />
                  )}
                </Fragment>
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

            {/* ASR-3/4/5 INSARAG Enkazları */}
            {worksites.map((ws) => (
              <Marker
                key={ws.id}
                position={ws.location}
                icon={makeWorksiteIcon(ws)}
                eventHandlers={{
                  click: () => {
                    setSelectedWorksite(ws);
                    setSelectedSector(null);
                    setSelected(null);
                  }
                }}
              />
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
                <Fragment key={p.member_id}>
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
                </Fragment>
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

        {/* ── Detay paneli (personel, sektör veya enkaz tıklanınca açılır) ──── */}
        <div style={S.dpPanel(!!selPer || !!selectedSector || !!selectedWorksite)}>
          {/* ASR-3/4/5 INSARAG Enkaz Triyaj Detay Kartı */}
          {selectedWorksite && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{
                  width:42, height:42, borderRadius:10,
                  background: 'rgba(16,185,129,0.15)',
                  border: '2px solid #10b981',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, flexShrink:0
                }}>
                  🏢
                </div>
                <div style={{ flex: 1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#34d399', fontFamily:'monospace' }}>
                      {selectedWorksite.asrLevel || 'ASR-3'} [{selectedWorksite.code}]
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.1)', color:'#94a3b8', padding:'2px 6px', borderRadius:4 }}>
                      TUR-M1G
                    </span>
                    {selectedWorksite.asrLevel === 'ASR-4' && (
                      <span style={{ fontSize:10, fontWeight:800, background:'rgba(245,158,11,0.2)', color:'#fbbf24', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(245,158,11,0.4)' }}>
                        🔨 DERİN KURTARMA
                      </span>
                    )}
                    {selectedWorksite.asrLevel === 'ASR-5' && (
                      <span style={{ fontSize:10, fontWeight:800, background:'rgba(148,163,184,0.2)', color:'#cbd5e1', padding:'2px 6px', borderRadius:4, border:'1px solid rgba(148,163,184,0.4)' }}>
                        🚜 ENKAZ TEMİZLİK / DEVİR ONAYLI
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {selectedWorksite.name}
                  </div>
                  {selectedWorksite.address && (
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      📍 {selectedWorksite.address}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedWorksite(null)}
                  style={{ marginLeft:'auto', background:'transparent', border:'none', cursor:'pointer', color:'#64748b', fontSize:24, lineHeight:1 }}
                >×</button>
              </div>

              {/* Durum, Öncelik & Yapı Türü Rozetleri */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: selectedWorksite.status === 'Acil Müdahale' || selectedWorksite.status === 'Canlı Tespiti Var' ? 'rgba(239,68,68,0.2)' :
                              selectedWorksite.status === 'Temizlendi' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: selectedWorksite.status === 'Acil Müdahale' || selectedWorksite.status === 'Canlı Tespiti Var' ? '#f87171' :
                         selectedWorksite.status === 'Temizlendi' ? '#34d399' : '#fbbf24',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  ● {selectedWorksite.status}
                </span>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Öncelik: {selectedWorksite.priority}
                </span>
                <span style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)'
                }}>
                  🏗️ {selectedWorksite.structureType} / {selectedWorksite.collapseType}
                </span>
              </div>

              {/* ASR-4 Teknik Arama Durum Çubuğu (K9 / Akustik / Termal Kamera) */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:10 }}>
                <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'5px 6px', fontSize:10 }}>
                  <span style={{ color:'#94a3b8', display:'block', fontWeight:600 }}>🐕 K9 KÖPEK</span>
                  <span style={{ color: selectedWorksite.techSearch?.k9?.includes('Pozitif') ? '#4ade80' : '#e2e8f0', fontWeight:700 }}>
                    {selectedWorksite.techSearch?.k9 || 'Yapılmadı'}
                  </span>
                </div>
                <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'5px 6px', fontSize:10 }}>
                  <span style={{ color:'#94a3b8', display:'block', fontWeight:600 }}>🎧 AKUSTİK/SİSMİK</span>
                  <span style={{ color: selectedWorksite.techSearch?.acoustic?.includes('Ses') ? '#4ade80' : '#e2e8f0', fontWeight:700 }}>
                    {selectedWorksite.techSearch?.acoustic || 'Yapılmadı'}
                  </span>
                </div>
                <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'5px 6px', fontSize:10 }}>
                  <span style={{ color:'#94a3b8', display:'block', fontWeight:600 }}>📷 YILAN KAMERA</span>
                  <span style={{ color: selectedWorksite.techSearch?.camera?.includes('Temas') ? '#4ade80' : '#e2e8f0', fontWeight:700 }}>
                    {selectedWorksite.techSearch?.camera || 'Yapılmadı'}
                  </span>
                </div>
              </div>

              {/* Kazazede & Canlı / Vefat Hızlı Güncelleme Sayaçları */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
                {/* Canlı Çıkarılan (L) */}
                <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:8, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#86efac', fontWeight:700 }}>CANLI ÇIKARILAN (L)</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#22c55e', margin:'4px 0' }}>
                    {selectedWorksite.victims?.liveExtracted || 0}
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:4 }}>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'liveExtracted', -1)}
                      style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >-</button>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'liveExtracted', 1)}
                      style={{ background:'#22c55e', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >+</button>
                  </div>
                </div>

                {/* Vefat (D) */}
                <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#fca5a5', fontWeight:700 }}>VEFAT (D)</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#ef4444', margin:'4px 0' }}>
                    {selectedWorksite.victims?.deceasedExtracted || 0}
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:4 }}>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'deceasedExtracted', -1)}
                      style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >-</button>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'deceasedExtracted', 1)}
                      style={{ background:'#ef4444', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >+</button>
                  </div>
                </div>

                {/* Şüpheli / Beklenen Canlı */}
                <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:'#fde68a', fontWeight:700 }}>ŞÜPHELİ CANLI</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#f59e0b', margin:'4px 0' }}>
                    {selectedWorksite.victims?.suspectedLive || 0}
                  </div>
                  <div style={{ display:'flex', justifyContent:'center', gap:4 }}>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'suspectedLive', -1)}
                      style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >-</button>
                    <button
                      onClick={() => handleQuickVictimUpdate(selectedWorksite, 'suspectedLive', 1)}
                      style={{ background:'#f59e0b', border:'none', color:'#fff', width:24, height:24, borderRadius:4, cursor:'pointer', fontWeight:'bold' }}
                    >+</button>
                  </div>
                </div>
              </div>

              {/* START Triyaj & Kazazede Çıkarma Kayıtları Özeti */}
              {selectedWorksite.extrications && selectedWorksite.extrications.length > 0 && (
                <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:8, marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:800, color:'#34d399', marginBottom:4 }}>
                    🚑 ÇIKARILAN KAZAZEDE TRİYAJ KAYITLARI ({selectedWorksite.extrications.length})
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:80, overflowY:'auto' }}>
                    {selectedWorksite.extrications.map(ext => (
                      <div key={ext.id} style={{ fontSize:11, color:'#e2e8f0', background:'rgba(0,0,0,0.35)', padding:'4px 8px', borderRadius:4, display:'flex', justifyContent:'space-between', gap:6 }}>
                        <span>
                          <strong style={{ color: ext.triage.startsWith('Kırmızı') ? '#f87171' : ext.triage.startsWith('Sarı') ? '#fbbf24' : ext.triage.startsWith('Yeşil') ? '#4ade80' : '#94a3b8' }}>
                            [{ext.triage}]
                          </strong> {ext.victimInfo} ({ext.locationInRubble})
                        </span>
                        <span style={{ color:'#94a3b8', fontSize:10, whiteSpace:'nowrap' }}>➔ {ext.handedOverTo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tehlikeler ve Riskler */}
              {selectedWorksite.hazards && selectedWorksite.hazards.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>⚠️ SAHA RİSKLERİ & TEHLİKELER</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {selectedWorksite.hazards.map((h, i) => (
                      <span key={i} style={{ background: 'rgba(239,68,68,0.25)', color: '#fecaca', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Görevli Tim & Telsiz */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:10 }}>
                <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>GÖREVLİ TİM</div>
                  <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>
                    🚩 {selectedWorksite.assignedTeamName || 'Henüz tim atanmadı'}
                  </div>
                </div>
                <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>TELSİZ FREKANSI</div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 2, fontFamily: 'monospace' }}>
                    📻 {selectedWorksite.radioChannel || 'CH-1'}
                  </div>
                </div>
              </div>

              {/* Son Vardiya / Durum Değişikliği Özeti & Tarihçe Butonu */}
              {selectedWorksite.history && selectedWorksite.history.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🕒 {selectedWorksite.history[0].timeString}</span>
                      <span style={{ color: '#64748b' }}>•</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{selectedWorksite.history[0].authorName}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedWorksite.history[0].action}
                      {selectedWorksite.history[0].details ? ` (${selectedWorksite.history[0].details})` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWorksiteHistoryModal(true)}
                    style={{
                      background: 'rgba(56,189,248,0.15)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      color: '#38bdf8',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 9px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Saat bazlı tüm vardiya ve durum geçmişini incele"
                  >
                    <span>📜 Tarihçe</span>
                    <span style={{ background: '#0284c7', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 10 }}>
                      {selectedWorksite.history.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Aksiyon butonları */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  onClick={() => setShowExtricationModal(true)}
                  style={{
                    flex: 1, minWidth: '140px', padding: '10px 8px', borderRadius: 8, background: '#dc2626',
                    color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                  }}
                  title="START Triyaj Kodu, Yaş/Cinsiyet ve 112 Teslim Bilgisiyle Kazazede Çıkarma Kaydı Gir"
                >
                  <span>🚑 + Kazazede Triyaj Kartı</span>
                </button>
                <button
                  onClick={() => handleStartEditWorksite(selectedWorksite)}
                  style={{
                    flex: 1, minWidth: '130px', padding: '10px 8px', borderRadius: 8, background: '#d97706',
                    color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  title="Tim değiştir, ASR-4/5 kademe yükselt, vardiya devret veya durum güncelle"
                >
                  <span>✏️ Vardiya / ASR-4-5</span>
                </button>
                <button
                  onClick={() => setFlyTo(selectedWorksite.location)}
                  style={{
                    flex: 1, minWidth: '90px', padding: '10px 8px', borderRadius: 8, background: '#2563eb',
                    color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Ortala
                </button>
                <a
                  href={`https://maps.google.com/?q=${selectedWorksite.location[0]},${selectedWorksite.location[1]}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, minWidth: '105px', padding: '10px 8px', borderRadius: 8, background: '#059669',
                    color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ↗ Yol Tarifi
                </a>
                <button
                  onClick={() => handleDeleteWorksite(selectedWorksite.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)',
                    color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          )}

          {/* ASR-1 Sektör & ASR-2 Otomatik Sektör Değerlendirme Kartı */}
          {!selectedWorksite && selectedSector && (() => {
            const sectorWorksites = worksites.filter(ws => isPointInPolygon(ws.location, selectedSector.polygon));
            const cleanedCount = sectorWorksites.filter(ws => ws.status === 'Temizlendi' || ws.asrLevel === 'ASR-5').length;
            const sectorLive = sectorWorksites.reduce((acc, ws) => acc + (ws.victims?.liveExtracted || 0), 0);
            const sectorDeceased = sectorWorksites.reduce((acc, ws) => acc + (ws.victims?.deceasedExtracted || 0), 0);
            const sectorPersonnel = people.filter(p => p.lat !== undefined && p.lng !== undefined && isPointInPolygon([p.lat, p.lng], selectedSector.polygon));
            const progressPct = sectorWorksites.length > 0 ? Math.round((cleanedCount / sectorWorksites.length) * 100) : (selectedSector.status === 'Tamamlandı' ? 100 : 0);

            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{
                    width:42, height:42, borderRadius:10,
                    background: (selectedSector.color || '#3b82f6') + '22',
                    border: `2px solid ${selectedSector.color || '#3b82f6'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, flexShrink:0
                  }}>
                    {selectedSector.sectorType === 'LKP' ? '🧭' : '📐'}
                  </div>
                  <div style={{ flex: 1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#f1f5f9' }}>
                      {selectedSector.sectorType === 'LKP' ? `WSAR LKP [${selectedSector.code}]` : `ASR-1 & ASR-2 [${selectedSector.code}]`}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
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
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)'
                  }}>
                    👥 Sektörde {sectorPersonnel.length} Personel
                  </span>
                </div>

                {/* ASR-2 Sektör İçi Otomatik Enkaz & Kurtarma Analizi */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
                  <div style={{ background:'#1f2937', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#38bdf8' }}>
                      {formatPolygonArea(selectedSector.polygon).primary}
                    </div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>Sektör Alanı</div>
                  </div>
                  <div style={{ background:'#1f2937', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#fbbf24' }}>
                      {sectorWorksites.length} Enkaz
                    </div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>Temiz: {cleanedCount}/{sectorWorksites.length}</div>
                  </div>
                  <div style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#4ade80' }}>
                      {sectorLive} Canlı
                    </div>
                    <div style={{ fontSize:10, color:'#86efac', marginTop:2 }}>Çıkarılan (L)</div>
                  </div>
                  <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#f87171' }}>
                      {sectorDeceased} Vefat
                    </div>
                    <div style={{ fontSize:10, color:'#fca5a5', marginTop:2 }}>Çıkarılan (D)</div>
                  </div>
                </div>

                {/* ASR-2 Sektör Tarama İlerleme Çubuğu */}
                <div style={{ background:'#111827', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 10px', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700, color:'#cbd5e1', marginBottom:4 }}>
                    <span>ASR-2 Sektör Tarama & Temizlik İlerlemesi</span>
                    <span style={{ color:'#4ade80' }}>%{progressPct}</span>
                  </div>
                  <div style={{ width:'100%', height:6, background:'#1f2937', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ width:`${progressPct}%`, height:'100%', background:'#22c55e', transition:'width 0.3s' }} />
                  </div>
                </div>

                {/* Görevli Tim & Telsiz Bilgisi */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:10 }}>
                  <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>GÖREVLİ TİM</div>
                    <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: 700, marginTop: 2 }}>
                      🚩 {selectedSector.assignedTeamName || 'Henüz tim atanmadı'}
                    </div>
                  </div>
                  <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>TELSİZ FREKANSI</div>
                    <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 2, fontFamily: 'monospace' }}>
                      📻 {selectedSector.radioChannel || 'CH-1'}
                    </div>
                  </div>
                </div>

                {/* Tehlikeler ve KBRN */}
                {selectedSector.hazards && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>⚠️ RİSK & SAHA NOTLARI</div>
                    <div style={{ fontSize: 11, color: '#fecaca', marginTop: 2 }}>{selectedSector.hazards}</div>
                  </div>
                )}

                {/* Aksiyon butonları */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      const center = selectedSector.lkpMeta?.center || getPolygonCenter(selectedSector.polygon);
                      setFlyTo(center);
                    }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, background: '#2563eb',
                      color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Haritada Ortala
                  </button>
                  <button
                    onClick={() => handleStartEditSector(selectedSector)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, background: '#d97706',
                      color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    ✏️ Sektörü Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteSector(selectedSector.id)}
                    style={{
                      padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)',
                      color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Personel Detay Kartı */}
          {!selectedWorksite && !selectedSector && selPer && (
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

      {/* ── ASR-1 Sektör Oluşturma Yan Kartı (Harita Sağ Üstte Açılır) ─── */}
      {showSectorModal && (
        <div className="absolute top-16 right-4 z-[1200] w-[92%] sm:w-[380px] max-h-[82%] overflow-y-auto bg-[#0f172a]/95 border border-amber-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-left transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📐</span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yeni ASR-1 Sektörü Tanımla</h3>
                <p className="text-[10px] text-neutral-400">INSARAG Seviye 1: Geniş Alan Sektörlemesi</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSectorModal(false)}
              className="text-neutral-400 hover:text-white text-lg p-1"
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
                  {formatPolygonArea(drawPoints).fullText} ({drawPoints.length} köşe noktası)
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
      )}

      {/* ── ASR-3 INSARAG Enkaz Triyaj Yan Kartı (Harita Sağ Üstte Açılır) ─── */}
      {showWorksiteModal && (
        <div className={`absolute top-16 right-4 z-[1200] w-[92%] sm:w-[420px] max-h-[85%] overflow-y-auto bg-[#0f172a]/95 border ${editingWorksiteId ? 'border-amber-500/50' : 'border-emerald-500/50'} rounded-2xl p-5 shadow-2xl backdrop-blur-md text-left transition-all`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{editingWorksiteId ? '✏️' : '🏗️'}</span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {editingWorksiteId ? 'ASR-3 Vardiya Devri & Güncelleme' : 'ASR-3 İşaretleme & Triyaj'}
                </h3>
                <p className={`text-[10px] ${editingWorksiteId ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {editingWorksiteId ? 'INSARAG Enkaz Düzenleme & Zaman Damgalı Log' : 'INSARAG Worksite Assessment (İş Sahası Değerlendirmesi)'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowWorksiteModal(false);
                setEditingWorksiteId(null);
              }}
              className="text-neutral-400 hover:text-white text-lg p-1"
            >✕</button>
          </div>

          <form onSubmit={handleSaveWorksite} className="space-y-4">
            {editingWorksiteId && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                  Vardiya Devir / Güncelleme Gerekçesi (Log Notu) *
                </label>
                <input 
                  type="text" 
                  value={worksiteForm.updateNote} 
                  onChange={e => setWorksiteForm({ ...worksiteForm, updateNote: e.target.value })}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-400 outline-none"
                  placeholder="örn: Vardiya devri yapıldı, Tim B görevi devraldı"
                />
                <span className="text-[10px] text-neutral-400 block">Bu gerekçe saat ve komuta yetkilisiyle birlikte enkaz tarihçesine kaydedilir.</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">INSARAG Kademe</label>
                <select
                  value={worksiteForm.asrLevel}
                  onChange={e => setWorksiteForm({ ...worksiteForm, asrLevel: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-emerald-400 font-bold focus:border-emerald-500 outline-none"
                >
                  <option value="ASR-3">ASR-3 (Hızlı SAR)</option>
                  <option value="ASR-4">ASR-4 (Derin SAR)</option>
                  <option value="ASR-5">ASR-5 (Temizlik/Devir)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Enkaz Kodu *</label>
                <input 
                  type="text" 
                  required
                  value={worksiteForm.code} 
                  onChange={e => setWorksiteForm({ ...worksiteForm, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  placeholder="örn: A-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Öncelik</label>
                <select
                  value={worksiteForm.priority}
                  onChange={e => setWorksiteForm({ ...worksiteForm, priority: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Kritik (P1)">🔴 P1 - Kritik</option>
                  <option value="Yüksek (P2)">🟡 P2 - Yüksek</option>
                  <option value="Düşük (P3)">🔵 P3 - Düşük</option>
                </select>
              </div>
            </div>

            {/* ASR-4 Teknik Arama Sonuçları (K9, Akustik, Kamera) */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
              <span className="block text-[11px] font-bold text-sky-400 uppercase tracking-widest">
                🐕 Teknik Arama & Dinleme Durumu (ASR-3 / ASR-4)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold mb-1">🐕 K9 Köpek</label>
                  <select
                    value={worksiteForm.k9Status}
                    onChange={e => setWorksiteForm({ ...worksiteForm, k9Status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-[11px] text-white outline-none"
                  >
                    <option value="Yapılmadı">Yapılmadı</option>
                    <option value="Pozitif (Tepki Var)">🟢 Pozitif (Tepki)</option>
                    <option value="Negatif (Temiz)">⚪ Negatif (Temiz)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold mb-1">🎧 Akustik/Sismik</label>
                  <select
                    value={worksiteForm.acousticStatus}
                    onChange={e => setWorksiteForm({ ...worksiteForm, acousticStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-[11px] text-white outline-none"
                  >
                    <option value="Yapılmadı">Yapılmadı</option>
                    <option value="Ses Alındı">🟢 Ses Alındı</option>
                    <option value="Negatif (Sessiz)">⚪ Negatif (Sessiz)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold mb-1">📷 Yılan Kamera</label>
                  <select
                    value={worksiteForm.cameraStatus}
                    onChange={e => setWorksiteForm({ ...worksiteForm, cameraStatus: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-[11px] text-white outline-none"
                  >
                    <option value="Yapılmadı">Yapılmadı</option>
                    <option value="Temas Var">🟢 Temas Var</option>
                    <option value="Negatif">⚪ Negatif</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Bina / Enkaz Tanımı *</label>
              <input 
                type="text" 
                required
                value={worksiteForm.name} 
                onChange={e => setWorksiteForm({ ...worksiteForm, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                placeholder="örn: Huzur Apartmanı (8 Katlı)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Adres / Konum Tarifi</label>
              <input 
                type="text" 
                value={worksiteForm.address} 
                onChange={e => setWorksiteForm({ ...worksiteForm, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                placeholder="örn: Atatürk Cad. No: 42, Köşe Başı"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Yapı Türü</label>
                <select
                  value={worksiteForm.structureType}
                  onChange={e => setWorksiteForm({ ...worksiteForm, structureType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Betonarme">Betonarme Karkas</option>
                  <option value="Yığma">Yığma Tuğla / Taş</option>
                  <option value="Çelik">Çelik Konstrüksiyon</option>
                  <option value="Ahşap">Ahşap</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Çökme Tipi</label>
                <select
                  value={worksiteForm.collapseType}
                  onChange={e => setWorksiteForm({ ...worksiteForm, collapseType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Sandviç (Pancake)">Sandviç (Pancake)</option>
                  <option value="V-Tipi">V-Tipi Çökme</option>
                  <option value="Yana Yatma">Yana Yatma (Devrilme)</option>
                  <option value="Kısmi Çökme">Kısmi Çökme</option>
                  <option value="Yumuşak Kat">Yumuşak Kat (Zemin Çökmesi)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Operasyon Durumu</label>
                <select
                  value={worksiteForm.status}
                  onChange={e => setWorksiteForm({ ...worksiteForm, status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="Canlı Tespiti Var">🟢 Canlı Tespiti Var</option>
                  <option value="Acil Müdahale">🚨 Acil Müdahale Gerekiyor</option>
                  <option value="Arama Sürüyor">🟡 Arama Sürüyor</option>
                  <option value="Temizlendi">⚪ Temizlendi (Arama Bitti)</option>
                  <option value="Tahliye Edildi">📦 Tahliye Edildi</option>
                  <option value="Yüksek Risk">⛔ Yüksek Risk (Tehlikeli)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Görevlendirilen Tim</label>
                <select
                  value={worksiteForm.assignedTeamName}
                  onChange={e => setWorksiteForm({ ...worksiteForm, assignedTeamName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Tim Seçilmedi --</option>
                  {teamsList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kazazede Bilgileri */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 space-y-2">
              <span className="block text-[11px] font-bold text-neutral-300 uppercase tracking-widest">
                INSARAG Kazazede Sayıları
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-emerald-400 font-bold mb-1">Canlı Çıkarılan (L)</label>
                  <input
                    type="number"
                    min="0"
                    value={worksiteForm.liveExtracted}
                    onChange={e => setWorksiteForm({ ...worksiteForm, liveExtracted: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-bold text-center outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-400 font-bold mb-1">Vefat (D)</label>
                  <input
                    type="number"
                    min="0"
                    value={worksiteForm.deceasedExtracted}
                    onChange={e => setWorksiteForm({ ...worksiteForm, deceasedExtracted: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-rose-400 font-bold text-center outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-amber-400 font-bold mb-1">Şüpheli Canlı</label>
                  <input
                    type="number"
                    min="0"
                    value={worksiteForm.suspectedLive}
                    onChange={e => setWorksiteForm({ ...worksiteForm, suspectedLive: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-amber-400 font-bold text-center outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Tehlikeler Checkbox */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Saha Riskleri & Tehlikeler (G)
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Gaz Kaçağı (Gaz)', 'Yangın Riski', 'Asbest / KBRN', 'İkincil Çökme Riski', 'Elektrik Tehlikesi', 'Sel / Su Baskını'].map(hazard => {
                  const checked = worksiteForm.hazards.includes(hazard);
                  return (
                    <label key={hazard} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          if (e.target.checked) {
                            setWorksiteForm(prev => ({ ...prev, hazards: [...prev.hazards, hazard] }));
                          } else {
                            setWorksiteForm(prev => ({ ...prev, hazards: prev.hazards.filter(h => h !== hazard) }));
                          }
                        }}
                        className="rounded accent-rose-500"
                      />
                      <span className="text-[11px]">{hazard}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Telsiz Frekansı</label>
              <input 
                type="text" 
                value={worksiteForm.radioChannel} 
                onChange={e => setWorksiteForm({ ...worksiteForm, radioChannel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                placeholder="örn: CH-1 / 446.00625"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWorksiteModal(false);
                  setEditingWorksiteId(null);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-neutral-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 ${editingWorksiteId ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'} text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg`}
              >
                {editingWorksiteId ? 'Vardiyayı / Bilgileri Güncelle' : 'Enkazı Kaydet (ASR-3)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── INSARAG ASR-3 Vardiya & Durum Tarihçesi Modal ─────────────── */}
      {showWorksiteHistoryModal && selectedWorksite && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[85vh] bg-[#0b1329] border border-sky-500/30 rounded-2xl p-6 shadow-2xl flex flex-col text-left">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-sky-500/20 rounded-xl border border-sky-500/30">📜</span>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>ASR-3 [{selectedWorksite.code}]</span>
                    <span className="text-xs font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">TUR-M1G</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 font-medium">{selectedWorksite.name} — Vardiya & İşlem Günlüğü</p>
                </div>
              </div>
              <button
                onClick={() => setShowWorksiteHistoryModal(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {(!selectedWorksite.history || selectedWorksite.history.length === 0) ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Henüz kaydedilmiş bir vardiya veya durum geçmişi bulunmuyor.
                </div>
              ) : (
                selectedWorksite.history.map((log, idx) => (
                  <div key={log.id || idx} className="p-3.5 bg-slate-900/90 rounded-xl border border-white/10 space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        🕒 {log.timeString}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        Yetkili: <strong className="text-neutral-200">{log.authorName || 'Komuta Masası'}</strong>
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>📌</span>
                      <span>{log.action}</span>
                    </div>

                    {log.details && (
                      <div className="text-xs text-neutral-300 italic bg-black/40 p-2 rounded-lg border-l-2 border-amber-500/60">
                        "{log.details}"
                      </div>
                    )}

                    {log.victimsSnapshot && (
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-neutral-400">
                        <span className="text-emerald-400">L: {log.victimsSnapshot.liveExtracted} Canlı</span>
                        <span>•</span>
                        <span className="text-rose-400">D: {log.victimsSnapshot.deceasedExtracted} Vefat</span>
                        <span>•</span>
                        <span className="text-amber-400">Şüpheli: {log.victimsSnapshot.suspectedLive}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-neutral-500">
                INSARAG Seviye 3/4/5 Enkaz Değerlendirme & Takip Standardı
              </span>
              <button
                onClick={() => setShowWorksiteHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── START TRİYAJ & KAZAZEDE ÇIKARMA KARTI MODAL ──────────────── */}
      {showExtricationModal && selectedWorksite && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-rose-500/40 rounded-2xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚑</span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Kazazede Çıkarma & START Triyaj Kartı
                  </h3>
                  <p className="text-[10px] text-rose-400">
                    {selectedWorksite.code} — {selectedWorksite.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExtricationModal(false)} className="text-neutral-400 hover:text-white text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleSaveExtrication} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">START Triyaj Kodu *</label>
                <select
                  value={extricationForm.triage}
                  onChange={e => setExtricationForm({ ...extricationForm, triage: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-rose-500"
                >
                  <option value="Kırmızı (Acil)">🔴 KIRMIZI — Acil / Kritik Hayati Tehlike</option>
                  <option value="Sarı (Orta)">🟡 SARI — Geciktirilebilir / Orta Yaralı</option>
                  <option value="Yeşil (Hafif)">🟢 YEŞİL — Hafif Yaralı / Yürüyebilir</option>
                  <option value="Siyah (Vefat/Ex)">⚫ SİYAH — Vefat / Ex</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Kazazede Kimlik / Yaş / Cinsiyet *</label>
                <input
                  type="text"
                  required
                  value={extricationForm.victimInfo}
                  onChange={e => setExtricationForm({ ...extricationForm, victimInfo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                  placeholder="örn: 35 Yaş Kadın (Ayşe Y.) veya 8 Yaş Erkek Çocuk"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Enkaz İçinde Çıkarıldığı Nokta</label>
                <input
                  type="text"
                  value={extricationForm.locationInRubble}
                  onChange={e => setExtricationForm({ ...extricationForm, locationInRubble: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                  placeholder="örn: 2. Kat Kuzey Cephe Yaşam Üçgeni"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Teslim Edilen Sağlık Ekibi / Ambulans Plakası</label>
                <input
                  type="text"
                  value={extricationForm.handedOverTo}
                  onChange={e => setExtricationForm({ ...extricationForm, handedOverTo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                  placeholder="örn: 112 Ambulans (35 ABC 112) / UMKE Tim-2"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtricationModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-neutral-300 font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30"
                >
                  Kaydet & Sayacı Artır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DOĞA ARAMA KURTARMA: LKP (SON GÖRÜLME NOKTASI) & OLASILIK ÇEMBERİ MODAL ── */}
      {showLkpModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-purple-500/40 rounded-2xl p-5 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🧭</span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Doğa Arama (WSAR) LKP Olasılık Çemberi
                  </h3>
                  <p className="text-[10px] text-purple-400">
                    Koester Kayıp Şahıs Davranışı %50 ve %95 Bulunma Halkaları
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLkpModal(false)} className="text-neutral-400 hover:text-white text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleSaveLkp} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Kayıp Şahıs Adı / Tanımı *</label>
                <input
                  type="text"
                  required
                  value={lkpForm.missingPersonName}
                  onChange={e => setLkpForm({ ...lkpForm, missingPersonName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                  placeholder="örn: Mehmet Yılmaz (74 Yaş)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Kayıp Profili</label>
                  <select
                    value={lkpForm.profileName}
                    onChange={e => {
                      const val = e.target.value as any;
                      let r50 = 1500, r95 = 5000;
                      if (val === 'Çocuk (1-6 Yaş)') { r50 = 300; r95 = 1000; }
                      else if (val === 'Demans / Alzheimer Yaşlı') { r50 = 500; r95 = 2000; }
                      else if (val === 'Avcı / Mantar Toplayıcı') { r50 = 1000; r95 = 3500; }
                      setLkpForm({ ...lkpForm, profileName: val, radius50m: r50, radius95m: r95 });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="Doğa Yürüyüşçüsü (Hiker)">Doğa Yürüyüşçüsü</option>
                    <option value="Demans / Alzheimer Yaşlı">Demans / Alzheimer Yaşlı</option>
                    <option value="Çocuk (1-6 Yaş)">Çocuk (1-6 Yaş)</option>
                    <option value="Avcı / Mantar Toplayıcı">Avcı / Mantar Toplayıcı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Son Görülme Saati</label>
                  <input
                    type="text"
                    value={lkpForm.lastSeenTime}
                    onChange={e => setLkpForm({ ...lkpForm, lastSeenTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">🟢 %50 Bulunma Yarıçapı (m)</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={lkpForm.radius50m}
                    onChange={e => setLkpForm({ ...lkpForm, radius50m: parseInt(e.target.value) || 500 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">🟡 %95 Maksimum Menzil (m)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={lkpForm.radius95m}
                    onChange={e => setLkpForm({ ...lkpForm, radius95m: parseInt(e.target.value) || 2000 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Arama Timi</label>
                <select
                  value={lkpForm.assignedTeamName}
                  onChange={e => setLkpForm({ ...lkpForm, assignedTeamName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="">-- Tim Seçilmedi --</option>
                  {teamsList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLkpModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-neutral-300 font-bold rounded-xl text-xs uppercase tracking-wider"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30"
                >
                  LKP Çemberlerini Çiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
