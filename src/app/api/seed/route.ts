import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';

export async function GET() {
    const email = 'kurucu@m1g.org.tr'
    const password = 'm1gsuper'

    try {
        const existingAdmin = await prisma.member.findUnique({
            where: { email }
        })

        if (existingAdmin) {
            const hashedPassword = await bcrypt.hash(password, 10)
            await prisma.member.update({
                where: { email },
                data: { password: hashedPassword, isSuperAdmin: true, status: 'Aktif' }
            })
            return NextResponse.json({ message: 'Password updated for existing super admin.' })
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

        return NextResponse.json({ message: 'Ghost Super Admin created successfully.' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
