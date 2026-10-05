const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto.xlsx');

for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`=== Sheet: ${sheetName} ===`);
    for (let i = 0; i < Math.min(6, data.length); i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }
}
