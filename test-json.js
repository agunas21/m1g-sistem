const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const op = await prisma.operation.findFirst();
  if (!op) return;
  try {
    const report = await prisma.operationReport.create({
      data: {
        operationId: op.id,
        type: "OPERASYONLAR",
        content: { timeline: [{ time: new Date() }] },
        version: 1
      }
    });
    console.log("SUCCESS:", report.id);
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
