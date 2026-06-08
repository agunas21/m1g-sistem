const fs = require('fs');
const path = require('path');
const https = require('https');

// Ege Bölgesi (İzmir ve çevresi) Bounding Box
const MIN_LAT = 37.8;
const MAX_LAT = 39.3;
const MIN_LNG = 26.2;
const MAX_LNG = 28.5;

// İndirilecek zoom seviyeleri
const MIN_ZOOM = 8;
const MAX_ZOOM = 12; // Daha derine inmek GB'larca veri demek olabilir, şimdilik 12 ideal.

const BASE_URL = 'https://tile.openstreetmap.org';
const OUTPUT_DIR = path.join(__dirname, '../public/tiles');

function lon2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

function downloadTile(z, x, y) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}/${z}/${x}/${y}.png`;
        const dir = path.join(OUTPUT_DIR, z.toString(), x.toString());
        const filePath = path.join(dir, `${y}.png`);

        if (fs.existsSync(filePath)) {
            // Already downloaded
            return resolve(false);
        }

        fs.mkdirSync(dir, { recursive: true });

        const req = https.get(url, {
            headers: {
                'User-Agent': 'M1G-Offline-Map-Downloader/1.0'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                console.error(`Failed to download ${url}: ${res.statusCode}`);
                return resolve(false);
            }

            const file = fs.createWriteStream(filePath);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            console.error(`Error downloading ${url}:`, err.message);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function start() {
    console.log("Ege Bölgesi Harita Verileri (OSM) İndiriliyor...");
    console.log(`Zoom Seviyeleri: ${MIN_ZOOM} - ${MAX_ZOOM}`);
    
    let totalTiles = 0;
    let downloadedTiles = 0;
    
    // First pass to count tiles
    for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
        const minX = lon2tile(MIN_LNG, z);
        const maxX = lon2tile(MAX_LNG, z);
        const minY = lat2tile(MAX_LAT, z);
        const maxY = lat2tile(MIN_LAT, z);
        totalTiles += (maxX - minX + 1) * (maxY - minY + 1);
    }
    
    console.log(`Toplam indirilecek tile sayısı: ${totalTiles}`);
    
    // Second pass to download
    for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
        const minX = lon2tile(MIN_LNG, z);
        const maxX = lon2tile(MAX_LNG, z);
        const minY = lat2tile(MAX_LAT, z); // OSM uses inverted Y coordinates
        const maxY = lat2tile(MIN_LAT, z);

        console.log(`Zoom ${z} işleniyor... X: ${minX}-${maxX}, Y: ${minY}-${maxY}`);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const downloaded = await downloadTile(z, x, y);
                if (downloaded) {
                    downloadedTiles++;
                    process.stdout.write(`\rİndirilen: ${downloadedTiles}/${totalTiles} (Zoom: ${z})`);
                    // Sleep slightly to not overload OSM servers
                    await new Promise(r => setTimeout(r, 50));
                }
            }
        }
    }
    
    console.log("\nHarita verileri başarıyla public/tiles klasörüne indirildi.");
}

start();
