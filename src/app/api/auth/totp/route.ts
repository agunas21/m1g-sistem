/**
 * M1G — TOTP / MFA API
 *
 * POST /api/auth/totp/setup   → Secret üret, QR URL ver
 * POST /api/auth/totp/verify  → Kodu doğrula, MFA'yı aktif et
 * POST /api/auth/totp/disable → MFA'yı devre dışı bırak (admin onayı)
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { generateTotpSetup, verifyTotp, hashBackupCode, verifyAndConsumeBackupCode, encryptSecret } from '@/lib/totp';
import { logAudit, extractIp } from '@/lib/auditLog';
import QRCode from 'qrcode';

import { prisma } from '@/lib/prisma';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return null;
    return verifyJwt(token);
}

// ── POST: İşlem Yönlendirici ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'setup') return handleSetup(req);
    if (action === 'verify') return handleVerify(req);
    if (action === 'disable') return handleDisable(req);

    return NextResponse.json({ error: 'Geçersiz action parametresi.' }, { status: 400 });
}

// ── Setup: Secret Üret ────────────────────────────────────────────────────────

async function handleSetup(req: NextRequest) {
    const actor = await getAuthenticatedUser();
    if (!actor) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const member = await prisma.member.findUnique({
        where: { id: actor.sub }
    });
    
    if (!member) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    // TOTP zaten aktifse kurulumu engelle
    if (member.totpEnabled && member.totpSecret) {
        return NextResponse.json({
            error: 'MFA zaten aktif. Önce mevcut MFA\'yı devre dışı bırakın.'
        }, { status: 409 });
    }

    const setup = generateTotpSetup(member.email || `${member.id}@m1g.org.tr`, member.id);

    // QR kod PNG base64 üret (kullanıcının Authenticator uygulamasıyla taraması için)
    const qrCodeDataUrl = await QRCode.toDataURL(setup.otpauthUrl, {
        width: 300,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
    });

    // Geçici pending secret kaydet (henüz aktif değil)
    const pendingBackupCodes = setup.backupCodes.map(code => ({
        hash: hashBackupCode(code),
        used: false,
    }));
    
    await prisma.member.update({
        where: { id: member.id },
        data: {
            totpPendingSecret: setup.encryptedSecret,
            totpBackupCodes: pendingBackupCodes as any
        }
    });

    return NextResponse.json({
        success: true,
        qrCodeDataUrl,
        secret: setup.secret, // Kullanıcı manual da girebilsin
        backupCodes: setup.backupCodes,
        message: 'QR kodu Authenticator uygulamanızla tarayın, ardından doğrulama kodu girin.',
    });
}

// ── Verify: Kodu Doğrula, MFA Aktif Et ───────────────────────────────────────

async function handleVerify(req: NextRequest) {
    const actor = await getAuthenticatedUser();
    if (!actor) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const { totpCode } = await req.json();
    if (!totpCode || !/^\d{6}$/.test(totpCode.trim())) {
        return NextResponse.json({ error: '6 haneli TOTP kodu gereklidir.' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
        where: { id: actor.sub }
    });
    
    if (!member) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    const ip = extractIp(req.headers);

    if (!member.totpPendingSecret) {
        return NextResponse.json({ error: 'Önce setup adımını tamamlayın.' }, { status: 400 });
    }

    // TOTP kodu doğru mu?
    if (!verifyTotp(totpCode, member.totpPendingSecret)) {
        logAudit({
            actorId: actor.sub,
            actorEmail: member.email,
            actorRole: member.memberType,
            actorIp: ip,
            action: 'LOGIN_MFA_FAILED',
            details: { context: 'totp_setup_verify' }
        });
        return NextResponse.json({ error: 'Geçersiz TOTP kodu. Tekrar deneyin.' }, { status: 400 });
    }

    // MFA aktif et
    await prisma.member.update({
        where: { id: member.id },
        data: {
            totpEnabled: true,
            totpSecret: member.totpPendingSecret,
            totpPendingSecret: null
        }
    });

    // Audit log
    logAudit({
        actorId: actor.sub,
        actorEmail: member.email,
        actorRole: member.memberType,
        actorIp: ip,
        action: 'MFA_SETUP',
        targetMemberId: actor.sub,
    });

    // E-posta bildirimi (asenkron)
    setImmediate(async () => {
        try {
            const { sendEmail } = await import('@/lib/mailer');
            await sendEmail(
                member.email,
                'M1G — İki Faktörlü Doğrulama Etkinleştirildi',
                'totpSetup',
                [member.fullName || 'Değerli Üye', process.env.TOTP_ISSUER || 'M1G']
            );
        } catch {}
    });

    return NextResponse.json({
        success: true,
        message: 'İki faktörlü kimlik doğrulama başarıyla etkinleştirildi! Yedek kodlarınızı güvenli bir yerde saklayın.',
    });
}

// ── Disable: MFA Kapat ────────────────────────────────────────────────────────

async function handleDisable(req: NextRequest) {
    const actor = await getAuthenticatedUser();
    if (!actor) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    const { totpCode, backupCode } = await req.json();
    const ip = extractIp(req.headers);

    const member = await prisma.member.findUnique({
        where: { id: actor.sub }
    });
    
    if (!member) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    if (!member.totpEnabled) {
        return NextResponse.json({ error: 'MFA zaten devre dışı.' }, { status: 400 });
    }

    // TOTP kodu veya yedek kod ile doğrulama
    let verified = false;

    if (totpCode && member.totpSecret && /^\d{6}$/.test(totpCode.trim())) {
        verified = verifyTotp(totpCode, member.totpSecret);
    } else if (backupCode) {
        const backupCodes = (member.totpBackupCodes as any) || [];
        const codeIdx = verifyAndConsumeBackupCode(backupCode, backupCodes);
        if (codeIdx !== -1) {
            backupCodes[codeIdx].used = true;
            verified = true;
        }
    }

    if (!verified) {
        return NextResponse.json({ error: 'Geçersiz TOTP kodu veya yedek kod.' }, { status: 400 });
    }

    // MFA devre dışı bırak
    const newBackupCodes = (member.totpBackupCodes as any[]) || [];
    
    await prisma.member.update({
        where: { id: member.id },
        data: {
            totpEnabled: false,
            totpSecret: null,
            totpPendingSecret: null,
            totpBackupCodes: newBackupCodes
        }
    });

    logAudit({
        actorId: actor.sub,
        actorEmail: member.email,
        actorRole: member.memberType,
        actorIp: ip,
        action: 'MFA_DISABLED',
        targetMemberId: actor.sub,
    });

    return NextResponse.json({ success: true, message: 'MFA devre dışı bırakıldı.' });
}
