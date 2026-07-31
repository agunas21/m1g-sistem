const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReportSuite() {
  const opId = 'OP-211'; // Operasyon id
  console.log(`=== Testing report-suite fallback logic for legacy operation ${opId} ===`);

  try {
    const events = await prisma.operationEvent.findMany({
      where: { operationId: opId },
      orderBy: { timestamp: "asc" },
      include: { actor: { select: { fullName: true } } }
    });
    console.log(`Found ${events.length} events for ${opId}`);

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

    console.log(`Role assigned members: ${roleAssignedMembers.length}`);
    console.log(`Event actors: ${eventActors.length}`);
    console.log(`Merged member count: ${mergedMemberIds.size}`);

  } catch (e) {
    console.error("Test error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

testReportSuite();
