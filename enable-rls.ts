import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tables = [
        'Member', 'InventoryItem', 'Operation', 'Team', 'TeamMember', 
        'Deployment', 'Application', 'Document', 'AuditLog', 'SiteConfig', 'Video'
    ];

    for (const table of tables) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`Enabled RLS on ${table}`);
    }
    
    console.log("All tables secured.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
