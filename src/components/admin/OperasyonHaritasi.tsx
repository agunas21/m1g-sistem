'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

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


// ── Özel marker ikonu (Leaflet DivIcon) ────────────────────────────────────
function makeIcon(color: string, initials: string, isSelected: boolean) {
  if (typeof window === 'undefined') return undefined
  const L = require('leaflet')

  const size  = isSelected ? 44 : 36
  const ring  = isSelected ? `box-shadow:0 0 0 3px #fff, 0 0 0 5px ${color};` : ''

  return L.divIcon({
    className: '',
    iconSize:   [size, size + 20],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:2.5px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-size:${isSelected ? 13 : 11}px;font-weight:600;color:#fff;
        cursor:pointer;${ring}transition:all .15s;
      ">${initials}</div>
      <div style="
        position:absolute;top:${size + 4}px;left:50%;transform:translateX(-50%);
        white-space:nowrap;background:rgba(15,20,35,.88);
        border:0.5px solid rgba(255,255,255,.15);border-radius:4px;
        padding:2px 6px;font-size:10px;color:#e2e8f0;pointer-events:none;
      ">${initials}</div>
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

        const resMem = await fetch('/api/members');
        const membersArr = await resMem.json();
        const memberMap = new Map(membersArr.map((m: any) => [m.id, m]));

        const map: Record<string, PersonnelLocation> = {};
        const newTrails: Record<string, [number, number][]> = {};

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        let colorIdx = 0;

        op.teams.forEach((t: any) => {
          const teamColor = colors[colorIdx % colors.length];
          colorIdx++;
          t.members.forEach((m: any) => {
              const memInfo = memberMap.get(m.id);
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
                  speed: 0,
                  is_online: m.lastLocation ? (Date.now() - m.lastLocation.timestamp < 10 * 60 * 1000) : false,
                  recorded_at: m.lastLocation ? new Date(m.lastLocation.timestamp).toISOString() : undefined
              };
              if (m.lastLocation) {
                  if (m.path && m.path.length > 0) {
                      newTrails[m.id] = m.path.map((p:any) => [p.lat, p.lng]);
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
        const { memberId, lat, lng, battery, accuracy, timestamp } = payload.payload;

        setLocations((prev: any) => {
            const p = prev[memberId];
            if (!p) return prev; 
            
            let speed = 0;
            if (p.lat && p.lng && p.recorded_at) {
                const dist = getDistanceFromLatLonInKm(p.lat, p.lng, lat, lng);
                const timeDiff = (timestamp - new Date(p.recorded_at).getTime()) / (1000 * 60 * 60);
                if (timeDiff > 0) speed = dist / timeDiff;
            }

            return {
                ...prev,
                [memberId]: {
                    ...p,
                    lat, lng, battery: battery || p.battery || 100,
                    accuracy: accuracy || p.accuracy || 15,
                    speed,
                    is_online: true,
                    recorded_at: new Date(timestamp).toISOString()
                }
            };
        });

        setTrails((prev: any) => {
            const existing = prev[memberId] ?? [];
            const updated = [...existing, [lat, lng] as [number, number]];
            return { ...prev, [memberId]: updated.slice(-MAX_TRAIL) };
        });
    }).subscribe();

    return () => { if(channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id)
    const loc = locations[id]
    if (loc && loc.lat !== undefined && loc.lng !== undefined) setFlyTo([loc.lat, loc.lng])
  }, [locations])

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
    window.open(
      `https://maps.google.com/?q=${loc.lat},${loc.lng}&navigate=yes`,
      '_blank'
    )
  }, [])

  // ── Koordinat kopyala ────────────────────────────────────────────────────
  const copyCoords = useCallback((loc: PersonnelLocation) => {
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
        absolute z-[500]
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
          <span style={{ width:'1px', height:18, background:'#374151' }} className="mx-2 hidden sm:inline" />
          <span style={S.tbStat} className="hidden sm:inline">Aktif: <span style={S.tbVal}>{onlineN}</span></span>
          <span style={S.tbStat} className="ml-auto">Toplam: <span style={S.tbVal}>{people.length}</span></span>
        </div>

        {/* Leaflet harita */}
        <div style={S.mapCont}>
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height:'100%', width:'100%', background:'#111827' }}
            zoomControl={true}
            whenReady={() => setMapReady(true)}
          >
            {/* Darker OpenStreetMap tiles for night mode map look */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={19}
            />

            {mapReady && <MapController flyTo={flyTo} />}
            <MapEventHandler onClick={onMapClick} />

            {pins.map((pin) => (
              <Marker key={pin.id} position={pin.location} icon={getPinIcon(pin.type)}>
                <Popup>
                  <div style={{color: 'black', textAlign: 'center'}}>
                    <strong style={{display: 'block', fontSize: '14px'}}>{pin.name}</strong>
                    <span style={{fontSize: '12px', color: '#666', fontWeight: 'bold'}}>{pin.type}</span>
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
              const icon = makeIcon(p.team_color, getInitials(p.member_name), isSelected)
              if (!icon) return null

              return (
                <div key={p.member_id}>
                  <Circle
                    center={[p.lat, p.lng]}
                    radius={p.accuracy}
                    pathOptions={{ color: p.team_color, fillColor: p.team_color, fillOpacity:0.06, weight:1, opacity:0.3 }}
                  />

                  {trails[p.member_id]?.length > 1 && (
                    <Polyline
                      positions={trails[p.member_id]}
                      pathOptions={{ color:p.team_color, weight:2, opacity:0.4, dashArray:'5 5' }}
                    />
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

          {/* İpucu Overlay */}
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', zIndex:400, background:'rgba(0,0,0,0.8)', padding:'6px 16px', borderRadius:20, pointerEvents:'none', border:'1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', letterSpacing:1 }}>PİN İÇİN HARİTAYA TIKLA</span>
          </div>

          {/* Konumum Butonu */}
          <button 
              onClick={startTracking}
              style={{ position:'absolute', bottom:24, right:24, zIndex:400, background:'#2563eb', border:'none', color:'#fff', padding:12, borderRadius:'50%', cursor:'pointer', boxShadow:'0 0 15px rgba(37,99,235,0.5)' }}
              title="Konumumu Bul"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
          </button>
        </div>

        {/* ── Detay paneli (pin/liste tıklanınca açılır) ──── */}
        <div style={S.dpPanel(!!selPer)}>
          {selPer && (
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
                    {/* İstatistik kartları */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }} className="overflow-x-auto pb-2 md:pb-0">
                      {[
                        { label:'Batarya', value:`${Math.round(selPer.battery ?? 100)}%`, color: (selPer.battery ?? 100) < 20 ? '#f87171' : '#4ade80' },
                        { label:'GPS ±m',  value:`±${Math.round(selPer.accuracy ?? 15)}m`, color:'#93c5fd' },
                        { label:'Hız',     value:`${selPer.speed !== null ? Math.round(selPer.speed) : '—'} km/h`, color:'#e2e8f0' },
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
    </div>
  )
}
