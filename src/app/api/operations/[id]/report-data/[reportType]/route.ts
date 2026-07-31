import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runBackgroundKavkasCheck } from '@/lib/kavkas/backgroundCheck';

type ReportType = "KRONOLOJI" | "ALAN_KAPSAMA" | "PERSONEL_FAALIYET" | "LOJISTIK_ARAC";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; reportType: string }> }
) {
  try {
    const { id: operationId, reportType } = await params;

    const kavkasBackgroundCheck = await runBackgroundKavkasCheck(operationId);

    switch (reportType.toUpperCase() as ReportType) {
      case "KRONOLOJI": {
        const data = await buildChronologyReport(operationId);
        return NextResponse.json({ ...data, kavkasBackgroundCheck });
      }
      case "ALAN_KAPSAMA": {
        const data = await buildCoverageReport(operationId);
        return NextResponse.json({ ...data, kavkasBackgroundCheck });
      }
      case "PERSONEL_FAALIYET": {
        const data = await buildPersonnelReport(operationId);
        return NextResponse.json({ ...data, kavkasBackgroundCheck });
      }
      case "LOJISTIK_ARAC": {
        const data = await buildLogisticsReport(operationId);
        return NextResponse.json({ ...data, kavkasBackgroundCheck });
      }
      default:
        return NextResponse.json({ error: "Geçersiz rapor türü" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[REPORT_DATA_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

// 1.1 Kronoloji Raporu
async function buildChronologyReport(operationId: string) {
  const events = await prisma.operationEvent.findMany({
    where: { operationId },
    orderBy: { timestamp: "asc" },
    include: { actor: { select: { fullName: true } } },
  });

  if (events.length === 0) {
    return { status: "empty", gaps: ["Operasyon için hiç olay kaydı bulunamadı."] };
  }

  return {
    status: "ready",
    timeline: events.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      type: e.type,
      actorName: e.actor?.fullName ?? "Sistem",
      lat: e.lat,
      lng: e.lng,
      isDecision: e.isDecision,
      sourceType: e.sourceType,
      payload: e.payload
    })),
    criticalMoments: events
      .filter((e) => e.isDecision)
      .map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        type: e.type,
        actorName: e.actor?.fullName ?? "Sistem",
      })),
  };
}

// 1.2 Alan Kapsama Raporu
async function buildCoverageReport(operationId: string) {
  const gpsEvents = await prisma.operationEvent.findMany({
    where: {
      operationId,
      type: "LOCATION_UPDATE",
      sourceType: { in: ["GPS", "PHONE"] },
      confidence: { gte: 0.5 },
      lat: { not: null },
      lng: { not: null },
    },
  });

  if (gpsEvents.length < 5) {
    return { 
      status: "insufficient", 
      gaps: ["Alan kapsama hesaplaması için yetersiz GPS verisi (min. 5 nokta gerekli)."],
      pointCount: gpsEvents.length 
    };
  }

  // Operasyon alanı sınırı kontrolü
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    select: { location: true }
  });

  const heatmapGrid = aggregateHeatmapGrid(gpsEvents);

  // Sektör sınırı tanımlı değilse sınır uyarısı ver
  return { 
    status: "no_boundary", 
    gaps: ["Taranan alan yüzdesi için operasyon sektör sınırı tanımlanmamış — sadece yoğunluk haritası gösterilebilir."],
    heatmapGrid,
    totalPoints: gpsEvents.length
  };
}

function aggregateHeatmapGrid(events: any[]) {
  const gridMap = new Map<string, { lat: number; lng: number; intensity: number }>();

  for (const e of events) {
    if (e.lat == null || e.lng == null) continue;
    const gridLat = Number(e.lat.toFixed(4));
    const gridLng = Number(e.lng.toFixed(4));
    const key = `${gridLat},${gridLng}`;

    const existing = gridMap.get(key);
    if (existing) {
      existing.intensity += 1;
    } else {
      gridMap.set(key, { lat: gridLat, lng: gridLng, intensity: 1 });
    }
  }

  return Array.from(gridMap.values());
}

// 1.3 Personel Faaliyet Raporu
async function buildPersonnelReport(operationId: string) {
  const members = await prisma.member.findMany({
    where: { operationRoleAssignments: { some: { operationId } } },
    select: {
      id: true,
      fullName: true,
      events: {
        where: { operationId },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (members.length === 0) {
    return {
      status: "empty",
      gaps: ["Operasyona atanmış kayıtlı personel bulunamadı."]
    };
  }

  const IDLE_THRESHOLD_MINUTES = 30;

  const personnelData = members.map((m) => {
    const events = m.events;
    if (events.length === 0) {
      return { 
        fullName: m.fullName, 
        status: "NO_DATA", 
        note: "Bu personel için olay kaydı yok",
        activeDurationMin: 0,
        idleDurationMin: 0,
        taskCount: 0
      };
    }

    let activeSeconds = 0;
    for (let i = 1; i < events.length; i++) {
      const gapSeconds = (new Date(events[i].timestamp).getTime() - new Date(events[i - 1].timestamp).getTime()) / 1000;
      if (gapSeconds <= IDLE_THRESHOLD_MINUTES * 60) {
        activeSeconds += gapSeconds;
      }
    }

    const totalDurationSeconds = (new Date(events[events.length - 1].timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000;
    const idleSeconds = Math.max(0, totalDurationSeconds - activeSeconds);
    const taskCount = events.filter((e) => e.type === "GOREV_BASLADI" || e.type.includes("TASK")).length;

    return {
      fullName: m.fullName,
      status: "ACTIVE",
      activeDurationMin: Math.round(activeSeconds / 60),
      idleDurationMin: Math.round(idleSeconds / 60),
      taskCount,
      firstEventAt: events[0].timestamp.toISOString(),
      lastEventAt: events[events.length - 1].timestamp.toISOString(),
    };
  });

  return {
    status: "ready",
    personnel: personnelData
  };
}

// 1.4 Lojistik & Araç Raporu
async function buildLogisticsReport(operationId: string) {
  const vehicleEvents = await prisma.operationEvent.findMany({
    where: { 
      operationId, 
      entityType: "VEHICLE", 
      type: "LOCATION_UPDATE", 
      lat: { not: null },
      lng: { not: null }
    },
    orderBy: [{ entityId: "asc" }, { timestamp: "asc" }],
  });

  const vehiclesMap = new Map<string, any[]>();
  for (const e of vehicleEvents) {
    if (!e.entityId) continue;
    const list = vehiclesMap.get(e.entityId) || [];
    list.push(e);
    vehiclesMap.set(e.entityId, list);
  }

  const results = Array.from(vehiclesMap.entries()).map(([vehicleId, events]) => {
    const { totalKm, discardedAnomalies } = calculateVehicleDistance(events);
    return {
      vehicleId,
      totalKm,
      discardedAnomalies,
      pointCount: events.length
    };
  });

  return {
    status: "ready",
    vehicles: results,
    fuelNote: "Yakıt tüketim kaydı sistemde tutulmuyor — bu metrik gösterilemiyor"
  };
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateVehicleDistance(events: any[]) {
  let totalKm = 0;
  let discardedAnomalies = 0;

  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];

    const distKm = calculateHaversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    const timeSec = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;

    if (timeSec <= 0) continue;

    const speedMs = (distKm * 1000) / timeSec;

    if (speedMs > 33) {
      discardedAnomalies++;
      continue;
    }

    totalKm += distKm;
  }

  return { totalKm: Number(totalKm.toFixed(2)), discardedAnomalies };
}
