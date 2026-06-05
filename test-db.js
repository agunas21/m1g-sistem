const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.member.findMany().then(r => {
    console.log('Count:', r.length);
    if (r.length > 0) {
        console.log(r[0]);
    }
}).finally(() => prisma.$disconnect());
