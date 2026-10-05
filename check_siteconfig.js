const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== SITECONFIG ENTRIES ===");
    const configs = await prisma.siteConfig.findMany();
    console.log(`SiteConfig keys (${configs.length}):`, configs.map(c => c.key));

    const globalOpsConf = configs.find(c => c.key === 'global_operations');
    if (globalOpsConf) {
        const ops = globalOpsConf.value;
        console.log(`global_operations count: ${Array.isArray(ops) ? ops.length : 'not an array'}`);
        if (Array.isArray(ops)) {
            console.log("global_operations list:", ops.map(o => ({ id: o.id, name: o.name, status: o.status })));
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
