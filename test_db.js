const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const conf = await prisma.siteConfig.findMany();
        console.log("Success! Found", conf.length, "config items.");
    } catch (e) {
        console.error("Error connecting to old DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
