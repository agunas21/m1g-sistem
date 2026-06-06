import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: Request) {
    try {
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
