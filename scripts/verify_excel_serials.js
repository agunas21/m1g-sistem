const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/gunas/Desktop/M1G_Guncellenmis_Manifesto_Guncel.xlsx');

for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`=== Sheet: ${name} ===`);
    const isYonetim = name === 'YÖNETİM';
    const sCol = isYonetim ? 3 : 2;
    const nCol = isYonetim ? 2 : 1;
    const startRow = isYonetim ? 3 : 2;
    let filled = 0, total = 0;
    for (let r = startRow; r < data.length; r++) {
        if (!data[r] || !data[r][nCol]) continue;
        total++;
        if (data[r][sCol] && String(data[r][sCol]).trim() !== "") {
            filled++;
        } else {
            console.log(`  Blank remaining at Row ${r+1}: ${data[r][nCol]}`);
        }
    }
    console.log(`Summary for ${name}: ${filled}/${total} rows have Seri No filled.\n`);
}
