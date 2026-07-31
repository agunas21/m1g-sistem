const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDiagnosis() {
  console.log("=== ADIM 1a: OperationEvent sourceType & entityType Dağılımı ===");
  try {
    const q1a = await prisma.$queryRaw`
      SELECT "operationId", "sourceType", "entityType", "confidence",
             COUNT(*)::int as adet,
             MIN(timestamp) as ilk_kayit,
             MAX(timestamp) as son_kayit
      FROM "OperationEvent"
      GROUP BY "operationId", "sourceType", "entityType", "confidence"
      ORDER BY "operationId", adet DESC;
    `;
    console.log(JSON.stringify(q1a, null, 2));
  } catch (e) {
    console.error("1a Hata:", e.message);
  }

  console.log("\n=== ADIM 1b: lat/lng Dolu Ama sourceType RADIO Gören Kayıtlar ===");
  try {
    const q1b = await prisma.$queryRaw`
      SELECT "operationId", COUNT(*)::int as supheli_kayit
      FROM "OperationEvent"
      WHERE "sourceType" = 'RADIO' AND lat IS NOT NULL AND lng IS NOT NULL
      GROUP BY "operationId";
    `;
    console.log(JSON.stringify(q1b, null, 2));
  } catch (e) {
    console.error("1b Hata:", e.message);
  }

  console.log("\n=== ADIM 1c: Eski Operasyonlarda Rol Atamaları ve Event Dağılımı ===");
  try {
    const q1c = await prisma.$queryRaw`
      SELECT o.id as operation_id, o.name,
             COUNT(DISTINCT ora.id)::int as rol_atama_sayisi,
             COUNT(DISTINCT oe.id)::int as event_sayisi,
             COUNT(DISTINCT oe."actorId")::int as farkli_aktor_sayisi
      FROM "Operation" o
      LEFT JOIN "OperationRoleAssignment" ora ON ora."operationId" = o.id
      LEFT JOIN "OperationEvent" oe ON oe."operationId" = o.id
      GROUP BY o.id, o.name, o."createdAt"
      ORDER BY o."createdAt" ASC;
    `;
    console.log(JSON.stringify(q1c, null, 2));
  } catch (e) {
    console.error("1c Hata:", e.message);
  }

  await prisma.$disconnect();
}

runDiagnosis();
