const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryCandidateOps() {
  console.log("=== RAW SQL QUERY RESULT (HAVING COUNT(*) > 10) ===");
  const resultsStrict = await prisma.$queryRaw`
    SELECT "operationId", 
           COUNT(*)::int as event_sayisi,
           COUNT(*) FILTER (WHERE lat IS NOT NULL)::int as konumlu_event_sayisi
    FROM "OperationEvent"
    GROUP BY "operationId"
    HAVING COUNT(*) > 10
    ORDER BY event_sayisi DESC;
  `;
  console.log(JSON.stringify(resultsStrict, null, 2));

  console.log("\n=== ALL OPERATIONS DISTRIBUTION (No HAVING filter) ===");
  const resultsAll = await prisma.$queryRaw`
    SELECT "operationId", 
           COUNT(*)::int as event_sayisi,
           COUNT(*) FILTER (WHERE lat IS NOT NULL)::int as konumlu_event_sayisi
    FROM "OperationEvent"
    GROUP BY "operationId"
    ORDER BY event_sayisi DESC;
  `;
  console.log(JSON.stringify(resultsAll, null, 2));

  await prisma.$disconnect();
}

queryCandidateOps().catch(console.error);
