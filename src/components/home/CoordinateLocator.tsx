"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LatLon, Datum } from '@/lib/coordinates/types';
import { parseCoordinates } from '@/lib/coordinates/parsers';
import { latLonToDMS, latLonToUTM, dmsToLatLon } from '@/lib/coordinates/converters';
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
    const [isOpen, setIsOpen] = useState(false);


    
    // Core state
    const [inputStr, setInputStr] = useState("");
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
        if (isOpen && !userLocation && navigator.geolocation) {
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
        
        if (isOpen && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
            return () => window.removeEventListener('deviceorientation', handleOrientation);
        }
    }, [isOpen]);

    // Handle Quick Parse
    const handleParse = () => {
        setWarningMsg(null);
        setErrorMsg(null);
        
        if (!inputStr.trim()) return;

        const result = parseCoordinates(inputStr, selectedDatum);
        
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
    
    const distanceToTarget = (userLocation && currentLatLon) ? calculateDistance(userLocation, currentLatLon) : null;
    const bearingToTarget = (userLocation && currentLatLon) ? calculateBearing(userLocation, currentLatLon) : null;

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all z-50 flex items-center gap-2 font-bold"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Koordinat Bulucu
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col md:flex-row text-white overflow-hidden">
            
            {/* SOL/ÜST PANEL: Girdi ve Bilgi */}
            <div className="w-full md:w-1/3 bg-neutral-900 p-4 md:p-6 flex flex-col h-[50vh] md:h-full overflow-y-auto border-b md:border-b-0 md:border-r border-neutral-800">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-red-500">NOKTA ATIŞI</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Hızlı Giriş */}
                <div className="mb-4">
                    <label className="block text-sm text-neutral-400 mb-2 font-bold">HIZLI GİRİŞ (DMS, DD, UTM)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-lg font-mono outline-none focus:border-red-500"
                            placeholder="Örn: 40.4250, 29.9194"
                            value={inputStr}
                            onChange={(e) => setInputStr(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                        />
                        <button 
                            onClick={handleParse}
                            className="bg-red-600 hover:bg-red-700 px-6 font-bold rounded-lg transition-colors"
                        >
                            BUL
                        </button>
                    </div>
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
                    <div className="flex-1 overflow-y-auto">
                        <h3 className="text-sm text-neutral-400 mb-2 font-bold">ÇEVİRİ SONUÇLARI</h3>
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

                        </div>

                        {/* Aksiyonlar */}
                        <div className="mt-6 flex gap-2">
                            <a 
                                href={`https://maps.google.com/?q=${currentLatLon.lat},${currentLatLon.lon}`} 
                                target="_blank"
                                className="flex-1 bg-white text-black font-bold py-3 rounded-lg text-center hover:bg-gray-200"
                            >
                                Google Maps
                            </a>
                            <a 
                                href={`https://wa.me/?text=Konum:%20${currentLatLon.lat},${currentLatLon.lon}`}
                                target="_blank"
                                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg text-center hover:bg-green-700"
                            >
                                WhatsApp
                            </a>
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
            <div className="w-full md:w-2/3 h-[50vh] md:h-full relative bg-neutral-800 flex items-center justify-center">
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
