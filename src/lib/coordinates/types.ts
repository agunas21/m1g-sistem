export type CoordinateFormat = "DMS" | "DD" | "UTM" | "MGRS";
export type Datum = "WGS84" | "ED50";

export interface LatLon {
    lat: number;
    lon: number;
    datum: Datum;
}

export interface DMS {
    latDeg: number;
    latMin: number;
    latSec: number;
    latDir: "N" | "S";
    lonDeg: number;
    lonMin: number;
    lonSec: number;
    lonDir: "E" | "W";
}

export interface UTM {
    easting: number;
    northing: number;
    zoneNum: number;
    zoneLetter: string; // e.g. "T"
}

export interface ParseResult {
    format: CoordinateFormat;
    latLon: LatLon;
    originalStr: string;
    warning?: string;
}
