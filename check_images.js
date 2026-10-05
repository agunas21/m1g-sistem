const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const images = await prisma.siteConfig.findUnique({ where: { key: 'global_images' } });
    console.log("=== DB global_images ===");
    console.log(JSON.stringify(images, null, 2));

    const settings = await prisma.siteConfig.findUnique({ where: { key: 'global_settings' } });
    console.log("=== DB global_settings logo fields ===");
    if (settings && settings.value) {
        console.log("siteLogo in global_settings:", settings.value.siteLogo);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
