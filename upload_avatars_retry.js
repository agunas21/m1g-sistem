require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DIR = "C:\\Users\\gunas\\Desktop\\M1g\\üye resim";

const normalize = (str) => {
    return str.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/i̇/g, 'i')
        .replace(/\s+/g, '');
};

async function main() {
    const files = fs.readdirSync(DIR);
    const members = await prisma.member.findMany();
    
    let uploadedCount = 0;
    let notFoundCount = 0;

    for (const file of files) {
        if (!file.match(/\.(jpeg|jpg|png)$/i)) continue;

        const nameFromFilename = path.parse(file).name;
        const normalizedFilename = normalize(nameFromFilename);
        
        // Match using strict normalization
        const member = members.find(m => normalize(m.fullName) === normalizedFilename);

        // If still not found, check if avatar is already set to skip successful ones?
        // Wait, some might already be uploaded. Let's only upload if we haven't or if we are retrying.
        // I will just re-upload if it matches. But to avoid wasting time, skip if `member.avatar` exists and contains 'cloudinary'.
        
        if (member) {
            if (member.avatar && member.avatar.includes('cloudinary')) {
                // Already uploaded
                continue;
            }
            try {
                const filePath = path.join(DIR, file);
                console.log(`Uploading avatar for ${member.fullName}...`);
                const result = await cloudinary.uploader.upload(filePath, {
                    folder: 'm1g/avatars',
                    public_id: `avatar_${member.id}`,
                    overwrite: true
                });

                await prisma.member.update({
                    where: { id: member.id },
                    data: { avatar: result.secure_url }
                });

                console.log(`Successfully uploaded and linked avatar for ${member.fullName}`);
                uploadedCount++;
            } catch (error) {
                console.error(`Failed to upload for ${member.fullName}:`, error.message);
            }
        } else {
            console.log(`STILL could not find a member in DB for filename: ${file}`);
            notFoundCount++;
        }
    }

    console.log(`Done retry. Uploaded: ${uploadedCount}, Not Found: ${notFoundCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
