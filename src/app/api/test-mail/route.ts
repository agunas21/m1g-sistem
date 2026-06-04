import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request) {
    try {
        const { testEmail } = await req.json();
        const to = testEmail || process.env.SMTP_USER;

        if (!to) {
            return NextResponse.json({ error: 'Test e-posta adresi bulunamadı.' }, { status: 400 });
        }

        const result = await sendEmail(
            to,
            'M1G SMTP Test - Bağlantı Başarılı ✅',
            'notification',
            [
                'M1G SMTP Bağlantı Testi',
                `Bu e-posta, M1G yönetim panelinden gönderilen bir SMTP test mesajıdır.\n\nSMTP Sunucusu: ${process.env.SMTP_HOST}\nPort: ${process.env.SMTP_PORT}\nGönderen: ${process.env.SMTP_USER}\n\nBu mesajı aldıysanız, e-posta sistemi sorunsuz çalışıyor demektir. 🎉`
            ]
        );

        if (result.success) {
            return NextResponse.json({ success: true, message: `Test maili başarıyla gönderildi → ${to}` });
        } else {
            return NextResponse.json({ error: `SMTP Hatası: ${result.error}` }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Bilinmeyen hata.' }, { status: 500 });
    }
}
