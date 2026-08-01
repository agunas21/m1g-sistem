const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categoryMap = {
    'LOJİSTİK': 'Lojistik',
    'MEDİKAL': 'Medikal',
    'YÖNETİM': 'Yönetim',
    'KURTARMA': 'Kurtarma',
    'ARAMA ': 'Arama',
    'ARAMA': 'Arama'
};

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

async function main() {
    console.log("=== STARTING CATEGORY AUTOMATIC ASSIGNMENT FOR ALL EXISTING ITEMS ===");

    const filePath = 'C:\\Users\\gunas\\Desktop\\M1G_Guncellenmis_Manifesto.xlsx';
    const workbook = xlsx.readFile(filePath);
    const dbItems = await prisma.inventoryItem.findMany();

    // Map Excel item definitions by ID and by normalized name
    const excelById = new Map();
    const excelByName = new Map();

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

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            const name = r[nameCol] ? String(r[nameCol]).trim() : '';
            if (!name || name.includes('MALZEME') || name === 'S.NO') continue;

            const seriNo = r[seriCol] ? String(r[seriCol]).trim() : '';
            const cleanSeri = (seriNo && seriNo !== 'SARF MALZEMESİ' && seriNo !== '***' && seriNo !== '7' && seriNo !== '6') ? seriNo.toUpperCase().trim() : '';

            const itemInfo = {
                name,
                category: sheetCategory,
                seriNo: cleanSeri
            };

            if (cleanSeri) {
                excelById.set(cleanSeri, itemInfo);
            }

            const nameKey = name.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
            if (!excelByName.has(nameKey)) excelByName.set(nameKey, []);
            excelByName.get(nameKey).push(itemInfo);
        }
    }

    let updatedCount = 0;

    for (const item of dbItems) {
        const dbIdUpper = item.id.toUpperCase().trim();
        let targetCategory = null;
        let matchReason = '';

        // 1. Direct ID match
        if (excelById.has(dbIdUpper)) {
            targetCategory = excelById.get(dbIdUpper).category;
            matchReason = `Direct ID (${dbIdUpper})`;
        }

        // 2. OCR ID match
        if (!targetCategory) {
            for (const [excelId, dbId] of Object.entries(ocrMap)) {
                if (dbId.toUpperCase() === dbIdUpper && excelById.has(excelId)) {
                    targetCategory = excelById.get(excelId).category;
                    matchReason = `OCR ID (${excelId} -> ${dbIdUpper})`;
                    break;
                }
            }
        }

        // 3. Name match
        if (!targetCategory) {
            const cleanDbName = item.name.replace(/\s*#\d+$/, '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
            for (const [excelNameKey, items] of excelByName.entries()) {
                if (cleanDbName === excelNameKey || cleanDbName.includes(excelNameKey) || excelNameKey.includes(cleanDbName)) {
                    targetCategory = items[0].category;
                    matchReason = `Name match (${item.name} -> ${items[0].name})`;
                    break;
                }
            }
        }

        if (targetCategory && item.category !== targetCategory) {
            await prisma.inventoryItem.update({
                where: { id: item.id },
                data: { category: targetCategory }
            });
            updatedCount++;
            console.log(`[+${updatedCount}] Updated Item: ${item.id} | Name: "${item.name}" | Old Category: "${item.category}" -> New Category: "${targetCategory}" (${matchReason})`);
        }
    }

    console.log(`\n🎉 SUCCESS! Updated categories for ${updatedCount} items in the database.`);

    const finalGroup = await prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: true
    });
    console.log("\n=== FINAL INVENTORY COUNT BY CATEGORY ===");
    console.table(finalGroup);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error("ERROR:", err);
    prisma.$disconnect();
});
