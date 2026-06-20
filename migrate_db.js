const { PrismaClient } = require('@prisma/client');

const oldDbUrl = "postgresql://postgres.kcplrahlpewjxlagvxrr:M1G-Kurtarma-2026%21%2B@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const newDbUrl = "postgresql://postgres.phuevvrqkbxedknbismh:MB.Efkty$dtQQB6@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const oldPrisma = new PrismaClient({ datasources: { db: { url: oldDbUrl } } });
const newPrisma = new PrismaClient({ datasources: { db: { url: newDbUrl } } });

async function migrateTable(tableName, orderBy) {
    try {
        console.log(`Migrating ${tableName}...`);
        const records = await oldPrisma[tableName].findMany({
            orderBy: orderBy ? { [orderBy]: 'asc' } : undefined
        });
        console.log(`Found ${records.length} records in ${tableName}.`);
        if (records.length === 0) return;

        // Clean new DB table first (optional, but good if we rerun)
        await newPrisma[tableName].deleteMany();

        await newPrisma[tableName].createMany({
            data: records,
            skipDuplicates: true
        });
        console.log(`Migrated ${tableName} successfully.`);
    } catch (e) {
        console.error(`Error migrating ${tableName}:`, e.message);
    }
}

async function migrate() {
    try {
        await migrateTable('siteConfig', 'key');
        await migrateTable('member', 'createdAt');
        await migrateTable('inventoryItem', 'createdAt');
        await migrateTable('operation', 'createdAt');
        await migrateTable('team', 'createdAt');
        await migrateTable('teamMember', 'id');
        await migrateTable('deployment', 'id');
        await migrateTable('application', 'createdAt');
        await migrateTable('document', 'createdAt');
        await migrateTable('video', 'createdAt');
        await migrateTable('auditLog', 'createdAt');
        
        console.log("MIGRATION COMPLETE!");
    } catch (e) {
        console.error(e);
    } finally {
        await oldPrisma.$disconnect();
        await newPrisma.$disconnect();
    }
}

migrate();
