import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runBackgroundKavkasCheck, KavkasFlag } from '@/lib/kavkas/backgroundCheck';

const IDLE_THRESHOLD_MINUTES = 30;
const MAX_VEHICLE_SPEED_MPS = 33; // ~120 km/h

export interface ReportEnvelope {
  ozet: {
    operationType: string;
    durationHours: number;
    totalPersonnel: number;
    outcome: string | null;
  };
  chronology: any;
  coverage: any;
  personnel: any;
  logistics: any;
  kararAnalizi: any[];
  sonucVeDersler: string | null;
  kavkasFlags: KavkasFlag[];
  gaps: string[];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: operationId } = await params;

    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: {
        id: true,
        name: true,
        type: true,
        startTime: true,
        endTime: true,
        location: true,
        description: true
      }
    });

    if (!operation) {
      return NextResponse.json({ error: "Operasyon bulunamadı" }, { status: 404 });
    }

    const [chronology, coverage, personnel, logistics, kavkasFlags] = await Promise.all([
      buildChronologyData(operationId),
      buildCoverageData(operationId),
      buildPersonnelData(operationId),
      buildLogisticsData(operationId),
      runBackgroundKavkasCheck(operationId),
    ]);

    const gaps = Array.from(new Set([
      ...(chronology.gaps ?? []),
      ...(coverage.gaps ?? []),
      ...(personnel.gaps ?? []),
      ...(logistics.gaps ?? []),
    ]));

    const durationHours = operation.endTime 
      ? Number(((operation.endTime.getTime() - operation.startTime.getTime()) / (3600 * 1000)).toFixed(1))
      : Number(((Date.now() - operation.startTime.getTime()) / (3600 * 1000)).toFixed(1));

    const response: ReportEnvelope = {
      ozet: {
        operationType: operation.type || "Genel Operasyon",
        durationHours,
        totalPersonnel: personnel.personnel?.length || 0,
        outcome: operation.description || null
      },
      chronology,
      coverage,
      personnel,
      logistics,
      kararAnalizi: chronology.criticalMoments || [],
      sonucVeDersler: null, // Operatörün manuel girdisi — asla otomatik doldurulmaz
      kavkasFlags,
      gaps
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[REPORT_SUITE_GET_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}

// 1.1 Kronoloji (§1) - ADIM 2A Esnek Filtreleme
async function buildChronologyData(operationId: string) {
  const events = await prisma.operationEvent.findMany({
    where: { operationId },
    orderBy: { timestamp: "asc" },
    include: { actor: { select: { fullName: true } } },
  });

  if (events.length === 0) {
    return { 
      status: "empty" as const, 
      timeline: [], 
      criticalMoments: [], 
      gaps: ["Operasyon için hiç olay kaydı bulunamadı."] 
    };
  }

  const hasLegacySource = events.some(e => e.sourceType === "RADIO" || e.sourceType === "SYSTEM");
  const gaps: string[] = [];
  if (hasLegacySource) {
    gaps.push("Bazı olay kayıtları eski formatta olduğundan kaynak tipi (GPS/Telefon/Telsiz) varsayılan değerle işlendi.");
  }

  return {
    status: "ready" as const,
    timeline: events.map((e) => ({
      id: e.id,
      timestamp: e.timestamp.toISOString(),
      type: e.type,
      actorName: e.actor?.fullName ?? "Sistem",
      lat: e.lat,
      lng: e.lng,
      isDecision: e.isDecision,
      sourceType: e.sourceType,
      confidence: e.confidence,
    })),
    criticalMoments: events
      .filter((e) => e.isDecision)
      .map((e) => ({ 
        id: e.id, 
        timestamp: e.timestamp.toISOString(), 
        type: e.type, 
        actorName: e.actor?.fullName ?? "Sistem" 
      })),
    gaps,
  };
}

// 1.2 Mekânsal Analiz / Alan Kapsama (§2) - ADIM 2A Esnek Filtreleme
async function buildCoverageData(operationId: string) {
  // ADIM 2A: sourceType zorunlu filtre olmaktan çıkarıldı, lat/lng varlığı esas alındı
  const gpsEvents = await prisma.operationEvent.findMany({
    where: {
      operationId,
      lat: { not: null },
      lng: { not: null },
      confidence: { gte: 0.3 }, // Eski kayıtlar için toleranslı eşik
    },
  });

  const gaps: string[] = [];

  if (gpsEvents.length < 5) {
    gaps.push("Alan kapsama hesaplaması için yetersiz GPS/Konum verisi (min. 5 nokta gerekli).");
    return { 
      status: "insufficient" as const, 
      heatmapGrid: [],
      gaps 
    };
  }

  const hasLegacySource = gpsEvents.some(e => e.sourceType === "RADIO" || e.sourceType === "SYSTEM");
  if (hasLegacySource) {
    gaps.push("Bazı konum verileri eski kayıt formatından geldiği için kaynak tipi (GPS/Telefon) kesin olarak ayırt edilemiyor.");
  }

  const heatmapGrid = aggregateHeatmapGrid(gpsEvents);

  gaps.push("Operasyon sektör sınırı tanımlanmadığı için taranan alan yüzdesi hesaplanamıyor — sadece yoğunluk haritası gösteriliyor.");

  return {
    status: "no_boundary" as const,
    heatmapGrid,
    gaps,
  };
}

function aggregateHeatmapGrid(events: { lat: number | null; lng: number | null }[]) {
  const grid = new Map<string, { lat: number; lng: number; weight: number }>();
  for (const e of events) {
    if (e.lat == null || e.lng == null) continue;
    const key = `${e.lat.toFixed(4)}_${e.lng.toFixed(4)}`;
    const existing = grid.get(key);
    if (existing) existing.weight += 1;
    else grid.set(key, { lat: Number(e.lat.toFixed(4)), lng: Number(e.lng.toFixed(4)), weight: 1 });
  }
  return Array.from(grid.values());
}

// 1.3 Personel Faaliyet (§3a) - ADIM 2B Çift Yönlü Birlestirme (RoleAssignment + Event Actors Fallback)
async function buildPersonnelData(operationId: string) {
  // 1. Resmi rol ataması yapılmış personeller
  const roleAssignedMembers = await prisma.member.findMany({
    where: { operationRoleAssignments: { some: { operationId } } },
    select: { id: true, fullName: true }
  });

  // 2. Rol ataması olmasa bile event kaydı olan aktörler (Eski operasyonlar için fallback)
  const eventActors = await prisma.operationEvent.findMany({
    where: { operationId, actorId: { not: null } },
    distinct: ["actorId"],
    select: { actorId: true, actor: { select: { id: true, fullName: true } } }
  });

  const mergedMemberIds = new Set<string>([
    ...roleAssignedMembers.map(m => m.id),
    ...eventActors.map(e => e.actorId!).filter(Boolean)
  ]);

  if (mergedMemberIds.size === 0) {
    return { status: "empty" as const, personnel: [], gaps: ["Operasyona atanmış personel veya olay kaydı bulunamadı."] };
  }

  const members = await prisma.member.findMany({
    where: { id: { in: Array.from(mergedMemberIds) } },
    select: {
      id: true,
      fullName: true,
      events: {
        where: { operationId },
        orderBy: { timestamp: "asc" }
      }
    }
  });

  const gaps: string[] = [];
  if (roleAssignedMembers.length < members.length) {
    gaps.push("Bazı personel, resmi rol ataması olmadan sadece olay kaydı üzerinden tespit edildi (eski operasyon verisi).");
  }

  return {
    status: "ready" as const,
    personnel: members.map((m) => {
      if (m.events.length === 0) {
        return { 
          memberId: m.id, 
          fullName: m.fullName, 
          status: "NO_DATA" as const,
          activeDurationMin: 0,
          idleDurationMin: 0,
          taskCount: 0,
          segments: []
        };
      }

      const activeSeconds = calculateActiveTime(m.events);
      const totalSpanSeconds = (m.events[m.events.length - 1].timestamp.getTime() - m.events[0].timestamp.getTime()) / 1000;
      const idleSeconds = Math.max(0, totalSpanSeconds - activeSeconds);

      return {
        memberId: m.id,
        fullName: m.fullName,
        status: "READY" as const,
        activeDurationMin: Math.round(activeSeconds / 60),
        idleDurationMin: Math.round(idleSeconds / 60),
        taskCount: m.events.filter((e) => e.type === "GOREV_BASLADI" || e.type.includes("TASK")).length,
        firstEventAt: m.events[0].timestamp.toISOString(),
        lastEventAt: m.events[m.events.length - 1].timestamp.toISOString(),
        segments: buildActivitySegments(m.events),
      };
    }),
    gaps,
  };
}

function calculateActiveTime(events: { timestamp: Date }[]): number {
  let active = 0;
  for (let i = 1; i < events.length; i++) {
    const gapSec = (events[i].timestamp.getTime() - events[i - 1].timestamp.getTime()) / 1000;
    if (gapSec <= IDLE_THRESHOLD_MINUTES * 60) active += gapSec;
  }
  return active;
}

function buildActivitySegments(events: { timestamp: Date }[]) {
  const segments: { start: string; end: string; status: "active" | "idle" }[] = [];
  for (let i = 1; i < events.length; i++) {
    const gapSec = (events[i].timestamp.getTime() - events[i - 1].timestamp.getTime()) / 1000;
    segments.push({
      start: events[i - 1].timestamp.toISOString(),
      end: events[i].timestamp.toISOString(),
      status: gapSec <= IDLE_THRESHOLD_MINUTES * 60 ? "active" : "idle",
    });
  }
  return segments;
}

// 1.4 Lojistik & Araç (§3b) - ADIM 2A Esnek Araç Telemetri Filtreleme
async function buildLogisticsData(operationId: string) {
  // Önce entityType = "VEHICLE" olan konum kayıtlarını ara
  let vehicleEvents = await prisma.operationEvent.findMany({
    where: { 
      operationId, 
      entityType: "VEHICLE", 
      lat: { not: null },
      lng: { not: null },
      confidence: { gte: 0.3 } 
    },
    orderBy: [{ entityId: "asc" }, { timestamp: "asc" }],
  });

  // Fallback: entityType null ama entityId (araç ID) dolu olan konum güncellemeleri
  if (vehicleEvents.length === 0) {
    vehicleEvents = await prisma.operationEvent.findMany({
      where: {
        operationId,
        entityId: { not: null },
        lat: { not: null },
        lng: { not: null },
        type: { in: ["LOCATION_UPDATE", "VEHICLE_UPDATE", "TELEMETRY"] },
        confidence: { gte: 0.3 }
      },
      orderBy: [{ entityId: "asc" }, { timestamp: "asc" }],
    });
  }

  const gaps: string[] = [];

  if (vehicleEvents.length === 0) {
    return { status: "empty" as const, vehicles: [], gaps: ["Araç telemetri kaydı bulunamadı."] };
  }

  const grouped = new Map<string, typeof vehicleEvents>();
  for (const e of vehicleEvents) {
    if (!e.entityId) continue;
    grouped.set(e.entityId, [...(grouped.get(e.entityId) ?? []), e]);
  }

  const vehicles = Array.from(grouped.entries()).map(([vehicleId, events]) => {
    const { totalKm, discardedAnomalies } = calculateDistanceHaversine(events, MAX_VEHICLE_SPEED_MPS);
    return { vehicleId, totalKm, discardedAnomalies, pointCount: events.length };
  });

  gaps.push("Yakıt tüketimi kaydı sistemde tutulmuyor — bu metrik gösterilmiyor.");

  return { 
    status: "ready" as const, 
    vehicles, 
    fuelDataAvailable: false, 
    gaps 
  };
}

function calculateDistanceHaversine(points: { lat: number | null; lng: number | null; timestamp: Date }[], maxSpeedMps: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  let totalMeters = 0, discardedAnomalies = 0;

  for (let i = 1; i < points.length; i++) {
    const [p1, p2] = [points[i - 1], points[i]];
    if (!p1.lat || !p1.lng || !p2.lat || !p2.lng) continue;
    const dLat = toRad(p2.lat - p1.lat), dLng = toRad(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
    const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const seconds = (p2.timestamp.getTime() - p1.timestamp.getTime()) / 1000;
    if (seconds <= 0) continue;
    if (meters / seconds > maxSpeedMps) { discardedAnomalies++; continue; }
    totalMeters += meters;
  }
  return { totalKm: Math.round((totalMeters / 1000) * 10) / 10, discardedAnomalies };
}
