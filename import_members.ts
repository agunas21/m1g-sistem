import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Import hashPassword from crypto logic
import crypto from 'crypto';
const hashPassword = (password: string) => {
    // Basic fallback if lib/crypto is complex, but I'll try to just require it if possible
    // Wait, let's check src/lib/crypto.ts to see what it does.
    // If I can't require it, I will just use the same logic here.
    return ''; // placeholder, will replace below
};

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DIR = "C:\\Users\\gunas\\Desktop\\M1g\\üye resim";
const EXCEL_PATH = "C:\\Users\\gunas\\Desktop\\M1g\\8. M1G EKİP ÜYE BİLGİ LİSTESİ.xlsx";

const targetNames = [
    "Beylün Serdaroğlu",
    "Elif Verel",
    "Nail Efe Bahçebakan",
    "Pınar Çezik"
];

const normalize = (str: string) => {
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/i̇/g, 'i')
        .replace(/\s+/g, '');
};

async function main() {
    // Using dynamic import for the crypto lib since it's local
    const { hashPassword } = await import('./src/lib/crypto');

    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // use header: 1 to skip the first empty rows if needed, or just normal
    // The first row was 'ÜYE BİLGİ TABLOSU', second empty, third headers
    const rawJson = xlsx.utils.sheet_to_json<any>(worksheet, { header: 1 });
    
    // Find the header row index
    let headerRowIdx = -1;
    for (let i = 0; i < 10; i++) {
        if (rawJson[i] && rawJson[i].includes('ADI SOYADI')) {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) throw new Error("Header not found");

    const headers = rawJson[headerRowIdx];
    const rows = rawJson.slice(headerRowIdx + 1);

    for (const rowArr of rows) {
        if (!rowArr || rowArr.length === 0) continue;
        const row: any = {};
        headers.forEach((h: string, i: number) => {
            row[h] = rowArr[i];
        });

        const fullName = row['ADI SOYADI'];
        if (!fullName) continue;

        if (targetNames.some(t => normalize(t) === normalize(fullName))) {
            console.log("Found target user:", fullName);
            
            // Generate email if missing
            const email = row['E-POSTA'] || `${normalize(fullName)}@m1g.org.tr`;
            const phone = row['GSM'] ? String(row['GSM']) : null;
            const tcNo = row['T.C. KİMLİK NO'] ? String(row['T.C. KİMLİK NO']) : null;
            const bloodType = row['KAN GRUBU'] || null;
            let birthDate = row['DOĞUM TARİHİ'];
            // Handle excel date numbers
            if (typeof birthDate === 'number') {
                const date = new Date((birthDate - (25567 + 2)) * 86400 * 1000); // Excel date to JS
                birthDate = date.toLocaleDateString('tr-TR');
            } else {
                birthDate = String(birthDate);
            }

            const existing = await prisma.member.findUnique({ where: { email } });
            let memberId = existing?.id;

            if (!existing) {
                // Determine a password
                const plainPass = tcNo ? tcNo : "123456";
                const hashed = hashPassword(plainPass);
                
                const newMember = await prisma.member.create({
                    data: {
                        fullName: fullName,
                        email: email,
                        password: hashed,
                        phone: phone,
                        tcNo: tcNo,
                        bloodType: bloodType,
                        birthDate: birthDate,
                        status: "Aktif",
                        memberType: "Üye"
                    }
                });
                console.log(`Created user ${fullName} with email ${email}`);
                memberId = newMember.id;
            } else {
                console.log(`User ${fullName} already exists in DB.`);
            }

            // Now upload photo
            // Find the photo file
            const files = fs.readdirSync(DIR);
            const photoFile = files.find(f => normalize(path.parse(f).name) === normalize(fullName));
            if (photoFile && memberId) {
                const filePath = path.join(DIR, photoFile);
                console.log(`Uploading photo for ${fullName}...`);
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'm1g/avatars',
                    public_id: `avatar_${memberId}`,
                    overwrite: true
                });

                await prisma.member.update({
                    where: { id: memberId },
                    data: { avatar: result.secure_url }
                });
                console.log(`Uploaded avatar for ${fullName}`);
            } else {
                console.log(`Photo not found for ${fullName} in the directory.`);
            }
        }
    }

    console.log("Done.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
