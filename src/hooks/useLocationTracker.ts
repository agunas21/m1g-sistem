import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface TrackerOptions {
  memberId: string;
  intervalMs?: number;      // Kaç ms'de bir gönderilsin (default: 5000 = 5sn)
  highAccuracy?: boolean;   // Yüksek GPS doğruluğu (batarya etkiler)
}

interface LocationState {
  isTracking: boolean;
  lastSent: Date | null;
  accuracy: number | null;
  error: string | null;
  battery: number | null;
}

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
    battery: null
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

  // Batarya seviyesini al
  const getBattery = useCallback(async (): Promise<number | null> => {
    try {
      // @ts-ignore
      const battery = await navigator.getBattery?.();
      return battery ? Math.round(battery.level * 100) : null;
    } catch {
      return null;
    }
  }, []);

  // Konumu Supabase Realtime üzerinden yayınla + REST Fallback ile veritabanına kaydet
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
      // 1. Supabase Realtime Broadcast
      await supabase.channel('operations-channel').send({
        type: 'broadcast',
        event: 'location_update',
        payload
      });

      // 2. HTTP REST Telemetry Fallback (Audit & Log Persistence)
      fetch('/api/settings/operations/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => { });

      setState(s => ({
        ...s,
        lastSent: new Date(),
        accuracy: coords.accuracy,
        battery,
        error: null
      }));
      
      // Bekleyen konumları gönder
      if (pendingRef.current.length > 0) {
        const pending = [...pendingRef.current];
        pendingRef.current = [];
        for (const p of pending) {
          await supabase.channel('operations-channel').send({
            type: 'broadcast',
            event: 'location_update',
            payload: p
          });
        }
      }
    } catch (error) {
       // Offline: kuyruğa ekle
       pendingRef.current.push(payload);
       setState(s => ({ ...s, error: 'Bağlantı yok, kuyruğa alındı' }));
    }
  }, [memberId, getBattery]);

  // Takibi başlat
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'GPS desteklenmiyor' }));
      return;
    }

    requestWakeLock();
    setState(s => ({ ...s, isTracking: true, error: null }));

    // Anlık konum izle (değişince tetiklenir)
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

    // Belirli aralıklarla gönder (batarya tasarrufu)
    intervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocation(lastLocationRef.current);
      }
    }, intervalMs);
  }, [intervalMs, highAccuracy, sendLocation, requestWakeLock]);

  // Takibi durdur
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

  // Sayfa kapanırken durdur
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

  return { ...state, startTracking, stopTracking };
}

