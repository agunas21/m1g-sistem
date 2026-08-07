// Native Lightweight IndexedDB Database for Offline Location Tracking & Telemetry Sync

export interface OfflineLocationPoint {
  id?: number;
  memberId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  battery: number | null;
  timestamp: number;
  synced: number; // 0 = unsynced, 1 = synced
}

const DB_NAME = 'm1g_offline_db';
const DB_VERSION = 1;
const STORE_LOCATIONS = 'location_telemetry';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LOCATIONS)) {
        const store = db.createObjectStore(STORE_LOCATIONS, { keyPath: 'id', autoIncrement: true });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('memberId', 'memberId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save a location telemetry point to IndexedDB
export async function saveOfflineLocation(point: Omit<OfflineLocationPoint, 'id' | 'synced'>): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOCATIONS, 'readwrite');
      const store = tx.objectStore(STORE_LOCATIONS);
      const data: OfflineLocationPoint = { ...point, synced: 0 };
      const req = store.add(data);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to save location to IndexedDB:', e);
    return -1;
  }
}

// Get all unsynced location telemetry points
export async function getUnsyncedLocations(memberId?: string): Promise<OfflineLocationPoint[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOCATIONS, 'readonly');
      const store = tx.objectStore(STORE_LOCATIONS);
      const index = store.index('synced');
      const req = index.getAll(0); // 0 = unsynced

      req.onsuccess = () => {
        let results = (req.result as OfflineLocationPoint[]) || [];
        if (memberId) {
          results = results.filter(r => r.memberId === memberId);
        }
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('Failed to get unsynced locations from IndexedDB:', e);
    return [];
  }
}

// Mark points as synced or delete them
export async function removeSyncedLocations(ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_LOCATIONS, 'readwrite');
    const store = tx.objectStore(STORE_LOCATIONS);
    for (const id of ids) {
      store.delete(id);
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error('Failed to remove synced locations from IndexedDB:', e);
  }
}

// Count unsynced location points
export async function getUnsyncedLocationsCount(): Promise<number> {
  try {
    const points = await getUnsyncedLocations();
    return points.length;
  } catch {
    return 0;
  }
}
