import proj4 from 'proj4';
import { LatLon, Datum, UTM, DMS } from './types';

// Define ED50 for Turkey
// This is a common set of parameters for ED50 in Turkey.
proj4.defs("EPSG:4230", "+proj=longlat +ellps=intl +towgs84=-87,-98,-121,0,0,0,0 +no_defs");
// WGS84 is already built-in as "EPSG:4326"

export function shiftDatum(latLon: LatLon, targetDatum: Datum): LatLon {
    if (latLon.datum === targetDatum) return { ...latLon };

    let source = latLon.datum === "ED50" ? "EPSG:4230" : "EPSG:4326";
    let target = targetDatum === "ED50" ? "EPSG:4230" : "EPSG:4326";

    const [lon, lat] = proj4(source, target, [latLon.lon, latLon.lat]);

    return { lat, lon, datum: targetDatum };
}

export function latLonToUTM(latLon: LatLon): UTM {
    // WGS84 to UTM logic
    const zoneNum = Math.floor((latLon.lon + 180) / 6) + 1;
    const isNorth = latLon.lat >= 0;
    
    // Proj4 string for the specific UTM zone
    const utmProjStr = `+proj=utm +zone=${zoneNum} ${isNorth ? '+north' : '+south'} +datum=WGS84 +units=m +no_defs`;
    
    // Project WGS84 lat/lon to UTM easting/northing
    const [easting, northing] = proj4("EPSG:4326", utmProjStr, [latLon.lon, latLon.lat]);

    // Determine Zone Letter (C to X, omitting I and O)
    let zoneLetter = "N";
    if (latLon.lat >= 72) zoneLetter = 'X';
    else if (latLon.lat >= 64) zoneLetter = 'W';
    else if (latLon.lat >= 56) zoneLetter = 'V';
    else if (latLon.lat >= 48) zoneLetter = 'U';
    else if (latLon.lat >= 40) zoneLetter = 'T'; // Turkey is mostly T and S
    else if (latLon.lat >= 32) zoneLetter = 'S';
    else if (latLon.lat >= 24) zoneLetter = 'R';
    else if (latLon.lat >= 16) zoneLetter = 'Q';
    else if (latLon.lat >= 8) zoneLetter = 'P';
    else if (latLon.lat >= 0) zoneLetter = 'N';
    else if (latLon.lat >= -8) zoneLetter = 'M';
    else if (latLon.lat >= -16) zoneLetter = 'L';
    else if (latLon.lat >= -24) zoneLetter = 'K';
    else if (latLon.lat >= -32) zoneLetter = 'J';
    else if (latLon.lat >= -40) zoneLetter = 'H';
    else if (latLon.lat >= -48) zoneLetter = 'G';
    else if (latLon.lat >= -56) zoneLetter = 'F';
    else if (latLon.lat >= -64) zoneLetter = 'E';
    else if (latLon.lat >= -72) zoneLetter = 'D';
    else if (latLon.lat >= -80) zoneLetter = 'C';

    return {
        easting: Math.round(easting),
        northing: Math.round(northing),
        zoneNum,
        zoneLetter
    };
}

export function utmToLatLon(utm: UTM, datum: Datum = "WGS84"): LatLon {
    const isNorth = utm.zoneLetter.toUpperCase() >= 'N';
    const utmProjStr = `+proj=utm +zone=${utm.zoneNum} ${isNorth ? '+north' : '+south'} +datum=WGS84 +units=m +no_defs`;
    
    const [lon, lat] = proj4(utmProjStr, "EPSG:4326", [utm.easting, utm.northing]);
    
    let result: LatLon = { lat, lon, datum: "WGS84" };
    
    if (datum === "ED50") {
       result = shiftDatum(result, "ED50");
    }
    return result;
}

export function latLonToDMS(latLon: LatLon): DMS {
    const dec2dms = (val: number, isLat: boolean) => {
        const absVal = Math.abs(val);
        const deg = Math.floor(absVal);
        const minFloat = (absVal - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = (minFloat - min) * 60;
        
        let dir = "";
        if (isLat) dir = val >= 0 ? "N" : "S";
        else dir = val >= 0 ? "E" : "W";
        
        return { deg, min, sec, dir };
    };

    const latDMS = dec2dms(latLon.lat, true);
    const lonDMS = dec2dms(latLon.lon, false);

    return {
        latDeg: latDMS.deg,
        latMin: latDMS.min,
        latSec: Number(latDMS.sec.toFixed(2)),
        latDir: latDMS.dir as "N" | "S",
        lonDeg: lonDMS.deg,
        lonMin: lonDMS.min,
        lonSec: Number(lonDMS.sec.toFixed(2)),
        lonDir: lonDMS.dir as "E" | "W"
    };
}

export function dmsToLatLon(dms: DMS, datum: Datum = "WGS84"): LatLon {
    let lat = dms.latDeg + (dms.latMin / 60) + (dms.latSec / 3600);
    if (dms.latDir === "S") lat = -lat;

    let lon = dms.lonDeg + (dms.lonMin / 60) + (dms.lonSec / 3600);
    if (dms.lonDir === "W") lon = -lon;

    return { lat, lon, datum };
}
