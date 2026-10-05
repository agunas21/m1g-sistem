const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== INSPECTING GLOBAL_OPERATIONS IN SITECONFIG ===");
    const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    if (!conf || !Array.isArray(conf.value)) {
        console.log("No global_operations found or not array.");
        return;
    }

    const ops = conf.value;
    console.log(`Total ops in global_operations: ${ops.length}`);
    for (const o of ops) {
        console.log(`ID: ${o.id}, Name: ${o.name}`);
        console.log(`  teams: ${o.teams ? (Array.isArray(o.teams) ? `Array(${o.teams.length})` : typeof o.teams) : 'UNDEFINED'}`);
        console.log(`  baseCamp: ${o.baseCamp ? JSON.stringify(o.baseCamp) : 'UNDEFINED'}`);
        console.log(`  baseCampMembers: ${o.baseCampMembers ? `Array(${o.baseCampMembers.length})` : 'UNDEFINED'}`);
        console.log(`  baseCampEquipment: ${o.baseCampEquipment ? `Array(${o.baseCampEquipment.length})` : 'UNDEFINED'}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
