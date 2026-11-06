import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/mailer';
import { verifyJwt } from '@/lib/crypto';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Yetkisiz erişim: Oturum açmalısınız.' }, { status: 401 });
        }
        const user = verifyJwt(token);
        if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
            return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
        }

        const body = await request.json();
        const { emails, subject, message } = body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'Geçerli bir e-posta listesi belirtilmedi.' }, { status: 400 });
        }

        if (!subject || !message) {
            return NextResponse.json({ error: 'Konu ve mesaj alanları zorunludur.' }, { status: 400 });
        }

        // Gönderim sonuçları
        const results = {
            successCount: 0,
            failedCount: 0,
            errors: [] as string[]
        };

        // Promise.all ile paralel (ama limitli gönderim SMTP sunucusunu yormamak için for ile yapılabilir)
        // Şimdilik sıralı atalım (toplu gönderimde limitlere takılmamak için basit bekleme de eklenebilir)
        for (const email of emails) {
            if (!email || typeof email !== 'string' || !email.includes('@')) continue;
            
            const result = await sendEmail(
                email, 
                subject, 
                'customMail', 
                [subject, message]
            );

            if (result.success) {
                results.successCount++;
            } else {
                results.failedCount++;
                results.errors.push(`${email}: ${result.error}`);
            }
        }

        return NextResponse.json({
            message: `${results.successCount} adet e-posta başarıyla gönderildi.`,
            results
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
