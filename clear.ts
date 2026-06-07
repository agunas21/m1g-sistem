import { prisma } from './src/lib/prisma';
async function run() {
    const existing = await prisma.siteConfig.findUnique({ where: { key: 'global_images' } });
    if (existing) {
        const val = existing.value as any;
        val.siteLogo = '';
        await prisma.siteConfig.update({
            where: { key: 'global_images' },
            data: { value: val }
        });
        console.log('Logo cleared from DB');
    }
}
run().catch(console.error);
