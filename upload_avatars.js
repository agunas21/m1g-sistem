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

async function main() {
    const files = fs.readdirSync(DIR);
    console.log(`Found ${files.length} files.`);

    const members = await prisma.member.findMany();
    
    let uploadedCount = 0;
    let notFoundCount = 0;

    for (const file of files) {
        if (!file.match(/\.(jpeg|jpg|png)$/i)) continue;

        const nameFromFilename = path.parse(file).name.toLowerCase();
        
        // Find member with exact or very similar name (case insensitive)
        const member = members.find(m => m.fullName.toLowerCase() === nameFromFilename || m.fullName.toLowerCase('tr-TR') === nameFromFilename.replace(/i/g, 'i').replace(/ı/g, 'i'));

        if (member) {
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
            console.log(`Could not find a member in DB for filename: ${file}`);
            notFoundCount++;
        }
    }

    console.log(`Done. Uploaded: ${uploadedCount}, Not Found: ${notFoundCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
