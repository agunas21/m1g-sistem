const xlsx = require('xlsx');
const fs = require('fs');

try {
    const workbook = xlsx.readFile('C:\\Users\\gunas\\Desktop\\M1g\\EKİP LİSTE ŞABLOM.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    console.log("COLUMNS:");
    if (data.length > 0) {
        console.log(Object.keys(data[0]));
    }
    console.log("\nFIRST 5 ROWS:");
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (e) {
    console.error("Error reading file:", e.message);
}
