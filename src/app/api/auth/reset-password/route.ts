import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/crypto';
import { logAudit, extractIp } from '@/lib/auditLog';
import { prisma } from '@/lib/prisma';

// In-memory rate limiter
const ipAttempts = new Map<string, { count: number, blockedUntil: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const attempt = ipAttempts.get(ip) || { count: 0, blockedUntil: 0 };
    if (attempt.blockedUntil > 0 && attempt.blockedUntil < now) { attempt.count = 0; attempt.blockedUntil = 0; }
    if (attempt.blockedUntil > now) return false;
    attempt.count += 1;
    if (attempt.count > 5) attempt.blockedUntil = now + 15 * 60 * 1000;
    ipAttempts.set(ip, attempt);
    return true;
}

// POST: Sıfırlama talebi gönder
export async function POST(req: Request) {
    try {
        const ip = extractIp(req.headers as any);
        if (!checkRateLimit(ip)) {
            return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. 15 dakika sonra tekrar deneyin.' }, { status: 429 });
        }

        const { email } = await req.json();
        if (!email || email.length > 100) return NextResponse.json({ error: 'Geçerli bir e-posta adresi gerekli.' }, { status: 400 });

        const member = await prisma.member.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (!member) {
            // Güvenlik: gerçekte bulunamadı ama kullanıcıya söyleme
            return NextResponse.json({ success: true, message: 'Eğer bu e-posta sistemde kayıtlıysa, sıfırlama bağlantısı gönderildi.' });
        }

        // Güvenli kriptografik token
        const token = randomBytes(32).toString('hex'); // 64 char hex, kriptografik
        
        await prisma.member.update({
            where: { id: member.id },
            data: {
                resetToken: token,
                resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 dakika
            }
        });

        // Audit log (async)
        logAudit({
            actorId: member.id,
            actorEmail: member.email,
            actorIp: ip,
            action: 'RESET_PASSWORD',
            targetMemberId: member.id,
        });

        // SMTP ile mail gönder
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

        try {
            const { sendEmail } = await import('@/lib/mailer');
            await sendEmail(member.email, 'M1G Arama Kurtarma — Şifre Sıfırlama Talebi', 'resetPassword', [member.fullName, resetLink]);
        } catch (err) {
            console.error("Mail gönderim modülü yüklenemedi:", err);
        }

        return NextResponse.json({
            success: true,
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
        });
    } catch {
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// PATCH: Token ile şifre sıfırla
export async function PATCH(req: Request) {
    try {
        const { token, newPassword } = await req.json();
        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token ve yeni şifre gerekli.' }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' }, { status: 400 });
        }

        const member = await prisma.member.findFirst({
            where: { resetToken: token }
        });
        
        if (!member) {
            return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı.' }, { status: 400 });
        }

        if (member.resetTokenExpiry && new Date(member.resetTokenExpiry) < new Date()) {
            return NextResponse.json({ error: 'Sıfırlama bağlantısının süresi dolmuş. Lütfen tekrar talep edin.' }, { status: 400 });
        }

        // Yeni şifreyi güvenli hash olarak kaydet
        await prisma.member.update({
            where: { id: member.id },
            data: {
                password: hashPassword(newPassword),
                passwordChangedAt: new Date(),
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return NextResponse.json({ success: true, message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
    } catch {
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
