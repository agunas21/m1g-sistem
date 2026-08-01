const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function generateShortId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const categoryMap = {
    'LOJİSTİK': 'Lojistik',
    'MEDİKAL': 'Medikal',
    'YÖNETİM': 'Yönetim',
    'KURTARMA': 'Kurtarma',
    'ARAMA ': 'Arama',
    'ARAMA': 'Arama'
};

async function main() {
    console.log("=== STARTING IMPORT OF MISSING MANIFESTO ITEMS TO DEPOT ===");

    const filePath = 'C:\\Users\\gunas\\Desktop\\M1G_Guncellenmis_Manifesto.xlsx';
    const workbook = xlsx.readFile(filePath);
    const dbItems = await prisma.inventoryItem.findMany();

    const dbById = new Map();
    dbItems.forEach(item => dbById.set(item.id.toUpperCase().trim(), item));

    const dbByNameAndCat = new Map();
    dbItems.forEach(item => {
        const key = `${item.category.toLowerCase().trim()}_${item.name.replace(/\s*#\d+$/, '').toLowerCase().trim()}`;
        if (!dbByNameAndCat.has(key)) dbByNameAndCat.set(key, []);
        dbByNameAndCat.get(key).push(item);
    });

    const ocrMap = {
        '44HD8Z': '44HDIZ',
        'FFSSRV': 'FF55RV',
        'DZKLLG': '0ZKLLO',
        'U5D1DQ': 'U3O1DQ',
        'OSBYD1': 'O9BY0I',
        'VJQFD4': 'VJQEQ4',
        'S1UDFF': '91UDFE',
        'P5JBGG': 'PSJB5G',
        'NHVM6F': 'NXYM5F',
        'EUQZ2B': 'EI22BB',
        '1C2TRP': '1C2TKP',
        'QJNJ3M': 'QIN3SM',
        '6YWPDL': 'AY8PUL',
        'T2WMQ': 'T2MMQF',
        'KDS9Q': 'KDS9QK',
        'X9N7GV': 'KJNG0V',
        '2HL2S5': 'ZHL2S6',
        'L2W67H': 'LZW67H',
    };

    const itemsToCreate = [];

    for (const rawSheetName of workbook.SheetNames) {
        const sheetCategory = categoryMap[rawSheetName] || rawSheetName.trim();
        const sheet = workbook.Sheets[rawSheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let headerIdx = -1;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            const r = rows[i];
            if (Array.isArray(r) && r.some(cell => typeof cell === 'string' && cell.includes('MALZEME CİNSİ'))) {
                headerIdx = i;
                break;
            }
        }
        if (headerIdx === -1) continue;

        const header = rows[headerIdx];
        const nameCol = header.findIndex(c => typeof c === 'string' && c.includes('MALZEME CİNSİ'));
        const seriCol = header.findIndex(c => typeof c === 'string' && c.includes('SERİ NO'));
        const markaCol = header.findIndex(c => typeof c === 'string' && c.includes('MARKA/ MODEL'));
        const adetCol = header.findIndex(c => typeof c === 'string' && c.includes('ADET'));
        const agirlikCol = header.findIndex(c => typeof c === 'string' && c.includes('AĞIRLIK KG'));
        const hacimCol = header.findIndex(c => typeof c === 'string' && c.includes('HACİM M³'));

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            const name = r[nameCol] ? String(r[nameCol]).trim() : '';
            if (!name || name.includes('MALZEME') || name === 'S.NO') continue;

            const seriNo = r[seriCol] ? String(r[seriCol]).trim() : '';
            const marka = (r[markaCol] && r[markaCol] !== '***') ? String(r[markaCol]).trim() : '';
            const adet = parseInt(r[adetCol]) || 1;
            const agirlik = r[agirlikCol] !== undefined ? String(r[agirlikCol]).trim() : '';
            const hacim = r[hacimCol] !== undefined ? String(r[hacimCol]).trim() : '';

            const cleanSeri = (seriNo && seriNo !== 'SARF MALZEMESİ' && seriNo !== '***' && seriNo !== '7' && seriNo !== '6') ? seriNo.toUpperCase().trim() : '';

            // Check if item is already registered in DB
            let existingInDb = false;

            if (cleanSeri) {
                if (dbById.has(cleanSeri)) {
                    existingInDb = true;
                } else if (ocrMap[cleanSeri] && dbById.has(ocrMap[cleanSeri])) {
                    existingInDb = true;
                }
            }

            if (!existingInDb) {
                const key = `${sheetCategory.toLowerCase()}_${name.toLowerCase()}`;
                const existingGroup = dbByNameAndCat.get(key) || [];

                if (existingGroup.length > 0 && !cleanSeri) {
                    if (existingGroup.length >= adet) {
                        existingInDb = true;
                    }
                }
            }

            if (!existingInDb) {
                const notesList = [];
                if (seriNo && seriNo !== '***') notesList.push(`Seri No: ${seriNo}`);
                if (marka) notesList.push(`Marka/Model: ${marka}`);
                if (agirlik) notesList.push(`Ağırlık: ${agirlik} kg`);
                if (hacim) notesList.push(`Hacim: ${hacim} m³`);
                const notesStr = notesList.join(' | ');

                for (let k = 0; k < adet; k++) {
                    let itemId = (cleanSeri && k === 0 && !dbById.has(cleanSeri)) ? cleanSeri : generateShortId();
                    while (dbById.has(itemId) || itemsToCreate.some(it => it.id === itemId)) {
                        itemId = generateShortId();
                    }

                    const itemName = (adet > 1 && !cleanSeri) ? `${name} #${k + 1}` : name;

                    itemsToCreate.push({
                        id: itemId,
                        name: itemName,
                        category: sheetCategory,
                        status: 'Depoda',
                        condition: 'İyi',
                        type: (seriNo === 'SARF MALZEMESİ') ? 'Sarf' : 'Demirbaş',
                        equipmentCategory: (sheetCategory === 'Medikal' || sheetCategory === 'Yönetim') ? 'KAMP' : 'ARAMA_KURTARMA',
                        notes: notesStr
                    });
                }
            }
        }
    }

    console.log(`Found ${itemsToCreate.length} missing items to insert into DB.`);

    let insertedCount = 0;
    for (const itemData of itemsToCreate) {
        await prisma.inventoryItem.create({
            data: itemData
        });
        insertedCount++;
        console.log(`[+${insertedCount}/${itemsToCreate.length}] Inserted ID: ${itemData.id} | Name: "${itemData.name}" | Category: "${itemData.category}"`);
    }

    console.log(`\n🎉 SUCCESS! ${insertedCount} new items registered in system depot.`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error("FATAL ERROR:", err);
    prisma.$disconnect();
});
