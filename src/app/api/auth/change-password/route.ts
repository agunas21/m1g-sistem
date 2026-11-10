import { NextResponse } from 'next/server';
import { hashPassword, comparePassword, verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Yetkisiz erişim: Oturum açmalısınız.' }, { status: 401 });
        }

        const { userId, currentPassword, newPassword } = await req.json();

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
        }
        if (payload.id !== userId && !payload.isAdmin && !payload.isSuperAdmin) {
            return NextResponse.json({ error: 'Başka bir kullanıcının şifresini değiştirme yetkiniz yok.' }, { status: 403 });
        }
        if (newPassword.length < 8 || newPassword.length > 100) {
            return NextResponse.json({ error: 'Yeni şifre en az 8, en fazla 100 karakter olmalıdır.' }, { status: 400 });
        }

        const member = await prisma.member.findUnique({ where: { id: userId } });
        
        if (!member) {
            return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 });
        }

        const storedPassword = member.password || '';

        let passwordValid = false;
        if (storedPassword && storedPassword.includes(':')) {
            passwordValid = comparePassword(currentPassword, storedPassword);
        } else if (storedPassword.length > 0) {
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
