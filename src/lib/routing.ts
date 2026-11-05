/**
 * M1G Arama Kurtarma - Akıllı Rota & Karayolu Eşleme (Road Snapping) Motoru
 * Hız algılama (Yaya / Araç / Sabit) ve OSRM destekli karayolu ağı düzeltmesi.
 */

// Basit Haversine mesafe hesabı (km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type MovementMode = 'vehicle' | 'walking' | 'still';

export interface MovementInfo {
  mode: MovementMode;
  label: string;
  icon: string;
  speedKmH: number;
}

/**
 * Hıza göre hareket modunu belirler
 * - > 15 km/h: Araç (🚗)
 * - 1 - 15 km/h: Yaya / Koşu (🚶)
 * - < 1 km/h: Sabit / Duruyor (🛑)
 */
export function getMovementMode(speedKmH: number | null | undefined): MovementInfo {
  const speed = speedKmH != null && !isNaN(speedKmH) ? Math.max(0, speedKmH) : 0;
  
  if (speed > 15) {
    return {
      mode: 'vehicle',
      label: `Araç (${Math.round(speed)} km/s)`,
      icon: '🚗',
      speedKmH: speed
    };
  }
  
  if (speed >= 1.5) {
    return {
      mode: 'walking',
      label: `Yaya (${Math.round(speed * 10) / 10} km/s)`,
      icon: '🚶',
      speedKmH: speed
    };
  }

  return {
    mode: 'still',
    label: 'Sabit / Duruyor',
    icon: '🛑',
    speedKmH: 0
  };
}

// OSRM sorgu önbelleği (Tekrar tekrar aynı koordinatları çekmemek için)
const osrmCache = new Map<string, [number, number][]>();

/**
 * İki uzak nokta arasındaki güzergahı OSRM kullanarak gerçek karayoluna oturtur.
 * Personel araçla gittiğinde körfez/deniz/dağ üzerinden uçan kuşbakışı çizgiyi engeller.
 */
export async function getRoadSegment(
  from: [number, number],
  to: [number, number]
): Promise<[number, number][]> {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const distKm = calculateDistanceKm(lat1, lng1, lat2, lng2);
  
  // Mesafe çok kısaysa (300 metreden az) veya koordinatlar geçersizse direkt düz çizgi yeterlidir
  if (distKm < 0.3 || isNaN(distKm)) {
    return [from, to];
  }

  // Önbellek anahtarı (virgülden sonra 3 hane ~100m hassasiyet)
  const cacheKey = `${lat1.toFixed(3)},${lng1.toFixed(3)}_${lat2.toFixed(3)},${lng2.toFixed(3)}`;
  if (osrmCache.has(cacheKey)) {
    return osrmCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [from, to];
    }

    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      // OSRM [lon, lat] döner, Leaflet ise [lat, lon] bekler
      const routeCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      osrmCache.set(cacheKey, routeCoords);
      return routeCoords;
    }
  } catch (err) {
    // Ağ hatası veya zaman aşımında güvenle orijinal iki noktayı döndür
    console.warn('[OSRM Road Snapping] İstek zaman aşımına uğradı veya başarısız oldu:', err);
  }

  return [from, to];
}

/**
 * Bir personelin tüm rota geçmişini karayolu eşlemesiyle yumuşatır.
 * Yaya hareketlerinde ayak izlerini korur, araç geçişlerinde yollara oturtur.
 */
export async function snapFullTrail(
  rawPoints: [number, number][]
): Promise<[number, number][]> {
  if (!rawPoints || rawPoints.length < 2) {
    return rawPoints || [];
  }

  const result: [number, number][] = [];

  for (let i = 0; i < rawPoints.length - 1; i++) {
    const p1 = rawPoints[i];
    const p2 = rawPoints[i + 1];

    const dist = calculateDistanceKm(p1[0], p1[1], p2[0], p2[1]);

    if (dist >= 0.3) {
      // Araç veya uzak mesafe sıçraması -> Karayoluna snap et
      const segment = await getRoadSegment(p1, p2);
      if (result.length > 0) {
        // Çift nokta olmaması için ilkini atla
        result.push(...segment.slice(1));
      } else {
        result.push(...segment);
      }
    } else {
      // Yaya adımları -> Orijinal GPS noktalarını koru
      if (result.length === 0) {
        result.push(p1);
      }
      result.push(p2);
    }
  }

  return result;
}

