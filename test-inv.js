const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.inventoryItem.findMany().then(r => {
    console.log('Inventory count:', r.length);
}).catch(console.error).finally(() => prisma.$disconnect());
