import { PrismaClient } from '@prisma/client';

const OLD_DATABASE_URL = "postgresql://postgres.yhcnwzkolahaiogjrdit:%26Wwqz%2A7ed3%26jY%264@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";
const NEW_DATABASE_URL = "postgresql://postgres.kcplrahlpewjxlagvxrr:M1G-Kurtarma-2026%21%2B@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";

const oldPrisma = new PrismaClient({
    datasources: { db: { url: OLD_DATABASE_URL } }
});

const newPrisma = new PrismaClient({
    datasources: { db: { url: NEW_DATABASE_URL } }
});

async function migrate() {
    console.log("Migration started...");

    try {
        // 1. SiteConfig
        const siteConfig = await oldPrisma.siteConfig.findMany();
        if (siteConfig.length > 0) {
            await newPrisma.siteConfig.createMany({ data: siteConfig, skipDuplicates: true });
            console.log(`Migrated ${siteConfig.length} SiteConfig records.`);
        }

        // 2. Member
        const members = await oldPrisma.member.findMany();
        if (members.length > 0) {
            await newPrisma.member.createMany({ data: members, skipDuplicates: true });
            console.log(`Migrated ${members.length} Member records.`);
        }

        // 3. Application
        const apps = await oldPrisma.application.findMany();
        if (apps.length > 0) {
            await newPrisma.application.createMany({ data: apps, skipDuplicates: true });
            console.log(`Migrated ${apps.length} Application records.`);
        }

        // 4. InventoryItem
        const inventory = await oldPrisma.inventoryItem.findMany();
        if (inventory.length > 0) {
            await newPrisma.inventoryItem.createMany({ data: inventory, skipDuplicates: true });
            console.log(`Migrated ${inventory.length} InventoryItem records.`);
        }

        // 5. Operation
        const operations = await oldPrisma.operation.findMany();
        if (operations.length > 0) {
            await newPrisma.operation.createMany({ data: operations, skipDuplicates: true });
            console.log(`Migrated ${operations.length} Operation records.`);
        }

        // 6. Team
        const teams = await oldPrisma.team.findMany();
        if (teams.length > 0) {
            await newPrisma.team.createMany({ data: teams, skipDuplicates: true });
            console.log(`Migrated ${teams.length} Team records.`);
        }

        // 7. TeamMember
        const teamMembers = await oldPrisma.teamMember.findMany();
        if (teamMembers.length > 0) {
            await newPrisma.teamMember.createMany({ data: teamMembers, skipDuplicates: true });
            console.log(`Migrated ${teamMembers.length} TeamMember records.`);
        }

        // 8. Deployment
        const deployments = await oldPrisma.deployment.findMany();
        if (deployments.length > 0) {
            await newPrisma.deployment.createMany({ data: deployments, skipDuplicates: true });
            console.log(`Migrated ${deployments.length} Deployment records.`);
        }

        // 9. Document
        const documents = await oldPrisma.document.findMany();
        if (documents.length > 0) {
            await newPrisma.document.createMany({ data: documents, skipDuplicates: true });
            console.log(`Migrated ${documents.length} Document records.`);
        }

        // 10. Video
        const videos = await oldPrisma.video.findMany();
        if (videos.length > 0) {
            await newPrisma.video.createMany({ data: videos, skipDuplicates: true });
            console.log(`Migrated ${videos.length} Video records.`);
        }

        // 11. AuditLog
        const audits = await oldPrisma.auditLog.findMany();
        if (audits.length > 0) {
            await newPrisma.auditLog.createMany({ data: audits, skipDuplicates: true });
            console.log(`Migrated ${audits.length} AuditLog records.`);
        }

        console.log("Migration completed successfully! 🎉");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await oldPrisma.$disconnect();
        await newPrisma.$disconnect();
    }
}

migrate();
