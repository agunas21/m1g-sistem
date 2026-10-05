const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== CREATING OPERATION: akreditasyon sınavı ===");

    // 1. Find source operation (OP-668: akreditasyon tatbikat)
    const sourceOp = await prisma.operation.findFirst({
        where: {
            OR: [
                { name: { contains: 'akreditasyon tatbikat', mode: 'insensitive' } },
                { id: 'OP-668' }
            ]
        },
        include: {
            vehicles: {
                include: {
                    assignments: true
                }
            },
            roleAssignments: true,
            teams: {
                include: {
                    members: true
                }
            }
        }
    });

    if (!sourceOp) {
        throw new Error("Source operation 'akreditasyon tatbikat' not found!");
    }

    console.log(`Source Operation: ${sourceOp.id} - ${sourceOp.name}`);

    // 2. Gather all people (member IDs) from source operation
    const peopleSet = new Set();
    if (Array.isArray(sourceOp.baseCampMembers)) {
        sourceOp.baseCampMembers.forEach(id => peopleSet.add(id));
    }
    sourceOp.vehicles.forEach(v => {
        v.assignments.forEach(a => peopleSet.add(a.memberId));
    });
    sourceOp.roleAssignments.forEach(r => peopleSet.add(r.memberId));
    sourceOp.teams.forEach(t => {
        t.members.forEach(m => peopleSet.add(m.memberId));
    });

    const baseCampMembersList = Array.from(peopleSet);
    console.log(`Collected ${baseCampMembersList.length} unique people from source operation.`);

    // 3. Gather all inventory items currently in warehouse ('Depoda')
    const warehouseItems = await prisma.inventoryItem.findMany({
        where: { status: 'Depoda' },
        select: { id: true }
    });
    const baseCampEquipmentList = warehouseItems.map(i => i.id);
    console.log(`Collected ${baseCampEquipmentList.length} inventory items from warehouse.`);

    // 4. Generate new operation ID
    const newOpId = `OP-${Math.floor(100 + Math.random() * 900)}`;
    const opName = "akreditasyon sınavı";

    // 5. Find admin actor (Ali Berkay Günaslan or SuperAdmin)
    const adminActor = await prisma.member.findFirst({
        where: {
            OR: [
                { id: 'agunas' },
                { fullName: { contains: 'Günaslan', mode: 'insensitive' } },
                { isSuperAdmin: true }
            ]
        }
    });

    const actorId = adminActor ? adminActor.id : 'agunas';
    const actorName = adminActor ? adminActor.fullName : 'Ali Berkay Günaslan';

    console.log(`Executing operation creation on behalf of: ${actorName} (${actorId})`);

    // 6. Create the Operation record in Prisma DB
    const createdOp = await prisma.operation.create({
        data: {
            id: newOpId,
            name: opName,
            type: sourceOp.type || 'Deprem',
            status: 'Hazırlık', // "ama baslatma" -> status is Hazırlık
            location: sourceOp.location || 'denizli bozkurt',
            temperature: sourceOp.temperature || null,
            radioFrequency: sourceOp.radioFrequency || null,
            description: 'Akreditasyon Sınavı Operasyonu - Hazırlık Aşaması',
            baseCampMembers: baseCampMembersList,
            baseCampEquipment: baseCampEquipmentList,
            supplies: sourceOp.supplies || {},
            logs: [
                {
                    id: crypto.randomUUID(),
                    time: new Date().toISOString(),
                    message: `${actorName} adına "${opName}" operasyonu Hazırlık durumunda oluşturuldu. Kaynak operasyondaki kişiler ve depodaki tüm envanter aktarıldı.`,
                    author: actorName
                }
            ]
        }
    });

    console.log(`Created Operation in DB with ID: ${createdOp.id}, Status: ${createdOp.status}`);

    // 7. Copy Vehicles & Vehicle Assignments
    let totalVehiclesCopied = 0;
    let totalAssignmentsCopied = 0;

    for (const sourceVehicle of sourceOp.vehicles) {
        const newVehicle = await prisma.operationVehicle.create({
            data: {
                operationId: createdOp.id,
                plate: sourceVehicle.plate,
                type: sourceVehicle.type,
                status: 'Hazırlanıyor'
            }
        });
        totalVehiclesCopied++;

        for (const assign of sourceVehicle.assignments) {
            await prisma.operationVehicleAssignment.create({
                data: {
                    vehicleId: newVehicle.id,
                    memberId: assign.memberId,
                    role: assign.role
                }
            });
            totalAssignmentsCopied++;
        }
    }

    console.log(`Copied ${totalVehiclesCopied} vehicles and ${totalAssignmentsCopied} vehicle assignments.`);

    // 8. Copy Role Assignments if any
    for (const rAssign of sourceOp.roleAssignments) {
        await prisma.operationRoleAssignment.create({
            data: {
                operationId: createdOp.id,
                memberId: rAssign.memberId,
                roleTitle: rAssign.roleTitle,
                kavkasOfficialRole: rAssign.kavkasOfficialRole,
                kavkasFunctionGroup: rAssign.kavkasFunctionGroup
            }
        });
    }

    // 9. Sync with SiteConfig 'global_operations'
    const globalOpsConfig = await prisma.siteConfig.findUnique({ where: { key: 'global_operations' } });
    let globalOpsList = globalOpsConfig?.value && Array.isArray(globalOpsConfig.value) ? globalOpsConfig.value : [];
    
    // Remove if already exists, then prepend
    globalOpsList = globalOpsList.filter((o) => o.id !== createdOp.id);
    globalOpsList.unshift({
        id: createdOp.id,
        name: createdOp.name,
        type: createdOp.type,
        status: createdOp.status,
        startTime: createdOp.startTime.toISOString(),
        location: createdOp.location,
        baseCampMembers: createdOp.baseCampMembers,
        baseCampEquipment: createdOp.baseCampEquipment
    });

    await prisma.siteConfig.upsert({
        where: { key: 'global_operations' },
        update: { value: globalOpsList },
        create: { key: 'global_operations', value: globalOpsList }
    });
    console.log("Updated SiteConfig 'global_operations'.");

    // 10. Log Audit
    await prisma.auditLog.create({
        data: {
            actorId: actorId,
            actorName: actorName,
            action: 'operation.create',
            detail: `${actorName} adına "${opName}" (${createdOp.id}) operasyonu oluşturuldu (Durum: Hazırlık). ${baseCampMembersList.length} personel, ${totalVehiclesCopied} araç ve ${baseCampEquipmentList.length} depodaki envanter eklendi.`,
            entityType: 'Operation',
            entityId: createdOp.id,
            operationId: createdOp.id,
            severity: 'INFO'
        }
    });
    console.log("Created AuditLog record.");

    console.log("\n=== SUCCESS ===");
    console.log(`Operation "${createdOp.name}" (ID: ${createdOp.id}) created successfully!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
