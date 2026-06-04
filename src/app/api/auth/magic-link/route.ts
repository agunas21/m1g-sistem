/**
 * M1G — Magic Link Authentication API
 *
 * POST /api/auth/magic-link  → e-posta gönder
 * GET  /api/auth/magic-link?token=xxx → token doğrula, session oluştur
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMagicToken, verifyMagicToken, buildMagicLinkUrl } from '@/lib/magicLink';
import { signJwt } from '@/lib/crypto';
import { logAudit, extractIp } from '@/lib/auditLog';
import { checkRateLimit, RATE_LOGIN } from '@/lib/rateLimit';


export const dynamic = 'force-dynamic';
// ── POST: Magic Link Gönder ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const ip = extractIp(req.headers);

    // Rate limit: aynı IP 5 dakikada 3 istek
    const rl = checkRateLimit(`magic:${ip}`, 3, 5 * 60 * 1000, 15 * 60 * 1000);
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Çok fazla istek. Lütfen 15 dakika sonra tekrar deneyin.' },
            { status: 429 }
        );
    }

    let body: { email?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }

    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
    }

    // Kullanıcıyı bul — bulunamazsa güvenlik için aynı yanıtı dön (timing attack önlemi)
    const member = await prisma.member.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (member) {
        const token = await createMagicToken(email, member.id);
        const loginUrl = buildMagicLinkUrl(token);

        // E-posta asenkron gönder — response'u bloklamaz
        setImmediate(async () => {
            try {
                const { sendEmail } = await import('@/lib/mailer');
                await sendEmail(
                    email,
                    'M1G — Giriş Bağlantınız',
                    'magicLink',
                    [member.fullName || 'Değerli Üye', loginUrl, 5]
                );
            } catch (err) {
                console.error('[MagicLink] E-posta gönderilemedi:', err);
            }
        });

        // Audit log
        logAudit({
            actorId: member.id,
            action: 'MAGIC_LINK_REQUEST',
            actorIp: ip,
            actorEmail: email,
            targetMemberId: member.id,
        });
    }

    // Kullanıcı var/yok ayrımı yapma (güvenlik)
    return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta sistemde kayıtlıysa, 5 dakika geçerli bir giriş bağlantısı gönderildi.',
    });
}

// ── GET: Token Doğrula & Session Oluştur ─────────────────────────────────────

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token || token.length !== 64) {
        return NextResponse.redirect(
            new URL('/login?error=invalid_token', req.url)
        );
    }

    const entry = await verifyMagicToken(token);

    if (!entry) {
        return NextResponse.redirect(
            new URL('/login?error=expired_or_used', req.url)
        );
    }

    // Kullanıcıyı doğrula
    const member = await prisma.member.findUnique({
        where: { id: entry.memberId }
    });

    if (!member) {
        return NextResponse.redirect(
            new URL('/login?error=user_not_found', req.url)
        );
    }

    // Banlı kullanıcı kontrolü
    if (member.status === 'banned') {
        return NextResponse.redirect(
            new URL('/login?error=banned', req.url)
        );
    }

    const isAdmin = member.isAdmin === true ||
        member.role === 'Superadmin' ||
        member.role === 'Yönetim Kurulu Başkanı' ||
        member.isSuperAdmin === true ||
        member.email?.toLowerCase() === (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();

    const sessionToken = signJwt({
        sub: member.id,
        email: member.email,
        name: member.fullName,
        role: member.role || 'Gönüllü',
        isAdmin,
        kimlikToken: member.kimlikToken,
        loginMethod: 'magic_link',
    });

    const ip = extractIp(req.headers);

    // Audit log
    logAudit({
        actorId: member.id,
        actorEmail: member.email,
        actorRole: member.memberType,
        actorIp: ip,
        action: 'MAGIC_LINK_USED',
        targetMemberId: member.id,
    });

    // Session cookie set et
    const response = NextResponse.redirect(
        new URL(isAdmin ? '/admin' : '/portal', req.url)
    );

    response.cookies.set('m1g_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 saat
        path: '/',
    });

    return response;
}
