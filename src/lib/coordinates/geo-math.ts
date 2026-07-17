import { LatLon } from './types';

// Earth radius in meters
const R = 6371e3; 

/**
 * Calculates the Haversine distance between two points in meters.
 */
export function calculateDistance(p1: LatLon, p2: LatLon): number {
    const lat1 = p1.lat * Math.PI / 180; // in radians
    const lat2 = p2.lat * Math.PI / 180;
    const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
    const deltaLon = (p2.lon - p1.lon) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
}

/**
 * Calculates the initial bearing (azimuth) from point 1 to point 2 in degrees.
 * Returns value from 0 to 360.
 */
export function calculateBearing(p1: LatLon, p2: LatLon): number {
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const lon1 = p1.lon * Math.PI / 180;
    const lon2 = p2.lon * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    
    const theta = Math.atan2(y, x);
    const bearing = (theta * 180 / Math.PI + 360) % 360; // in degrees
    
    return bearing;
}

/**
 * Formats distance into a human-readable string (m or km)
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Converts bearing in degrees to a cardinal direction string (Turkish).
 */
export function bearingToCardinal(bearing: number): string {
    const directions = ["Kuzey", "Kuzeydoğu", "Doğu", "Güneydoğu", "Güney", "Güneybatı", "Batı", "Kuzeybatı"];
    const index = Math.round(((bearing %= 360) < 0 ? bearing + 360 : bearing) / 45) % 8;
    return directions[index];
}
