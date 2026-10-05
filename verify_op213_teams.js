const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== CHECKING OP-213 TEAMS AND BASECAMP ===");
    const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    const op = conf?.value?.find(o => o.id === 'OP-213');
    if (!op) {
        console.log("OP-213 not found in SiteConfig.");
        return;
    }

    console.log("OP-213 Name:", op.name);
    console.log("Teams count:", op.teams?.length);
    if (op.teams) {
        console.log("Teams list:", op.teams.map(t => ({ name: t.name, membersCount: t.members.length })));
    }
    console.log("baseCamp:", JSON.stringify(op.baseCamp));

    const pTeams = await prisma.team.findMany({ where: { operationId: 'OP-213' } });
    console.log("Prisma teams count:", pTeams.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
