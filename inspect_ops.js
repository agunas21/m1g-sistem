const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== OPERATIONS ===");
    const ops = await prisma.operation.findMany({
        include: {
            teams: {
                include: {
                    members: {
                        include: { member: true }
                    }
                }
            },
            vehicles: {
                include: {
                    assignments: {
                        include: { member: true }
                    }
                }
            },
            roleAssignments: {
                include: { member: true }
            }
        }
    });

    console.log(`Found ${ops.length} operations:`);
    for (const op of ops) {
        console.log(`- ID: ${op.id}, Name: "${op.name}", Type: ${op.type}, Status: ${op.status}, StartTime: ${op.startTime}`);
        console.log(`  Teams count: ${op.teams.length}`);
        for (const t of op.teams) {
            console.log(`    Team: ${t.name} (Members: ${t.members.map(m => m.member.fullName).join(', ')})`);
        }
        console.log(`  Vehicles count: ${op.vehicles.length}`);
        for (const v of op.vehicles) {
            console.log(`    Vehicle: ${v.plate} (${v.type}) Status: ${v.status}, Passengers: ${v.assignments.map(a => `${a.member.fullName} (${a.role})`).join(', ')}`);
        }
        console.log(`  Role Assignments count: ${op.roleAssignments.length}`);
        for (const r of op.roleAssignments) {
            console.log(`    Role: ${r.roleTitle} -> ${r.member.fullName}`);
        }
        console.log(`  BaseCamp Members: ${JSON.stringify(op.baseCampMembers)}`);
        console.log(`  BaseCamp Equipment: ${JSON.stringify(op.baseCampEquipment)}`);
        console.log(`  Supplies: ${JSON.stringify(op.supplies)}`);
    }

    console.log("\n=== INVENTORY (Depoda) ===");
    const depodaItems = await prisma.inventoryItem.findMany({
        where: { status: 'Depoda' }
    });
    console.log(`Count of items with status 'Depoda': ${depodaItems.length}`);
    console.log(depodaItems.slice(0, 10).map(i => ({ id: i.id, name: i.name, category: i.category, status: i.status })));

    console.log("\n=== ALL INVENTORY STATUS COUNTS ===");
    const allItems = await prisma.inventoryItem.findMany();
    const statusCounts = {};
    allItems.forEach(i => {
        statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
    });
    console.log(statusCounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
