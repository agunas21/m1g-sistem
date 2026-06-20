const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const configs = await prisma.siteConfig.findMany();
    for (const c of configs) {
        const json = JSON.stringify(c.value);
        const mb = (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2);
        console.log(`Key: ${c.key} => ${mb} MB (${(json.length/1024).toFixed(0)} KB)`);
        
        // heroImages içindeki her resmin boyutunu göster
        if (c.key === 'global_images' && c.value && c.value.heroImages) {
            c.value.heroImages.forEach((img, i) => {
                const imgStr = typeof img === 'string' ? img : JSON.stringify(img);
                const imgKb = (Buffer.byteLength(imgStr, 'utf8') / 1024).toFixed(0);
                const isBase64 = imgStr.startsWith('data:');
                console.log(`  heroImage[${i}]: ${imgKb} KB ${isBase64 ? '(BASE64 - SORUN BU!)' : '(URL - OK)'}`);
            });
        }
        if (c.key === 'global_images' && c.value && c.value.siteLogo) {
            const isBase64 = c.value.siteLogo.startsWith?.('data:');
            const kb = (Buffer.byteLength(c.value.siteLogo, 'utf8') / 1024).toFixed(0);
            console.log(`  siteLogo: ${kb} KB ${isBase64 ? '(BASE64 - SORUN!)' : '(URL - OK)'}`);
        }
    }
    await prisma.$disconnect();
}
check();
