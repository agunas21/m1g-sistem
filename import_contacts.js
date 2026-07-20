const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wb = xlsx.readFile('C:/Users/gunas/Desktop/M1g/M1g Yakın  İletişim.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  for (const row of data) {
    const fullName = row['Adı Soyadı']?.toString().trim();
    if (!fullName) continue;

    let contactName = row['Yakın Ad Soyad']?.toString().trim() || row['Yakınlık Derecesi']?.toString().trim() || 'Yakını';
    let contactPhone = row['Yakın Telefon Numarası']?.toString().trim();

    if (!contactPhone) continue; // If no phone, skip

    // Format phone to basic display if needed, but keeping it as is fine
    let emergencyContactString = `${contactName} - ${contactPhone}`;

    // Find member by name
    const members = await prisma.member.findMany();
    
    // Simple matching (case insensitive and ignore extra spaces)
    const normalizedTargetName = fullName.toLowerCase().replace(/\s+/g, ' ');
    const member = members.find(m => m.fullName.toLowerCase().replace(/\s+/g, ' ') === normalizedTargetName);

    if (member) {
      await prisma.member.update({
        where: { id: member.id },
        data: { emergencyContact: emergencyContactString }
      });
      console.log(`Updated: ${member.fullName} -> ${emergencyContactString}`);
    } else {
      console.log(`NOT FOUND: ${fullName}`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
