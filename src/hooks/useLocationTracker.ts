import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/api/apiClient';
import { saveOfflineLocation, getUnsyncedLocations, removeSyncedLocations, getUnsyncedLocationsCount, OfflineLocationPoint } from '@/lib/offline/db';

interface TrackerOptions {
  memberId: string;
  intervalMs?: number;      // Kaç ms'de bir gönderilsin (default: 5000 = 5sn)
  highAccuracy?: boolean;   // Yüksek GPS doğruluğu
}

interface LocationState {
  isTracking: boolean;
  lastSent: Date | null;
  accuracy: number | null;
  error: string | null;
  battery: number | null;
  queuedPointsCount: number;
  discardedIOSPointsCount: number;
}

const IOS_MAX_TTL_HOURS = 6;

export function useLocationTracker({
  memberId,
  intervalMs = 5000,
  highAccuracy = true
}: TrackerOptions) {
  const [state, setState] = useState<LocationState>({
    isTracking: false,
    lastSent: null,
    accuracy: null,
    error: null,
    battery: null,
    queuedPointsCount: 0,
    discardedIOSPointsCount: 0
  });
  
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeolocationPosition | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<any[]>([]); // Offline kuyruk
  const wakeLockRef = useRef<any>(null);

  // Ekranın uykuya geçmesini önle (Wake Lock API)
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch { }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch { }
  }, []);

  const getBattery = useCallback(async (): Promise<number | null> => {
    try {
      // @ts-ignore
      const battery = await navigator.getBattery?.();
      return battery ? Math.round(battery.level * 100) : null;
    } catch {
      return null;
    }
  }, []);

  // Android için Background Sync kaydı
  const registerAndroidBackgroundSync = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if ('sync' in reg) {
          // @ts-ignore
          await reg.sync.register('location-sync');
        }
      }
    } catch { }
  }, []);

  // iOS 6 saatlik TTL temizliği ve kuyruk boşaltma (IndexedDB tabanlı)
  const flushLocationQueue = useCallback(async () => {
    try {
      const unsyncedPoints = await getUnsyncedLocations(memberId);
      if (unsyncedPoints.length === 0) return;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const now = Date.now();
      const cutoffMs = now - (IOS_MAX_TTL_HOURS * 3600 * 1000);

      let validPoints: OfflineLocationPoint[] = [];
      let discardedCount = 0;
      const idsToDelete: number[] = [];

      if (isIOS) {
        for (const p of unsyncedPoints) {
          if (p.timestamp && p.timestamp < cutoffMs) {
            discardedCount++;
            if (p.id) idsToDelete.push(p.id);
          } else {
            validPoints.push(p);
          }
        }
      } else {
        validPoints = [...unsyncedPoints];
      }

      if (idsToDelete.length > 0) {
        await removeSyncedLocations(idsToDelete);
      }

      const syncedIds: number[] = [];

      for (const p of validPoints) {
        const payload = {
          memberId: p.memberId,
          lat: p.lat,
          lng: p.lng,
          accuracy: p.accuracy,
          battery: p.battery,
          timestamp: p.timestamp
        };

        try {
          const res = await apiRequest('/api/settings/operations/telemetry', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          if (res.status === 'ok') {
            await supabase.channel('operations-channel').send({
              type: 'broadcast',
              event: 'location_update',
              payload
            });
            if (p.id) syncedIds.push(p.id);
          }
        } catch (err) {
          console.warn("Telemetry flush payload deferred:", err);
          break; // Stop loop if network is still down
        }
      }

      if (syncedIds.length > 0) {
        await removeSyncedLocations(syncedIds);
      }

      const remaining = await getUnsyncedLocationsCount();

      setState(s => ({
        ...s,
        queuedPointsCount: remaining,
        discardedIOSPointsCount: s.discardedIOSPointsCount + discardedCount
      }));
    } catch (e) {
      console.error("Error in flushLocationQueue:", e);
    }
  }, [memberId]);

  // Event Listeners for iOS (online + visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        flushLocationQueue();
      }
    };

    const updateQueueCount = async () => {
      const count = await getUnsyncedLocationsCount();
      setState(s => ({ ...s, queuedPointsCount: count }));
    };

    updateQueueCount();

    window.addEventListener('online', flushLocationQueue);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', flushLocationQueue);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushLocationQueue]);

  // Konumu gönder
  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    const battery = await getBattery();
    const { coords, timestamp } = position;

    const payload = {
      memberId,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      battery,
      timestamp
    };

    try {
      const res = await apiRequest('/api/settings/operations/telemetry', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.status === 'ok') {
        await supabase.channel('operations-channel').send({
          type: 'broadcast',
          event: 'location_update',
          payload
        });

        setState(s => ({
          ...s,
          lastSent: new Date(),
          accuracy: coords.accuracy,
          battery,
          error: null
        }));

        await flushLocationQueue();
      } else {
        await saveOfflineLocation(payload);
        const count = await getUnsyncedLocationsCount();
        setState(s => ({
          ...s,
          queuedPointsCount: count,
          error: 'Bağlantı yok — GPS verisi IndexedDB veritabanına kaydedildi'
        }));
        await registerAndroidBackgroundSync();
      }
    } catch {
       await saveOfflineLocation(payload);
       const count = await getUnsyncedLocationsCount();
       setState(s => ({
         ...s,
         queuedPointsCount: count,
         error: 'GPS verisi çevrimdışı IndexedDB veritabanına kaydedildi'
       }));
    }
  }, [memberId, getBattery, flushLocationQueue, registerAndroidBackgroundSync]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'GPS desteklenmiyor' }));
      return;
    }

    requestWakeLock();
    setState(s => ({ ...s, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        lastLocationRef.current = position;
        setState(s => ({ ...s, accuracy: position.coords.accuracy }));
      },
      (error) => {
        setState(s => ({ ...s, error: `GPS Hatası: ${error.message}` }));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      }
    );

    intervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocation(lastLocationRef.current);
      }
    }, intervalMs);
  }, [intervalMs, highAccuracy, sendLocation, requestWakeLock]);

  const stopTracking = useCallback(() => {
    releaseWakeLock();
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(s => ({ ...s, isTracking: false }));
  }, [releaseWakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [releaseWakeLock]);

  return { ...state, startTracking, stopTracking, flushLocationQueue };
}
