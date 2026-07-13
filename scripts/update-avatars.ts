/**
 * Upload member photos to Cloudinary and update database avatar fields.
 * 
 * Usage: npx tsx scripts/update-avatars.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'duqysavb7';
const API_KEY = process.env.CLOUDINARY_API_KEY || '549585387619716';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'C1ouf_4yh2zcykFAPlYHWgFjvIw';

const prisma = new PrismaClient();

async function uploadToCloudinary(filePath: string, publicId: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  const ext = path.extname(filePath).replace('.', '');
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataUri = `data:${mimeType};base64,${base64}`;

  // Generate signature
  const crypto = await import('crypto');
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=m1g_avatars&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', dataUri);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', 'm1g_avatars');
  formData.append('public_id', publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await response.json();
  console.log(`  ✅ Uploaded: ${data.secure_url}`);
  return data.secure_url;
}

async function main() {
  const updates = [
    {
      name: 'Didem Akşit',
      searchPattern: 'didem',
      filePath: 'C:\\Users\\gunas\\Desktop\\M1g\\üye resim\\didem akşit.jpeg.jpg',
    },
    {
      name: 'Alper Osman Temiz',
      searchPattern: 'alper',
      filePath: 'C:\\Users\\gunas\\Desktop\\M1g\\üye resim\\Alper Osman TEMİZ.jpg',
    },
  ];

  for (const update of updates) {
    console.log(`\n🔍 Processing: ${update.name}`);

    // Find member in database
    const member = await prisma.member.findFirst({
      where: {
        fullName: {
          contains: update.searchPattern,
          mode: 'insensitive',
        },
      },
      select: { id: true, fullName: true, avatar: true },
    });

    if (!member) {
      console.log(`  ❌ Member not found: ${update.name}`);
      continue;
    }

    console.log(`  Found: ${member.fullName} (ID: ${member.id})`);
    console.log(`  Current avatar: ${member.avatar || '(none)'}`);

    // Check if file exists
    if (!fs.existsSync(update.filePath)) {
      console.log(`  ❌ File not found: ${update.filePath}`);
      continue;
    }

    // Upload to Cloudinary
    const publicId = `avatar_${member.id}`;
    console.log(`  📤 Uploading to Cloudinary...`);
    const url = await uploadToCloudinary(update.filePath, publicId);

    // Update database
    await prisma.member.update({
      where: { id: member.id },
      data: { avatar: url },
    });

    console.log(`  ✅ Database updated with new avatar URL`);
  }

  await prisma.$disconnect();
  console.log('\n🎉 Done!');
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
