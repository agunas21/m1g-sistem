const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const fs = require("fs");

const prisma = new PrismaClient();
const EXCEL_PATH = "C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto.xlsx";
const OUTPUT_PATH = "C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto_Guncel.xlsx";

function normalizeName(str) {
    if (!str) return "";
    return String(str)
        .toUpperCase()
        .replace(/[\s\-_#\.\,\(\)\/]/g, "")
        .replace(/İ/g, "I")
        .replace(/I/g, "I")
        .replace(/Ğ/g, "G")
        .replace(/Ü/g, "U")
        .replace(/Ş/g, "S")
        .replace(/Ö/g, "O")
        .replace(/Ç/g, "C")
        .trim();
}

function parseNotesSerial(notes) {
    if (!notes) return "";
    const match = notes.match(/Seri\s*No:\s*([^\n;|,]+)/i);
    if (match && match[1]) {
        const val = match[1].trim();
        if (val && val !== "-" && val !== "***") return val;
    }
    return "";
}

async function main() {
    console.log("Loading database inventory items...");
    const dbItems = await prisma.inventoryItem.findMany();
    console.log(`Loaded ${dbItems.length} items from database.`);

    // Map DB items by normalized name and category
    const dbItemsMap = [];
    const usedDbItemIds = new Set();

    for (const item of dbItems) {
        const extractedSerial = parseNotesSerial(item.notes) || item.id;
        const normName = normalizeName(item.name);
        const cat = (item.category || "").toLowerCase().trim();
        
        dbItemsMap.push({
            id: item.id,
            name: item.name,
            normName: normName,
            category: item.category,
            cat: cat,
            serial: extractedSerial
        });
    }

    // Read original manifesto file
    console.log(`Reading Excel file at ${EXCEL_PATH}...`);
    const wb = XLSX.readFile(EXCEL_PATH);

    let filledCount = 0;
    const summary = [];

    for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        const isYonetim = sheetName === "YÖNETİM";
        const nameColIdx = isYonetim ? 2 : 1;
        const serialColIdx = isYonetim ? 3 : 2;
        const startRowIdx = isYonetim ? 3 : 2;

        let sheetFilled = 0;

        for (let r = startRowIdx; r < rows.length; r++) {
            const row = rows[r];
            if (!Array.isArray(row) || row.length <= nameColIdx) continue;

            const rawName = row[nameColIdx];
            if (!rawName) continue;

            const currentSerial = row[serialColIdx];
            const isEmptySerial = !currentSerial || 
                String(currentSerial).trim() === "" || 
                String(currentSerial).trim() === "-" || 
                String(currentSerial).trim() === "***" ||
                String(currentSerial).trim().toLowerCase() === "null";

            if (isEmptySerial) {
                const normName = normalizeName(rawName);
                if (!normName) continue;

                // Find candidate in dbItemsMap
                const candidate = dbItemsMap.find(d => {
                    if (usedDbItemIds.has(d.id)) return false;
                    // Match normalized name (either exact or substring)
                    const isNameMatch = d.normName === normName || d.normName.includes(normName) || normName.includes(d.normName);
                    return isNameMatch;
                });

                if (candidate) {
                    row[serialColIdx] = candidate.serial;
                    usedDbItemIds.add(candidate.id);
                    filledCount++;
                    sheetFilled++;
                    summary.push({
                        sheet: sheetName,
                        row: r + 1,
                        name: rawName,
                        assignedSerial: candidate.serial,
                        dbId: candidate.id
                    });
                }
            } else {
                // Track already assigned serials in Excel
                const sStr = String(currentSerial).trim().toUpperCase();
                const existingDbItem = dbItemsMap.find(d => d.serial.toUpperCase() === sStr || d.id.toUpperCase() === sStr);
                if (existingDbItem) {
                    usedDbItemIds.add(existingDbItem.id);
                }
            }
        }

        // Write updated rows back to sheet
        const newSheet = XLSX.utils.aoa_to_sheet(rows);
        wb.Sheets[sheetName] = newSheet;
        console.log(`Sheet '${sheetName}': Filled ${sheetFilled} empty serial numbers.`);
    }

    console.log(`Total filled empty serial numbers: ${filledCount}`);
    summary.forEach((s, idx) => {
        console.log(`${idx + 1}. [${s.sheet} Row ${s.row}] ${s.name} -> Seri No: ${s.assignedSerial}`);
    });

    console.log(`Saving workbook...`);
    try {
        XLSX.writeFile(wb, EXCEL_PATH);
        console.log(`SUCCESS: Original file updated at ${EXCEL_PATH}`);
    } catch (e) {
        console.warn(`Original file locked by Excel. Saving to ${OUTPUT_PATH}...`);
        XLSX.writeFile(wb, OUTPUT_PATH);
        console.log(`SUCCESS: Updated file saved at ${OUTPUT_PATH}`);
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
