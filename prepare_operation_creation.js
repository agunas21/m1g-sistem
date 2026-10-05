const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== FINDING SOURCE OPERATION ===");
    const sourceOp = await prisma.operation.findFirst({
        where: {
            OR: [
                { name: { contains: 'akreditasyon', mode: 'insensitive' } },
                { name: { contains: 'tatbikat', mode: 'insensitive' } }
            ]
        },
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

    if (!sourceOp) {
        console.error("Source operation not found!");
        return;
    }

    console.log(`Source Operation Found: ${sourceOp.id} - ${sourceOp.name}`);
    console.log(`Type: ${sourceOp.type}, Status: ${sourceOp.status}, Location: ${sourceOp.location}`);
    console.log(`Vehicles (${sourceOp.vehicles.length}):`);
    const peopleSet = new Set();

    if (sourceOp.baseCampMembers) {
        sourceOp.baseCampMembers.forEach(m => peopleSet.add(m));
    }

    sourceOp.vehicles.forEach(v => {
        console.log(`  Vehicle ${v.plate} (${v.type}):`);
        v.assignments.forEach(a => {
            console.log(`    - ${a.member.fullName} (${a.role}, Member ID: ${a.memberId})`);
            peopleSet.add(a.memberId);
        });
    });

    console.log(`Role Assignments (${sourceOp.roleAssignments.length}):`);
    sourceOp.roleAssignments.forEach(r => {
        console.log(`  - ${r.roleTitle}: ${r.member.fullName} (${r.memberId})`);
        peopleSet.add(r.memberId);
    });

    console.log(`Teams (${sourceOp.teams.length}):`);
    sourceOp.teams.forEach(t => {
        console.log(`  Team ${t.name}:`);
        t.members.forEach(m => {
            console.log(`    - ${m.member.fullName} (${m.role}, Member ID: ${m.memberId})`);
            peopleSet.add(m.memberId);
        });
    });

    console.log(`Total unique people collected: ${peopleSet.size}`);
    
    // Fetch member details for peopleSet
    const peopleList = await prisma.member.findMany({
        where: { id: { in: Array.from(peopleSet) } },
        select: { id: true, fullName: true, phone: true, email: true }
    });
    console.log("People List:", peopleList.map(p => p.fullName));

    console.log("\n=== WAREHOUSE INVENTORY ===");
    const warehouseItems = await prisma.inventoryItem.findMany({
        where: { status: 'Depoda' }
    });
    console.log(`Found ${warehouseItems.length} items in warehouse ('Depoda').`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
