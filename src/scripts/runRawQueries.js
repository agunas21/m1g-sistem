const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runRawQueries() {
  console.log("=== RAW SQL 1: OP-211 and OP-471 SYSTEM events ===");
  const events = await prisma.operationEvent.findMany({
    where: {
      operationId: { in: ['OP-211', 'OP-471'] }
    },
    select: {
      id: true,
      operationId: true,
      sourceType: true,
      entityType: true,
      confidence: true,
      payload: true,
      lat: true,
      lng: true,
      timestamp: true
    },
    orderBy: { timestamp: 'asc' }
  });
  console.log(JSON.stringify(events, null, 2));

  console.log("\n=== RAW SQL 4: Confidence values ===");
  const confidenceRows = await prisma.operationEvent.findMany({
    where: {
      operationId: { in: ['OP-211', 'OP-471'] }
    },
    select: {
      id: true,
      operationId: true,
      confidence: true
    }
  });
  console.log(JSON.stringify(confidenceRows, null, 2));

  await prisma.$disconnect();
}

runRawQueries().catch(console.error);
