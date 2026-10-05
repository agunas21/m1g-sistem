const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectLegacy() {
  console.log("=== 1. OP-211 & OP-471 SYSTEM Event Payload & Details ===");
  const systemEvents = await prisma.operationEvent.findMany({
    where: {
      operationId: { in: ['OP-211', 'OP-471'] }
    },
    select: {
      id: true,
      operationId: true,
      type: true,
      sourceType: true,
      entityType: true,
      confidence: true,
      lat: true,
      lng: true,
      timestamp: true,
      payload: true,
      actorId: true,
      actor: { select: { fullName: true } }
    },
    orderBy: [{ operationId: 'asc' }, { timestamp: 'asc' }]
  });

  console.log(`Total events found for OP-211 & OP-471: ${systemEvents.length}\n`);

  systemEvents.forEach((ev, idx) => {
    console.log(`[Event ${idx + 1}] ID: ${ev.id} | OP: ${ev.operationId}`);
    console.log(`  Type: ${ev.type} | SourceType: ${ev.sourceType} | EntityType: ${ev.entityType} | Confidence: ${ev.confidence}`);
    console.log(`  Actor: ${ev.actor ? ev.actor.fullName : 'null'} (${ev.actorId})`);
    console.log(`  Coordinates: Lat=${ev.lat}, Lng=${ev.lng}`);
    console.log(`  Timestamp: ${ev.timestamp}`);
    console.log(`  Payload: ${JSON.stringify(ev.payload, null, 2)}`);
    console.log('-'.repeat(60));
  });

  console.log("\n=== 4. Exact confidence values for OP-211 & OP-471 ===");
  const confidenceList = await prisma.operationEvent.findMany({
    where: { operationId: { in: ['OP-211', 'OP-471'] } },
    select: { id: true, operationId: true, confidence: true, sourceType: true, type: true }
  });
  console.table(confidenceList);

  await prisma.$disconnect();
}

inspectLegacy().catch(console.error);
