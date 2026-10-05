require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'm1g-aes-encryption-key-2026-sec!';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

function encryptField(plaintext) {
    if (!plaintext) return plaintext;
    if (plaintext.startsWith('aes256gcm:')) return plaintext;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `aes256gcm:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptField(ciphertext) {
    if (!ciphertext) return ciphertext;
    if (!ciphertext.startsWith('aes256gcm:')) return ciphertext;
    try {
        const raw = ciphertext.slice('aes256gcm:'.length);
        const parts = raw.split(':');
        if (parts.length !== 3) return ciphertext;
        const [ivHex, authTagHex, encHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encData = Buffer.from(encHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encData), decipher.final()]);
        return decrypted.toString('utf8');
    } catch(e) {
        return 'DECRYPT_ERROR: ' + e.message;
    }
}

async function run() {
  const targetTC = '33790138486';
  const encryptedTC = encryptField(targetTC);

  console.log('Finding Beylün Serdaroğlu...');
  const members = await prisma.member.findMany();
  const beylun = members.find(m => m.fullName.toLowerCase().includes('beyl') || m.fullName.toLowerCase().includes('serdar'));

  if (!beylun) {
    console.error('Beylün Serdaroğlu not found in database!');
    return;
  }

  console.log('Found member:', beylun.fullName, '(ID:', beylun.id, ')');
  console.log('Current TC No (raw):', beylun.tcNo);
  console.log('Current TC No (decrypted):', decryptField(beylun.tcNo));

  const updated = await prisma.member.update({
    where: { id: beylun.id },
    data: {
      tcNo: encryptedTC
    }
  });

  console.log('Successfully updated TC No!');
  console.log('New TC No (raw in DB):', updated.tcNo);
  console.log('New TC No (decrypted):', decryptField(updated.tcNo));
}

run().catch(console.error).finally(() => prisma.$disconnect());
