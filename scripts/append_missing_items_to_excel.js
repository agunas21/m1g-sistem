const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

const prisma = new PrismaClient();
const EXCEL_PATH = "C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto.xlsx";

function parseNotes(notesStr) {
    if (!notesStr) return { serial: "", brand: "***", weight: "-", volume: "-" };
    
    let serial = "";
    let brand = "***";
    let weight = "-";
    let volume = "-";

    const sMatch = notesStr.match(/Seri\s*No:\s*([^\n;|,]+)/i);
    if (sMatch && sMatch[1]) serial = sMatch[1].trim();

    const bMatch = notesStr.match(/Marka\/Model:\s*([^\n;|,]+)/i);
    if (bMatch && bMatch[1]) brand = bMatch[1].trim();

    const wMatch = notesStr.match(/Ağırlık:\s*([^\n;|,]+)/i);
    if (wMatch && wMatch[1]) weight = wMatch[1].trim();

    const vMatch = notesStr.match(/Hacim:\s*([^\n;|,]+)/i);
    if (vMatch && vMatch[1]) volume = vMatch[1].trim();

    return { serial, brand, weight, volume };
}

async function main() {
    console.log("Reading database inventory items...");
    const dbItems = await prisma.inventoryItem.findMany();
    console.log(`Loaded ${dbItems.length} items from DB.`);

    const wb = XLSX.readFile(EXCEL_PATH);

    // Map existing identifiers in Excel
    const excelSerials = new Set();
    const excelIds = new Set();

    for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let r = 0; r < data.length; r++) {
            const row = data[r];
            if (!Array.isArray(row)) continue;

            for (const cell of row) {
                if (cell !== null && cell !== undefined) {
                    const str = String(cell).trim().toUpperCase();
                    if (str) {
                        excelSerials.add(str);
                        excelIds.add(str);
                    }
                }
            }
        }
    }

    console.log(`Collected ${excelSerials.size} unique values from Excel.`);

    // Categorize DB items missing from Excel
    const missingBySheet = {
        "LOJİSTİK": [],
        "MEDİKAL": [],
        "YÖNETİM": [],
        "KURTARMA": [],
        "ARAMA ": []
    };

    let missingCount = 0;

    for (const item of dbItems) {
        const itemId = String(item.id).trim().toUpperCase();
        const parsed = parseNotes(item.notes);
        const serialNo = parsed.serial ? parsed.serial.toUpperCase() : itemId;

        const isPresent = excelIds.has(itemId) || excelSerials.has(serialNo) || excelSerials.has(itemId);

        if (!isPresent) {
            missingCount++;
            let sheetTarget = "LOJİSTİK";
            const cat = (item.category || "").toLowerCase().trim();

            if (cat.includes("medikal") || cat.includes("sağlık") || cat.includes("saglik")) {
                sheetTarget = "MEDİKAL";
            } else if (cat.includes("yönetim") || cat.includes("yonetim")) {
                sheetTarget = "YÖNETİM";
            } else if (cat.includes("kurtarma")) {
                sheetTarget = "KURTARMA";
            } else if (cat.includes("arama")) {
                sheetTarget = "ARAMA ";
            } else {
                sheetTarget = "LOJİSTİK";
            }

            missingBySheet[sheetTarget].push({
                item,
                parsed
            });
        }
    }

    console.log(`Found ${missingCount} DB items not present in Excel.`);

    // Append to sheets
    for (const sheetName of wb.SheetNames) {
        const missingItems = missingBySheet[sheetName] || [];
        if (missingItems.length === 0) {
            console.log(`Sheet '${sheetName}': No new items to add.`);
            continue;
        }

        console.log(`Sheet '${sheetName}': Appending ${missingItems.length} missing items...`);
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        // Find max S.NO in current sheet
        let maxSNo = 0;
        const isYonetim = sheetName === "YÖNETİM";
        const snoColIdx = isYonetim ? 1 : 0;
        const startDataRow = isYonetim ? 3 : 2;

        for (let r = startDataRow; r < rows.length; r++) {
            const row = rows[r];
            if (row && row[snoColIdx] !== null && row[snoColIdx] !== undefined) {
                const val = parseInt(row[snoColIdx]);
                if (!isNaN(val) && val > maxSNo) maxSNo = val;
            }
        }

        // Add new rows
        for (const { item, parsed } of missingItems) {
            maxSNo++;
            const sNo = maxSNo;
            const name = item.name;
            const serialNo = parsed.serial || item.id;
            const brand = parsed.brand || "***";
            const qty = item.quantity || 1;
            const weight = parsed.weight || "-";
            const volume = parsed.volume || "-";

            let newRow = [];
            if (isYonetim) {
                newRow = [null, sNo, name, serialNo, brand, qty, weight, volume];
            } else {
                newRow = [sNo, name, serialNo, brand, qty, weight, volume];
            }

            rows.push(newRow);
        }

        // Convert rows back to sheet
        const newSheet = XLSX.utils.aoa_to_sheet(rows);
        wb.Sheets[sheetName] = newSheet;
    }

    console.log(`Writing updated workbook to ${EXCEL_PATH}...`);
    try {
        XLSX.writeFile(wb, EXCEL_PATH);
        console.log("SUCCESS: Original Excel file successfully updated!");
    } catch (err) {
        if (err.code === "EBUSY") {
            const fallbackPath = "C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto_Guncel.xlsx";
            console.warn(`NOTICE: ${EXCEL_PATH} is currently open in Excel! Saving to ${fallbackPath} instead...`);
            XLSX.writeFile(wb, fallbackPath);
            console.log(`SUCCESS: File saved as ${fallbackPath}`);
        } else {
            throw err;
        }
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
