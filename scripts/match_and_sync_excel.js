const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const EXCEL_PATH = "C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto.xlsx";

async function main() {
    console.log("Reading database inventory items...");
    const dbItems = await prisma.inventoryItem.findMany();
    console.log(`Total DB items: ${dbItems.length}`);

    console.log(`Reading Excel file at ${EXCEL_PATH}...`);
    const wb = XLSX.readFile(EXCEL_PATH);
    console.log("Sheet names in Excel:", wb.SheetNames);

    // Collect all existing Excel items and their identifiers
    const excelItemsBySheet = {};
    const excelSerialNos = new Set();
    const excelBarcodes = new Set();
    const excelNames = new Set();

    for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        excelItemsBySheet[sheetName] = rows;

        for (const row of rows) {
            // Check keys in row
            const keys = Object.keys(row);
            const serialKey = keys.find(k => k.toLowerCase().includes("seri"));
            const nameKey = keys.find(k => k.toLowerCase().includes("malzeme") || k.toLowerCase().includes("ad") || k.toLowerCase().includes("isim"));
            
            if (serialKey && row[serialKey]) {
                const sNo = String(row[serialKey]).trim().toUpperCase();
                if (sNo) {
                    excelSerialNos.add(sNo);
                    excelBarcodes.add(sNo);
                }
            }
            if (nameKey && row[nameKey]) {
                const n = String(row[nameKey]).trim().toUpperCase();
                if (n) excelNames.add(n);
            }
        }
    }

    console.log(`Found ${excelSerialNos.size} serial numbers and ${excelNames.size} distinct names in Excel.`);

    // Find DB items that are NOT present in Excel
    const missingInExcel = [];

    for (const item of dbItems) {
        const itemId = String(item.id).trim().toUpperCase();
        const itemName = String(item.name).trim().toUpperCase();
        const notes = item.notes || "";
        
        // Extract serial number from notes if available
        let serialNoFromNotes = "";
        const serialMatch = notes.match(/Seri\s*No:\s*([^\n;|,]+)/i);
        if (serialMatch && serialMatch[1]) {
            serialNoFromNotes = serialMatch[1].trim().toUpperCase();
        }

        // Check if item exists in Excel by ID, serialNoFromNotes, or direct barcode match
        const hasId = excelBarcodes.has(itemId) || excelSerialNos.has(itemId);
        const hasSerial = serialNoFromNotes ? (excelSerialNos.has(serialNoFromNotes) || excelBarcodes.has(serialNoFromNotes)) : false;

        // Extract base name without #1, #2 suffix if present
        const baseName = itemName.replace(/\s*#\d+$/, "");

        if (!hasId && !hasSerial) {
            missingInExcel.push({
                dbItem: item,
                extractedSerial: serialNoFromNotes || itemId,
                baseName: baseName
            });
        }
    }

    console.log(`Total missing items in Excel: ${missingInExcel.length}`);
    missingInExcel.forEach((m, idx) => {
        console.log(`${idx + 1}. [${m.dbItem.category}] ID: ${m.dbItem.id} | Name: ${m.dbItem.name} | Serial: ${m.extractedSerial}`);
    });

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
