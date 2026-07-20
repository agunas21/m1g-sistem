import { LatLon, ParseResult, CoordinateFormat } from './types';
import * as mgrs from 'mgrs';
import { utmToLatLon } from './converters';

export function parseCoordinates(input: string, datum: "WGS84" | "ED50" = "WGS84"): ParseResult | null {
    if (!input || input.trim() === "") return null;
    
    // Normalize input
    const normalized = input.trim().toUpperCase().replace(/,/g, '.');

    // 1. Try MGRS (Simple regex for basic MGRS format like 35TPF1234567890)
    // Format: 1-60 + C-X + 2 letters + even number of digits
    const mgrsStrRaw = normalized.replace(/\s+/g, '');
    const mgrsMatch = mgrsStrRaw.match(/^(\d{1,2})([C-X])([A-Z]{2})(\d{2,10})$/);
    if (mgrsMatch) {
        try {
            const point = mgrs.toPoint(mgrsStrRaw);
            if (isValidLatLon(point[1], point[0])) {
                let latLon: LatLon = { lat: point[1], lon: point[0], datum: datum };
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

    // 2. Try UTM (e.g. 35T 123456 1234567 or Zon 35S, Doğu (X): 520600, Kuzey (Y): 4255548)
    // Format: Zone[Letter] ... Easting ... Northing
    const utmMatch = normalized.match(/(?:ZON\s*)?(\d{1,2})\s*([C-X]?)[^\d]+(\d{5,6}(?:\.\d+)?)[^\d]+(\d{6,7}(?:\.\d+)?)/);
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

    // 3. Try DD (Decimal Degrees) e.g. 40.4250, 29.9194 or 41.0082° Kuzey, 28.9784° Doğu
    const numbers = normalized.match(/-?\d+(?:\.\d+)?/g);
    if (numbers && numbers.length === 2) {
        let lat = parseFloat(numbers[0]);
        let lon = parseFloat(numbers[1]);

        // Check for directions to apply negative signs
        const latPart = normalized.substring(0, normalized.indexOf(numbers[1]));
        // Clean up noise words
        let cleanLat = latPart.replace(/SAAT|DAK[Iİ]KA|DAK|SAN[Iİ]YE|SAN|DERECE/g, '')
                              .replace(/KUZEY/g, 'N').replace(/GÜNEY|GUNEY/g, 'S')
                              .replace(/DO[GĞ]U/g, 'E').replace(/BATI/g, 'W');
        if (cleanLat.includes('S') || cleanLat.includes('W') || cleanLat.includes('G') || cleanLat.includes('B')) lat = -Math.abs(lat);
        
        const lonPart = normalized.substring(normalized.indexOf(numbers[1]));
        let cleanLon = lonPart.replace(/SAAT|DAK[Iİ]KA|DAK|SAN[Iİ]YE|SAN|DERECE/g, '')
                              .replace(/KUZEY/g, 'N').replace(/GÜNEY|GUNEY/g, 'S')
                              .replace(/DO[GĞ]U/g, 'E').replace(/BATI/g, 'W');
        if (cleanLon.includes('W') || cleanLon.includes('S') || cleanLon.includes('B') || cleanLon.includes('G')) lon = -Math.abs(lon);

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
        
        // Clean up noise words that might contain S, G, W, B
        let cleanStr = str.replace(/SAAT|DAK[Iİ]KA|DAK|SAN[Iİ]YE|SAN|DERECE/g, '');
        // Normalize Turkish direction words
        cleanStr = cleanStr.replace(/KUZEY/g, 'N')
                           .replace(/GÜNEY|GUNEY/g, 'S')
                           .replace(/DO[GĞ]U/g, 'E')
                           .replace(/BATI/g, 'W');
        
        // Check direction
        if (cleanStr.includes('S') || cleanStr.includes('W') || cleanStr.includes('G') || cleanStr.includes('B')) {
            // Be careful with 'G' and 'B' if they are left over from something else, but we replaced DOGU and BATI.
            decimal = -decimal;
        }
        
        return decimal;
    };

    // 5. Try to split the string into Lat and Lon halves
    const dmsNumbers = [...normalized.matchAll(/\d+(?:\.\d+)?/g)];
    if (dmsNumbers.length === 4 || dmsNumbers.length === 6) {
        const midIndex = dmsNumbers[dmsNumbers.length / 2].index;
        if (midIndex !== undefined) {
            const latStr = normalized.substring(0, midIndex);
            const lonStr = normalized.substring(midIndex);

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
