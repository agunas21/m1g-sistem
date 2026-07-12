const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
    try {
        const workbook = xlsx.readFile('C:\\Users\\gunas\\Desktop\\M1g\\EKİP LİSTE ŞABLOM.xlsx');
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        let updatedCount = 0;
        let notFoundCount = 0;
        
        for (let row of data) {
            // "Not:  Lütfen girişlerinizi aşağıda verilen örnek bilgiler formatında giriniz" -> Adı Soyadı
            const fullNameRaw = row["Not:  Lütfen girişlerinizi aşağıda verilen örnek bilgiler formatında giriniz"];
            if (!fullNameRaw || fullNameRaw === "Adı Soyadı") continue;
            
            const fullName = fullNameRaw.trim();
            const rawTc = row["__EMPTY"] ? String(row["__EMPTY"]).trim() : null;
            const phone = row["__EMPTY_6"] ? String(row["__EMPTY_6"]).trim() : null;
            const email = row["__EMPTY_7"] ? String(row["__EMPTY_7"]).trim() : null;
            const birthDateStr = row["__EMPTY_3"] ? String(row["__EMPTY_3"]).trim() : null;
            const bloodType = row["__EMPTY_4"] ? String(row["__EMPTY_4"]).trim() : null;

            // Find member by name (TC is encrypted in DB so we can't easily query by it without fetching all and decrypting)
            // It's safer to query by fullName.
            const member = await prisma.member.findFirst({
                where: { fullName: { equals: fullName, mode: 'insensitive' } }
            });

            if (member) {
                await prisma.member.update({
                    where: { id: member.id },
                    data: {
                        phone: phone || member.phone,
                        email: email || member.email,
                        bloodType: bloodType || member.bloodType,
                        // birthDate: We can add logic to parse Excel dates later if needed
                    }
                });
                updatedCount++;
            } else {
                notFoundCount++;
            }
        }
        
        console.log(`Bitti! ${updatedCount} kayıt başarıyla güncellendi. ${notFoundCount} kişi sistemde isimden bulunamadı.`);
    } catch (e) {
        console.error("Hata:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
