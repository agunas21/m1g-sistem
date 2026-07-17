import { LatLon, ParseResult, CoordinateFormat } from './types';
import * as mgrs from 'mgrs';
import { utmToLatLon } from './converters';

export function parseCoordinates(input: string, datum: "WGS84" | "ED50" = "WGS84"): ParseResult | null {
    if (!input || input.trim() === "") return null;
    
    // Normalize input
    const normalized = input.trim().toUpperCase().replace(/,/g, '.');

    // 1. Try MGRS (Simple regex for basic MGRS format like 35TPF1234567890)
    // Format: 1-60 + C-X + 2 letters + even number of digits
    const mgrsMatch = normalized.match(/^(\d{1,2})([C-X])\s*([A-Z]{2})\s*(\d{2,10})$/);
    if (mgrsMatch) {
        try {
            const mgrsStr = normalized.replace(/\s+/g, '');
            const point = mgrs.toPoint(mgrsStr);
            if (isValidLatLon(point[1], point[0])) {
                let latLon: LatLon = { lat: point[1], lon: point[0], datum: "WGS84" };
                return {
                    format: "MGRS",
                    latLon: latLon,
                    originalStr: input
                };
            }
        } catch (e) {
            // Ignore and fallback if invalid
        }
    }

    // 2. Try UTM (e.g. 35T 123456 1234567)
    // Format: Zone[Letter] Easting Northing
    const utmMatch = normalized.match(/^(\d{1,2})\s*([C-X]?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
    if (utmMatch) {
        const zoneNum = parseInt(utmMatch[1], 10);
        const zoneLetter = utmMatch[2] || 'T'; // Default to Turkey roughly
        const easting = parseFloat(utmMatch[3]);
        const northing = parseFloat(utmMatch[4]);
        try {
            const latLon = utmToLatLon({ zoneNum, zoneLetter, easting, northing }, datum);
            if (isValidLatLon(latLon.lat, latLon.lon)) {
                return {
                    format: "UTM",
                    latLon,
                    originalStr: input
                };
            }
        } catch (e) {
            // ignore fallback
        }
    }

    // 3. Try DD (Decimal Degrees) e.g. 40.4250, 29.9194
    const ddMatch = normalized.match(/^(-?\d+(?:\.\d+)?)[^\d\.-]+(-?\d+(?:\.\d+)?)$/);
    if (ddMatch) {
        const lat = parseFloat(ddMatch[1]);
        const lon = parseFloat(ddMatch[2]);
        if (isValidLatLon(lat, lon)) {
            return {
                format: "DD",
                latLon: { lat, lon, datum },
                originalStr: input
            };
        }
    }

    // 4. Try DMS (Degrees Minutes Seconds) e.g. 40°25'30"K 29°55'10"D
    // Extractor function for a single coordinate part
    const extractDMS = (str: string): number | null => {
        // Find numbers in the string
        const numbers = str.match(/\d+(?:\.\d+)?/g);
        if (!numbers || numbers.length < 1) return null;
        
        let deg = parseFloat(numbers[0]) || 0;
        let min = numbers.length > 1 ? parseFloat(numbers[1]) : 0;
        let sec = numbers.length > 2 ? parseFloat(numbers[2]) : 0;
        
        let decimal = deg + (min / 60) + (sec / 3600);
        
        // Check direction
        if (str.includes('S') || str.includes('G') || str.includes('W') || str.includes('B')) {
            decimal = -decimal;
        }
        
        return decimal;
    };

    // Split by common separators (space, comma, dash) if there are distinct parts
    // This is a naive split, a robust one would look for N/S/E/W/K/G/D/B
    const parts = normalized.split(/[,\- ]+/);
    if (parts.length >= 2) {
        // Try to guess which is lat and which is lon
        // Usually Lat comes first, but let's check for letters
        let latStr = "";
        let lonStr = "";
        
        for (const p of parts) {
            if (p.includes('N') || p.includes('S') || p.includes('K') || p.includes('G')) latStr += p + " ";
            else if (p.includes('E') || p.includes('W') || p.includes('D') || p.includes('B')) lonStr += p + " ";
        }
        
        if (!latStr) latStr = parts.slice(0, parts.length/2).join(" ");
        if (!lonStr) lonStr = parts.slice(parts.length/2).join(" ");
        
        const lat = extractDMS(latStr);
        const lon = extractDMS(lonStr);
        
        if (lat !== null && lon !== null && isValidLatLon(lat, lon)) {
            return {
                format: "DMS",
                latLon: { lat, lon, datum },
                originalStr: input
            };
        }
    }

    return null;
}

export function isValidLatLon(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function isWithinTurkey(lat: number, lon: number): boolean {
    // Rough bounding box for Turkey
    // Lat: 35.8 to 42.1
    // Lon: 25.6 to 44.8
    return lat >= 35.8 && lat <= 42.1 && lon >= 25.6 && lon <= 44.8;
}
