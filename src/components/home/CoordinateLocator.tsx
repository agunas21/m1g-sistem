"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LatLon, Datum } from '@/lib/coordinates/types';
import { parseCoordinates } from '@/lib/coordinates/parsers';
import { latLonToDMS, latLonToUTM, latLonToMGRS, dmsToLatLon } from '@/lib/coordinates/converters';
import { calculateDistance, calculateBearing, formatDistance, bearingToCardinal } from '@/lib/coordinates/geo-math';

import dynamic from 'next/dynamic';

const CoordinateLocatorMap = dynamic(() => import('./CoordinateLocatorMap'), { ssr: false });


interface MarkerData {
    id: string;
    latLon: LatLon;
    label: string;
    color: 'red' | 'blue';
}

export default function CoordinateLocator() {
    // Core state
    const [inputMode, setInputMode] = useState<'AUTO'|'DD'|'UTM'|'MGRS'>('AUTO');
    const [inputStr, setInputStr] = useState("");
    
    // Specific Inputs
    const [ddLat, setDdLat] = useState("");
    const [ddLon, setDdLon] = useState("");
    
    const [utmZone, setUtmZone] = useState("");
    const [utmEasting, setUtmEasting] = useState("");
    const [utmNorthing, setUtmNorthing] = useState("");
    
    const [mgrsInput, setMgrsInput] = useState("");

    const [selectedDatum, setSelectedDatum] = useState<Datum>("WGS84");
    
    // Derived state
    const [currentLatLon, setCurrentLatLon] = useState<LatLon | null>(null);
    const [warningMsg, setWarningMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Multiple markers
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    
    // User GPS location
    const [userLocation, setUserLocation] = useState<LatLon | null>(null);
    const [userHeading, setUserHeading] = useState<number | null>(null);

    // Initial load - try to get GPS
    useEffect(() => {
        if (!userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        datum: "WGS84"
                    });
                },
                (err) => console.warn("GPS error:", err),
                { enableHighAccuracy: true }
            );
        }
        
        // Try to listen for compass if on mobile
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.webkitCompassHeading) {
                // iOS
                setUserHeading(e.webkitCompassHeading);
            } else if (e.alpha !== null) {
                // Android (needs conversion based on device orientation but roughly alpha)
                // Note: accurate compass on web requires more math and HTTPS, this is basic.
                setUserHeading(360 - e.alpha);
            }
        };
        
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            return () => window.removeEventListener('deviceorientation', handleOrientation);
        }
    }, []);

    // Handle Quick Parse
    const handleParse = () => {
        setWarningMsg(null);
        setErrorMsg(null);
        
        let query = "";
        if (inputMode === 'AUTO') {
            if (!inputStr.trim()) return;
            query = inputStr;
        } else if (inputMode === 'DD') {
            query = `${ddLat}, ${ddLon}`;
        } else if (inputMode === 'UTM') {
            query = `${utmZone} ${utmEasting} ${utmNorthing}`;
        } else if (inputMode === 'MGRS') {
            query = mgrsInput;
        }

        const result = parseCoordinates(query, selectedDatum);
        
        if (!result) {
            setErrorMsg("Format anlaşılamadı. Lütfen kontrol edin.");
            return;
        }

        if (result.warning) {
            setWarningMsg(result.warning);
        }

        // Check bounds
        const isTurkey = result.latLon.lat >= 35.8 && result.latLon.lat <= 42.1 && result.latLon.lon >= 25.6 && result.latLon.lon <= 44.8;
        if (!isTurkey && !result.warning) {
            setWarningMsg("⚠️ Bu koordinat Türkiye sınırları dışında görünüyor.");
        }

        setCurrentLatLon(result.latLon);
        
        // Add to markers if not exists
        const newMarker: MarkerData = {
            id: Date.now().toString(),
            latLon: result.latLon,
            label: `Nokta ${markers.length + 1}`,
            color: 'red'
        };
        setMarkers([...markers, newMarker]);
    };

    const handleMapClick = (latlng: any) => {
        const newLatLon: LatLon = { lat: latlng.lat, lon: latlng.lng, datum: "WGS84" };
        setCurrentLatLon(newLatLon);
        
        const newMarker: MarkerData = {
            id: Date.now().toString(),
            latLon: newLatLon,
            label: `Harita Seçimi`,
            color: 'blue'
        };
        setMarkers([...markers, newMarker]);
        setInputStr(`${newLatLon.lat.toFixed(5)}, ${newLatLon.lon.toFixed(5)}`);
        setSelectedDatum("WGS84");
    };

    // Derived Conversions for display
    const dms = currentLatLon ? latLonToDMS(currentLatLon) : null;
    const utm = currentLatLon ? latLonToUTM(currentLatLon) : null;
    const mgrsStr = currentLatLon ? latLonToMGRS(currentLatLon) : null;
    
    const distanceToTarget = (userLocation && currentLatLon) ? calculateDistance(userLocation, currentLatLon) : null;
    const bearingToTarget = (userLocation && currentLatLon) ? calculateBearing(userLocation, currentLatLon) : null;

    return (
        <div className="w-full mt-20 flex flex-col md:flex-row text-white bg-neutral-950 md:h-[calc(100vh-80px)]">
            
            {/* SOL/ÜST PANEL: Girdi ve Bilgi */}
            <div className="w-full md:w-1/3 bg-neutral-900 p-4 md:p-6 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 shadow-xl z-10 md:overflow-y-auto">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-red-500 tracking-tighter">KOORDİNAT ÇEVİRİCİ</h2>
                </div>

                {/* Giriş Yöntemi Sekmeleri */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { id: 'AUTO', label: 'Akıllı / Hızlı' },
                        { id: 'DD', label: 'DD (Ondalık)' },
                        { id: 'UTM', label: 'UTM (Metrik)' },
                        { id: 'MGRS', label: 'MGRS (Askeri)' }
                    ].map((mode) => (
                        <button 
                            key={mode.id}
                            onClick={() => setInputMode(mode.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${inputMode === mode.id ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* Dinamik Giriş Alanı */}
                <div className="mb-4">
                    {inputMode === 'AUTO' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2 font-bold">HIZLI GİRİŞ (DMS, DD, UTM, MGRS)</label>
                            <input 
                                type="text" 
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500 mb-2"
                                placeholder="Örn: 40.4250, 29.9194"
                                value={inputStr}
                                onChange={(e) => setInputStr(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                            />
                        </div>
                    )}

                    {inputMode === 'DD' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2 font-bold">ENLEM / BOYLAM (Ondalık Derece)</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                                    placeholder="Enlem (Örn: 38.4552)"
                                    value={ddLat}
                                    onChange={(e) => setDdLat(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                />
                                <input 
                                    type="text" 
                                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                                    placeholder="Boylam (Örn: 27.2471)"
                                    value={ddLon}
                                    onChange={(e) => setDdLon(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                />
                            </div>
                        </div>
                    )}

                    {inputMode === 'UTM' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2 font-bold">UTM KOORDİNATI</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    className="w-1/4 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                                    placeholder="Zon"
                                    value={utmZone}
                                    onChange={(e) => setUtmZone(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                />
                                <input 
                                    type="text" 
                                    className="w-2/4 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                                    placeholder="Doğu (Easting)"
                                    value={utmEasting}
                                    onChange={(e) => setUtmEasting(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                />
                                <input 
                                    type="text" 
                                    className="w-2/4 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                                    placeholder="Kuzey (Northing)"
                                    value={utmNorthing}
                                    onChange={(e) => setUtmNorthing(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                                />
                            </div>
                        </div>
                    )}

                    {inputMode === 'MGRS' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-2 font-bold">MGRS KOORDİNATI</label>
                            <input 
                                type="text" 
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500 mb-2"
                                placeholder="Örn: 35S NC 4843 5590"
                                value={mgrsInput}
                                onChange={(e) => setMgrsInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleParse}
                        className="w-full bg-red-600 hover:bg-red-700 py-3 font-bold text-lg rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
                    >
                        HESAPLA & BUL
                    </button>
                </div>

                {/* Datum Seçimi */}
                <div className="mb-6 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="datum" checked={selectedDatum === "WGS84"} onChange={() => setSelectedDatum("WGS84")} className="accent-red-600" />
                        <span className="font-bold">WGS84 (Standart)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="datum" checked={selectedDatum === "ED50"} onChange={() => setSelectedDatum("ED50")} className="accent-red-600" />
                        <span className="font-bold text-neutral-400">ED50 (Eski)</span>
                    </label>
                </div>

                {/* Uyarılar */}
                {errorMsg && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">{errorMsg}</div>}
                {warningMsg && <div className="bg-orange-900/50 border border-orange-500 text-orange-200 p-3 rounded-lg mb-4 text-sm">{warningMsg}</div>}

                {/* Çeviri Sonuçları */}
                {currentLatLon && (
                    <div className="flex-1 pb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <h3 className="text-sm text-neutral-400 font-bold">ÇEVİRİ SONUÇLARI</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <a 
                                    href={`https://maps.google.com/?q=${currentLatLon.lat},${currentLatLon.lon}`} 
                                    target="_blank"
                                    className="flex-1 sm:flex-none bg-white text-black font-bold px-4 py-2 rounded text-sm text-center hover:bg-gray-200"
                                >
                                    Maps
                                </a>
                                <a 
                                    href={`https://wa.me/?text=Konum:%20${currentLatLon.lat},${currentLatLon.lon}`}
                                    target="_blank"
                                    className="flex-1 sm:flex-none bg-green-600 text-white font-bold px-4 py-2 rounded text-sm text-center hover:bg-green-700"
                                >
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                        <div className="space-y-3">
                            
                            {/* DD */}
                            <div className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center group">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">Decimal Degrees (DD)</div>
                                    <div className="font-mono text-lg">{currentLatLon.lat.toFixed(5)}, {currentLatLon.lon.toFixed(5)}</div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-neutral-700 rounded" onClick={() => navigator.clipboard.writeText(`${currentLatLon.lat.toFixed(5)}, ${currentLatLon.lon.toFixed(5)}`)}>
                                    Kopyala
                                </button>
                            </div>

                            {/* DMS */}
                            {dms && (
                            <div className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center group">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">Derece Dakika Saniye (DMS)</div>
                                    <div className="font-mono text-lg">
                                        {dms.latDeg}° {dms.latMin}' {dms.latSec}" {dms.latDir} <br/>
                                        {dms.lonDeg}° {dms.lonMin}' {dms.lonSec}" {dms.lonDir}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* UTM */}
                            {utm && (
                            <div className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center group">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">UTM</div>
                                    <div className="font-mono text-lg">
                                        {utm.zoneNum}{utm.zoneLetter} {utm.easting} {utm.northing}
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* MGRS */}
                            {mgrsStr && (
                            <div className="bg-neutral-800 p-3 rounded-lg flex justify-between items-center group">
                                <div>
                                    <div className="text-xs text-neutral-500 mb-1">MGRS</div>
                                    <div className="font-mono text-lg text-yellow-400">
                                        {mgrsStr.replace(/(.{3})(.{2})(.{5})(.{5})/, "$1 $2 $3 $4")}
                                    </div>
                                </div>
                            </div>
                            )}

                        </div>
                        
                        {distanceToTarget !== null && bearingToTarget !== null && (
                            <div className="mt-4 p-4 border border-blue-900 bg-blue-900/20 rounded-lg">
                                <div className="text-sm text-blue-300">Bulunduğunuz Konumdan Hedefe:</div>
                                <div className="text-xl font-bold text-blue-400">
                                    {formatDistance(distanceToTarget)} <span className="text-sm font-normal">uzakta</span>
                                </div>
                                <div className="text-md text-blue-300">
                                    {bearingToCardinal(bearingToTarget)} yönünde ({Math.round(bearingToTarget)}°)
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SAĞ/ALT PANEL: Harita */}
            <div className="w-full md:w-2/3 min-h-[60vh] md:min-h-0 md:h-full relative bg-neutral-800 flex-1 flex items-center justify-center">
                <CoordinateLocatorMap 
                    currentLatLon={currentLatLon}
                    markers={markers}
                    userLocation={userLocation}
                    handleMapClick={handleMapClick}
                />
                
                {/* Nişangah / Center Marker Overlay */}
                <div className="absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 pointer-events-none z-[400] opacity-50">
                    <div className="w-full h-px bg-black absolute top-1/2 left-0"></div>
                    <div className="h-full w-px bg-black absolute top-0 left-1/2"></div>
                </div>
            </div>

        </div>
    );
}
