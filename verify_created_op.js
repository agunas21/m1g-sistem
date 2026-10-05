const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== VERIFYING CREATED OPERATION ===");
    const op = await prisma.operation.findFirst({
        where: { name: 'akreditasyon sınavı' },
        include: {
            vehicles: {
                include: {
                    assignments: {
                        include: { member: true }
                    }
                }
            }
        }
    });

    if (!op) {
        console.log("Operation 'akreditasyon sınavı' not found yet.");
        return;
    }

    console.log(`Operation Found: ID ${op.id}`);
    console.log(`Name: ${op.name}`);
    console.log(`Status: ${op.status} (Hazırlık)`);
    console.log(`Type: ${op.type}`);
    console.log(`Base Camp Members count: ${op.baseCampMembers.length}`);
    console.log(`Base Camp Equipment count: ${op.baseCampEquipment.length}`);
    console.log(`Vehicles count: ${op.vehicles.length}`);
    let totalAssignments = 0;
    op.vehicles.forEach(v => {
        totalAssignments += v.assignments.length;
    });
    console.log(`Total Vehicle Passenger Assignments: ${totalAssignments}`);

    const globalOps = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    const inGlobal = globalOps?.value?.find((g) => g.id === op.id);
    console.log(`Synced in SiteConfig global_operations: ${inGlobal ? 'YES' : 'NO'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
