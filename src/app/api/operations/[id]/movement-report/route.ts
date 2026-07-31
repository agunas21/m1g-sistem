import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAX_HUMAN_SPEED_MPS = 8.3; // ~30 km/h
const MAX_VEHICLE_SPEED_MPS = 33; // ~120 km/h
const MIN_POINTS_FOR_DISTANCE = 3;

function calculateDistance(points: any[], entityType: "PERSONNEL" | "VEHICLE") {
    if (points.length < MIN_POINTS_FOR_DISTANCE) {
        return {
            totalKm: "YETERSİZ VERİ" as const,
            discardedAnomalies: 0,
            pointCount: points.length,
            isInsufficient: true
        };
    }

    const maxSpeed = entityType === "VEHICLE" ? MAX_VEHICLE_SPEED_MPS : MAX_HUMAN_SPEED_MPS;
    let totalMeters = 0;
    let discardedAnomalies = 0;

    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const segmentMeters = haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng);
        const seconds = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;

        if (seconds <= 0) continue; // aynı zaman damgası veya ters sıra

        const impliedSpeed = segmentMeters / seconds;

        if (impliedSpeed > maxSpeed) {
            discardedAnomalies++; // GPS sıçraması — mesafeye eklenmez, ama loglanır
            continue;
        }
        totalMeters += segmentMeters;
    }

    return {
        totalKm: Number((totalMeters / 1000).toFixed(2)),
        discardedAnomalies,
        pointCount: points.length,
        isInsufficient: false
    };
}

function aggregateHeatmapGrid(events: any[]) {
    const grid = new Map<string, { lat: number; lng: number; weight: number }>();
    for (const e of events) {
        const lat = Number(e.lat);
        const lng = Number(e.lng);
        if (isNaN(lat) || isNaN(lng)) continue;

        const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        const existing = grid.get(key);
        if (existing) {
            existing.weight += 1;
        } else {
            grid.set(key, { 
                lat: Number(lat.toFixed(4)), 
                lng: Number(lng.toFixed(4)), 
                weight: 1 
            });
        }
    }
    return Array.from(grid.values());
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { searchParams } = new URL(req.url);
        const entityTypeParam = (searchParams.get('entityType') || 'PERSONNEL').toUpperCase() as "PERSONNEL" | "VEHICLE";

        // Query events from DB
        const events = await prisma.operationEvent.findMany({
            where: {
                operationId: resolvedParams.id,
                type: "LOCATION_UPDATE",
                sourceType: { in: ["GPS", "PHONE"] }, // RADIO asla dahil edilmeyecek
                confidence: { gte: 0.5 },             // düşük güvenilirlik dışlanacak
                lat: { not: null },
                lng: { not: null },
                actorId: { not: null },                // actorId null olan eventler hariç
                entityType: entityTypeParam as any,
            },
            orderBy: [{ actorId: "asc" }, { timestamp: "asc" }],
        });

        // Personel bazında Map<actorId, OperationEvent[]> gruplama
        const groupedEvents = new Map<string, any[]>();
        for (const ev of events) {
            if (!ev.actorId) continue;
            if (!groupedEvents.has(ev.actorId)) {
                groupedEvents.set(ev.actorId, []);
            }
            groupedEvents.get(ev.actorId)!.push(ev);
        }

        const memberIds = Array.from(groupedEvents.keys());

        // Fetch Member & Assigned Equipment details for actors
        const membersData = await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: {
                id: true,
                fullName: true,
                assignedItems: {
                    where: { status: "Zimmetli" },
                    select: { name: true, category: true, condition: true },
                },
            },
        });

        const memberMap = new Map(membersData.map(m => [m.id, m]));

        const memberReports = [];
        let grandTotalDistanceKm = 0;
        let grandTotalPoints = 0;
        let grandTotalAnomalies = 0;

        for (const [actorId, actorPoints] of groupedEvents.entries()) {
            const memberInfo = memberMap.get(actorId);
            const distResult = calculateDistance(actorPoints, entityTypeParam);

            if (typeof distResult.totalKm === 'number') {
                grandTotalDistanceKm += distResult.totalKm;
            }
            grandTotalPoints += distResult.pointCount;
            grandTotalAnomalies += distResult.discardedAnomalies;

            const firstSeenAt = actorPoints[0]?.timestamp ? new Date(actorPoints[0].timestamp).toISOString() : null;
            const lastSeenAt = actorPoints[actorPoints.length - 1]?.timestamp ? new Date(actorPoints[actorPoints.length - 1].timestamp).toISOString() : null;

            const assignedEquipment = (memberInfo?.assignedItems || []).map(item => ({
                name: item.name,
                category: item.category,
                condition: item.condition
            }));

            memberReports.push({
                memberId: actorId,
                fullName: memberInfo?.fullName || `Personel (${actorId})`,
                totalDistanceKm: distResult.totalKm,
                isInsufficientData: distResult.isInsufficient,
                gpsPointCount: distResult.pointCount,
                discardedAnomalyPoints: distResult.discardedAnomalies,
                firstSeenAt,
                lastSeenAt,
                assignedEquipment,
                hasAssignedEquipment: assignedEquipment.length > 0
            });
        }

        const heatmapData = aggregateHeatmapGrid(events);

        return NextResponse.json({
            operationId: resolvedParams.id,
            entityType: entityTypeParam,
            totalMembersTracked: memberReports.length,
            grandTotalPoints,
            grandTotalAnomalies,
            grandTotalDistanceKm: Number(grandTotalDistanceKm.toFixed(2)),
            heatmapGrid: heatmapData,
            reports: memberReports
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
