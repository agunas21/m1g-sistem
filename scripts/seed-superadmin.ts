import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'kurucu@m1g.org.tr'
    const password = 'm1gsuper'

    const existingAdmin = await prisma.member.findUnique({
        where: { email }
    })

    if (existingAdmin) {
        console.log('Super admin already exists. Updating password...')
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.member.update({
            where: { email },
            data: { password: hashedPassword, isSuperAdmin: true, status: 'Aktif' }
        })
        console.log('Password updated.')
        return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.member.create({
        data: {
            id: randomUUID(),
            kimlikToken: randomUUID(),
            fullName: 'M1G Yönetici',
            email: email,
            password: hashedPassword,
            status: 'Aktif',
            memberType: 'GHOST',
            isSuperAdmin: true,
            isAdmin: true,
            phone: '0000000000',
        }
    })

    console.log('Ghost Super Admin created successfully.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
