const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== INSPECTING OP-668 TEAMS IN SITECONFIG ===");
    const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    const op668 = conf?.value?.find(o => o.id === 'OP-668');
    if (!op668) {
        console.log("OP-668 not found in global_operations.");
        return;
    }

    console.log(`OP-668 Name: ${op668.name}`);
    console.log(`Teams (${op668.teams?.length || 0}):`);
    if (op668.teams) {
        console.log(JSON.stringify(op668.teams, null, 2));
    }

    console.log("\n=== INSPECTING OP-668 IN PRISMA TEAM TABLE ===");
    const prismaTeams = await prisma.team.findMany({
        where: { operationId: 'OP-668' },
        include: { members: { include: { member: true } } }
    });
    console.log(`Prisma teams count: ${prismaTeams.length}`);
    for (const pt of prismaTeams) {
        console.log(`Team: ${pt.name}, status: ${pt.status}`);
        console.log(`  Members: ${pt.members.map(m => `${m.member.fullName} (${m.role})`).join(', ')}`);
        console.log(`  Equipment: ${pt.equipment.join(', ')}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
