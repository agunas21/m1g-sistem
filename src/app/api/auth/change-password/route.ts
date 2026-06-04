import { NextResponse } from 'next/server';
import { hashPassword, comparePassword } from '@/lib/crypto';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { userId, currentPassword, newPassword } = await req.json();

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
        }
        if (newPassword.length < 6 || newPassword.length > 100) {
            return NextResponse.json({ error: 'Yeni şifre en az 6, en fazla 100 karakter olmalıdır.' }, { status: 400 });
        }

        const member = await prisma.member.findUnique({ where: { id: userId } });
        
        if (!member) {
            return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 });
        }

        const storedPassword = member.password || member.tcNo || member.id;

        let passwordValid = false;
        if (storedPassword && storedPassword.includes(':')) {
            passwordValid = comparePassword(currentPassword, storedPassword);
        } else {
            if (currentPassword === storedPassword) {
                passwordValid = true;
            }
        }

        if (!passwordValid) {
            return NextResponse.json({ error: 'Mevcut şifre hatalı.' }, { status: 401 });
        }

        // Güvenli şekilde hashle ve kaydet
        await prisma.member.update({
            where: { id: userId },
            data: { 
                password: hashPassword(newPassword),
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
    } catch {
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
