const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Replicating route logic to test report suite generation on legacy operations
async function testOperation(opId) {
  console.log(`\n==================================================`);
  console.log(`=== TESTING REPORT SUITE FOR OPERATION: ${opId} ===`);
  console.log(`==================================================`);

  const op = await prisma.operation.findUnique({ where: { id: opId } });
  if (!op) {
    console.log(`Operation ${opId} not found!`);
    return;
  }
  console.log(`Name: ${op.name} | Type: ${op.type} | Start: ${op.startTime} | End: ${op.endTime}`);

  // 1. Chronology
  const events = await prisma.operationEvent.findMany({
    where: { operationId: opId },
    orderBy: { timestamp: "asc" },
    include: { actor: { select: { fullName: true } } }
  });
  console.log(`\n[§1 KRONOLOJİ] Event Count: ${events.length}`);
  const chronologyStatus = events.length === 0 ? "empty" : "ready";
  console.log(`Status: ${chronologyStatus}`);

  // 2. Coverage
  const gpsEvents = await prisma.operationEvent.findMany({
    where: {
      operationId: opId,
      lat: { not: null },
      lng: { not: null },
      confidence: { gte: 0.3 }
    }
  });
  console.log(`\n[§2 MEKÂNSAL / COVERAGE] Valid GPS Points Count: ${gpsEvents.length}`);
  let coverageStatus = "ready";
  const coverageGaps = [];
  if (gpsEvents.length < 5) {
    coverageStatus = "insufficient";
    coverageGaps.push(`Alan kapsama hesaplaması için yetersiz GPS/Konum verisi (mevcut: ${gpsEvents.length}, min. 5 nokta gerekli).`);
  }
  console.log(`Status: ${coverageStatus}`);
  console.log(`Gaps: ${JSON.stringify(coverageGaps)}`);

  // 3. Personnel
  const roleAssignedMembers = await prisma.member.findMany({
    where: { operationRoleAssignments: { some: { operationId: opId } } },
    select: { id: true, fullName: true }
  });
  const eventActors = await prisma.operationEvent.findMany({
    where: { operationId: opId, actorId: { not: null } },
    distinct: ["actorId"],
    select: { actorId: true, actor: { select: { id: true, fullName: true } } }
  });
  const mergedMemberIds = new Set([
    ...roleAssignedMembers.map(m => m.id),
    ...eventActors.map(e => e.actorId).filter(Boolean)
  ]);
  console.log(`\n[§3 PERSONEL] Role Assigned: ${roleAssignedMembers.length} | Event Actors: ${eventActors.length} | Merged Total: ${mergedMemberIds.size}`);

  // 4. Logistics
  let vehicleEvents = await prisma.operationEvent.findMany({
    where: { 
      operationId: opId, 
      entityType: "VEHICLE", 
      lat: { not: null },
      lng: { not: null },
      confidence: { gte: 0.3 } 
    }
  });
  if (vehicleEvents.length === 0) {
    vehicleEvents = await prisma.operationEvent.findMany({
      where: {
        operationId: opId,
        lat: { not: null },
        lng: { not: null },
        confidence: { gte: 0.3 },
        OR: [
          { entityId: { not: null } },
          { type: { in: ["LOCATION_UPDATE", "VEHICLE_UPDATE", "TELEMETRY"] } }
        ]
      }
    });
  }
  console.log(`\n[§4 LOJİSTİK / ARAÇ] Vehicle Telemetry Points Count: ${vehicleEvents.length}`);
  const logisticsStatus = vehicleEvents.length === 0 ? "empty" : "ready";
  console.log(`Status: ${logisticsStatus}`);
}

async function run() {
  await testOperation('OP-471');
  await testOperation('OP-211');
  await prisma.$disconnect();
}

run().catch(console.error);
