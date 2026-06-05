const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}

async function main() {
    const email = 'info@m1g.org.tr';
    const password = 'M1garama kurtarma2025';
    
    console.log('Seeding database...');
    
    const existingAdmin = await prisma.member.findUnique({
        where: { email }
    });
    
    if (existingAdmin) {
        console.log('Admin already exists.');
    } else {
        await prisma.member.create({
            data: {
                email,
                fullName: 'M1G Yönetici',
                password: hashPassword(password),
                role: 'ADMIN',
                status: 'ACTIVE',
                bloodType: 'A+',
                tcNo: null,
                phone: null,
                gender: 'Erkek',
                kimlikToken: crypto.randomBytes(8).toString('hex')
            }
        });
        console.log('Admin user created successfully.');
    }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
