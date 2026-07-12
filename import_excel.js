const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

function parseExcelDate(val) {
    if (!val) return null;
    
    // If it's already a string like "21/09/1994" or "03.04.1990"
    if (typeof val === 'string') {
        const str = val.trim();
        // Try parsing DD.MM.YYYY or DD/MM/YYYY
        const parts = str.split(/[\/\.]/);
        if (parts.length === 3) {
            // Keep it as a string formatted like DD.MM.YYYY because DB birthDate is a string!
            // Let's format it nicely to DD.MM.YYYY
            return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`;
        }
        return str; // return as is if unknown format
    }
    
    // If it's an Excel serial number
    if (typeof val === 'number') {
        // Excel serial date to JS Date
        // 25569 is the number of days between 1900-01-01 and 1970-01-01
        // Excel incorrectly assumes 1900 is a leap year, so we subtract 1 more day (25568)
        // Wait, the standard formula is: (val - 25569) * 86400 * 1000
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        const day = String(jsDate.getUTCDate()).padStart(2, '0');
        const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
        const year = jsDate.getUTCFullYear();
        return `${day}.${month}.${year}`;
    }
    
    return String(val);
}

async function main() {
    try {
        const workbook = xlsx.readFile('C:\\Users\\gunas\\Desktop\\M1g\\EKİP LİSTE ŞABLOM.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        let updatedCount = 0;
        
        for (let row of data) {
            const rawTc = row["__EMPTY"] ? String(row["__EMPTY"]).trim() : null;
            if (!rawTc || rawTc === "T.C. Kimlik No") continue;
            
            const birthDateRaw = row["__EMPTY_3"];
            const birthDateStr = parseExcelDate(birthDateRaw);

            // TC NO üzerinden arama
            const member = await prisma.member.findFirst({
                where: { tcNo: rawTc }
            });

            if (member) {
                const updateData = {};
                if (birthDateStr) updateData.birthDate = birthDateStr;
                
                if (Object.keys(updateData).length > 0) {
                    await prisma.member.update({
                        where: { id: member.id },
                        data: updateData
                    });
                    updatedCount++;
                }
            }
        }
        
        console.log(`Bitti! ${updatedCount} kişinin eksik olan DOĞUM TARİHİ verileri güncellendi.`);
    } catch (e) {
        console.error("Hata:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
