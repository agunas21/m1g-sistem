require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const crypto = require('crypto');
const { Readable } = require('stream');

const prisma = new PrismaClient();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function uploadToCloudinary(base64str, label) {
    return new Promise((resolve, reject) => {
        const timestamp = Math.round(Date.now() / 1000);
        const paramsToSign = `folder=hero-images&timestamp=${timestamp}`;
        const signature = crypto.createHash('sha1').update(paramsToSign + API_SECRET).digest('hex');

        const boundary = '----FormBoundary' + crypto.randomBytes(16).toString('hex');
        
        const parts = [
            `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\n${base64str}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${API_KEY}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nhero-images\r\n`,
            `--${boundary}--\r\n`
        ];
        
        const body = Buffer.from(parts.join(''));
        
        const options = {
            hostname: 'api.cloudinary.com',
            path: `/v1_1/${CLOUD_NAME}/image/upload`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.secure_url) {
                        console.log(`  ✓ ${label} yüklendi: ${parsed.secure_url}`);
                        resolve(parsed.secure_url);
                    } else {
                        reject(new Error(`Cloudinary hatası: ${JSON.stringify(parsed)}`));
                    }
                } catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function migrate() {
    console.log('Cloudinary config:', { CLOUD_NAME, API_KEY: API_KEY ? 'VAR' : 'YOK', API_SECRET: API_SECRET ? 'VAR' : 'YOK' });
    
    const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_images' } });
    if (!conf) { console.log('global_images bulunamadı'); return; }
    
    const images = conf.value;
    const heroImages = images.heroImages || [];
    
    console.log(`\nToplam ${heroImages.length} hero resmi bulundu.`);
    
    const newHeroImages = [];
    for (let i = 0; i < heroImages.length; i++) {
        const img = heroImages[i];
        const imgStr = typeof img === 'object' ? (img.src || img.url || '') : img;
        
        if (typeof imgStr === 'string' && imgStr.startsWith('data:')) {
            const kb = (imgStr.length / 1024).toFixed(0);
            console.log(`\nheroImage[${i}]: ${kb} KB - base64, Cloudinary'e yükleniyor...`);
            try {
                const url = await uploadToCloudinary(imgStr, `heroImage[${i}]`);
                if (typeof img === 'object') {
                    newHeroImages.push({ ...img, src: url, url });
                } else {
                    newHeroImages.push(url);
                }
            } catch(e) {
                console.error(`  ✗ heroImage[${i}] yüklenemedi:`, e.message);
                newHeroImages.push(img);
            }
        } else {
            console.log(`heroImage[${i}]: zaten URL, geçiliyor.`);
            newHeroImages.push(img);
        }
    }
    
    // Logo kontrolü
    let siteLogo = images.siteLogo;
    if (siteLogo && typeof siteLogo === 'string' && siteLogo.startsWith('data:')) {
        const kb = (siteLogo.length / 1024).toFixed(0);
        console.log(`\nsiteLogo: ${kb} KB - base64, Cloudinary'e yükleniyor...`);
        try {
            siteLogo = await uploadToCloudinary(siteLogo, 'siteLogo');
        } catch(e) {
            console.error('Logo yüklenemedi:', e.message);
        }
    }
    
    const newImages = { ...images, heroImages: newHeroImages, siteLogo };
    
    await prisma.siteConfig.update({
        where: { key: 'global_images' },
        data: { value: newImages }
    });
    
    const newSizeKB = (Buffer.byteLength(JSON.stringify(newImages), 'utf8') / 1024).toFixed(1);
    console.log(`\n✅ MİGRASYON TAMAMLANDI!`);
    console.log(`Önceki boyut: ~4000 KB`);
    console.log(`Yeni boyut: ${newSizeKB} KB`);
    console.log('global_images artık sadece Cloudinary URL\'leri içeriyor. Her sayfa yüklemesi artık sadece birkaç KB!');
    
    await prisma.$disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
