const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== FIXING OP-213 & ADDING TEAMS FROM OP-668 ===");

    // 1. Get SiteConfig global_operations
    const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    if (!conf || !Array.isArray(conf.value)) {
        throw new Error("global_operations in SiteConfig not found!");
    }

    const opsList = conf.value;
    const op668 = opsList.find(o => o.id === 'OP-668');
    if (!op668) {
        throw new Error("OP-668 not found in global_operations");
    }

    console.log(`Source OP-668 found with ${op668.teams?.length || 0} teams.`);

    // 2. Clone teams from OP-668 for OP-213
    const sourceTeams = op668.teams || [];
    const newTeams = [];

    // Delete any existing Prisma teams for OP-213 first
    await prisma.team.deleteMany({ where: { operationId: 'OP-213' } });

    for (let i = 0; i < sourceTeams.length; i++) {
        const sTeam = sourceTeams[i];
        const newTeamId = `TEAM-213-${i + 1}`;
        
        // Prepare members array for SiteConfig JSON
        const teamMembersJson = (sTeam.members || []).map(m => ({
            id: m.id || m.memberId,
            role: m.role || 'Üye'
        }));

        const newTeamObj = {
            id: newTeamId,
            name: sTeam.name,
            status: 'Kampta', // Hazırlık aşamasında kampta
            members: teamMembersJson,
            equipment: sTeam.equipment || [],
            deployments: []
        };
        newTeams.push(newTeamObj);

        // Also create in Prisma Team table
        const prismaTeam = await prisma.team.create({
            data: {
                id: newTeamId,
                name: sTeam.name,
                status: 'Hazırda',
                operationId: 'OP-213',
                equipment: sTeam.equipment || []
            }
        });

        // Add TeamMembers in Prisma
        for (const m of teamMembersJson) {
            const memberExists = await prisma.member.findUnique({ where: { id: m.id } });
            if (memberExists) {
                await prisma.teamMember.create({
                    data: {
                        teamId: prismaTeam.id,
                        memberId: m.id,
                        role: m.role || 'Üye'
                    }
                });
            }
        }
    }

    console.log(`Created ${newTeams.length} teams in Prisma and JSON for OP-213.`);

    // 3. Update OP-213 in global_operations SiteConfig
    const op213Idx = opsList.findIndex(o => o.id === 'OP-213');
    if (op213Idx === -1) {
        throw new Error("OP-213 not found in global_operations!");
    }

    const op213 = opsList[op213Idx];

    // Collect baseCamp members & equipment
    const allMembersInTeams = new Set();
    newTeams.forEach(t => t.members.forEach(m => allMembersInTeams.add(m.id)));

    // Get all 27 members collected previously or from OP-668
    const baseCampMembersList = op213.baseCampMembers || [];
    const baseCampEquipmentList = op213.baseCampEquipment || [];

    opsList[op213Idx] = {
        ...op213,
        teams: newTeams,
        baseCamp: {
            members: baseCampMembersList,
            equipment: baseCampEquipmentList
        },
        baseCampMembers: baseCampMembersList,
        baseCampEquipment: baseCampEquipmentList,
        supplies: op213.supplies || {
            ppeCount: 27,
            mealsCount: 54,
            firstAidKits: 9
        }
    };

    await prisma.siteConfig.update({
        where: { key: 'global_operations' },
        data: { value: opsList }
    });

    console.log("Updated OP-213 in SiteConfig global_operations successfully!");

    // 4. Update Prisma Operation record
    await prisma.operation.update({
        where: { id: 'OP-213' },
        data: {
            baseCampMembers: baseCampMembersList,
            baseCampEquipment: baseCampEquipmentList
        }
    });

    console.log("Prisma Operation OP-213 updated.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
