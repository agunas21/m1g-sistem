// Leaflet Offline Tile Cache Helper using CacheStorage & Service Worker

const TILE_CACHE_NAME = 'm1g-map-tiles-v1';

// Cache a single tile blob by URL
export async function cacheTileUrl(tileUrl: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return false;
    const cache = await caches.open(TILE_CACHE_NAME);
    const existing = await cache.match(tileUrl);
    if (existing) return true;

    const response = await fetch(tileUrl, { mode: 'cors' });
    if (response.ok) {
      await cache.put(tileUrl, response.clone());
      return true;
    }
  } catch (e) {
    // Silent fail if offline
  }
  return false;
}

// Get cached tile response by URL
export async function getCachedTileUrl(tileUrl: string): Promise<Response | null> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) return null;
    const cache = await caches.open(TILE_CACHE_NAME);
    const response = await cache.match(tileUrl);
    if (response) return response;
  } catch (e) {
    console.warn("Tile cache match failed:", e);
  }
  return null;
}

// Pre-cache a region box [minLat, minLng, maxLat, maxLng] for zoom levels minZoom..maxZoom
export async function preCacheTileRegion(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  minZoom: number = 8,
  maxZoom: number = 13,
  onProgress?: (cached: number, total: number) => void
): Promise<{ cached: number; total: number }> {
  let totalTiles = 0;
  let cachedCount = 0;

  const lon2tile = (lon: number, zoom: number) => Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const lat2tile = (lat: number, zoom: number) =>
    Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );

  const tilesToFetch: string[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = lon2tile(minLng, z);
    const xMax = lon2tile(maxLng, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);

    for (let x = Math.min(xMin, xMax); x <= Math.max(xMin, xMax); x++) {
      for (let y = Math.min(yMin, yMax); y <= Math.max(yMin, yMax); y++) {
        // OpenStreetMap tile URL
        const url = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
        tilesToFetch.push(url);
      }
    }
  }

  totalTiles = tilesToFetch.length;

  for (let i = 0; i < tilesToFetch.length; i++) {
    const success = await cacheTileUrl(tilesToFetch[i]);
    if (success) cachedCount++;
    if (onProgress && i % 10 === 0) {
      onProgress(cachedCount, totalTiles);
    }
  }

  if (onProgress) onProgress(cachedCount, totalTiles);
  return { cached: cachedCount, total: totalTiles };
}
