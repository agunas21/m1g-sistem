/**
 * M1G — Login API (Güvenlik Hardened)
 *
 * Değişiklikler:
 * - Super Admin artık .env'den okunuyor (hardcoded kaldırıldı)
 * - ADMIN_IDS hardcoded listesi kaldırıldı (üye verisinden alınıyor)
 * - MFA (TOTP) 2 aşamalı giriş desteği
 * - SameSite=Strict cookie
 * - Audit Log entegrasyonu
 * - Timing-safe karşılaştırma korundu
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { timingSafeEqual, scrypt } from 'crypto';
import { cookies } from 'next/headers';
import { signJwt, comparePassword, hashPassword } from '@/lib/crypto';
import { checkRateLimit, RATE_LOGIN } from '@/lib/rateLimit';
import { writeLog } from '@/lib/logger';
import { logAudit, extractIp } from '@/lib/auditLog';
import { canAccessAdmin, isSuperAdmin as checkSuperAdmin } from '@/lib/rbac';

import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Super Admin bilgileri .env'den (artık kaynak kodda yok)
const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
const SUPER_ADMIN_PASS_HASH = process.env.SUPER_ADMIN_PASS_HASH || '';

/**
 * .env'deki scrypt hash'ini doğrular.
 * Format: scrypt:salt:hash
 */
async function verifySuperAdminPassword(password: string): Promise<boolean> {
    if (!SUPER_ADMIN_PASS_HASH) return false;
    const parts = SUPER_ADMIN_PASS_HASH.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, expectedHex] = parts;
    return new Promise((resolve) => {
        scrypt(password, salt, 64, (err, derived) => {
            if (err) return resolve(false);
            try {
                const expected = Buffer.from(expectedHex, 'hex');
                resolve(timingSafeEqual(derived, expected));
            } catch {
                resolve(false);
            }
        });
    });
}

export async function POST(req: NextRequest) {
    try {
        const ip = extractIp(req.headers);

        // Rate limit (sliding window)
        const rateResult = checkRateLimit(
            `login:${ip}`,
            RATE_LOGIN.limit,
            RATE_LOGIN.windowMs,
            RATE_LOGIN.blockMs
        );

        if (!rateResult.allowed) {
            const retryAfterSec = Math.ceil((rateResult.retryAfter || RATE_LOGIN.blockMs) / 1000);
            writeLog('WARN', ip, 'Rate Limit — Login', 'Brute-force girişimi engellendi', { ip });
            logAudit({ actorId: ip, actorIp: ip, action: 'LOGIN_FAILED', details: { reason: 'rate_limit' } });
            return NextResponse.json(
                { error: `Çok fazla başarısız deneme. Lütfen ${Math.ceil(retryAfterSec / 60)} dakika bekleyin.` },
                { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
            );
        }

        const body = await req.json();
        const { identifier, password, totpCode, tempToken } = body;

        // ── Aşama 2: MFA Doğrulama ──────────────────────────────────────────
        // tempToken varsa bu bir MFA tamamlama isteğidir
        if (tempToken && totpCode) {
            return await handleMfaStep(tempToken, totpCode, ip, req);
        }

        // ── Aşama 1: Şifre Doğrulama ────────────────────────────────────────
        if (!identifier || !password) {
            return NextResponse.json({ error: 'Giriş bilgilerini eksiksiz girin.' }, { status: 400 });
        }

        if (identifier.length > 100 || password.length > 200) {
            return NextResponse.json({ error: 'Geçersiz girdi.' }, { status: 400 });
        }

        const id = identifier.trim().toLowerCase();

        // Super Admin kontrolü (.env'den)
        if (SUPER_ADMIN_EMAIL && id === SUPER_ADMIN_EMAIL) {
            const valid = await verifySuperAdminPassword(password);
            if (!valid) {
                logAudit({ actorId: 'super-admin', actorIp: ip, action: 'LOGIN_FAILED', details: { reason: 'bad_password' } });
                return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
            }

            const superAdminPayload = {
                sub: 'super-admin',
                uid: 'super-admin',
                id: 'super-admin',
                email: SUPER_ADMIN_EMAIL,
                name: 'Sistem Yöneticisi',
                fullName: 'Sistem Yöneticisi',
                role: 'super_admin',
                isAdmin: true,
                isSuperAdmin: true,
                loginMethod: 'password',
            };

            const token = signJwt(superAdminPayload);
            await setSessionCookie(token);

            logAudit({ actorId: 'super-admin', actorEmail: SUPER_ADMIN_EMAIL, actorIp: ip, action: 'LOGIN_SUCCESS', details: { role: 'super_admin' } });
            writeLog('SUCCESS', 'super-admin', 'Super Admin Girişi', SUPER_ADMIN_EMAIL, { ip });

            return NextResponse.json({ success: true, user: superAdminPayload });
        }

        // Normal üye ara (TC / E-posta / Telefon / ID ile)
        const member = await prisma.member.findFirst({
            where: {
                OR: [
                    { id: id },
                    { email: id },
                    { phone: id },
                    { tcNo: id }
                ]
            }
        });

        if (!member) {
            // Timing attack koruması
            await new Promise(r => setTimeout(r, 200 + Math.random() * 100));
            logAudit({ actorId: id, actorIp: ip, action: 'LOGIN_FAILED', details: { reason: 'user_not_found' } });
            writeLog('WARN', ip, 'Başarısız Giriş', identifier, { reason: 'Üye bulunamadı' });
            return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
        }

        // Ban / Pasif kontrolü
        if (member.status === 'Banlı') {
            logAudit({ actorId: member.id, actorIp: ip, action: 'LOGIN_FAILED', details: { reason: 'banned' } });
            return NextResponse.json({
                error: `Hesabınız askıya alınmıştır.${member.banReason ? ' Sebep: ' + member.banReason : ''}`
            }, { status: 403 });
        }
        if (member.status === 'Pasif') {
            return NextResponse.json({ error: 'Üyeliğiniz pasif durumda.' }, { status: 403 });
        }

        // Şifre doğrulama
        const memberPassword = member.password || member.tcNo || member.id;
        let passwordValid = false;
        let needsUpgrade = false;

        if (memberPassword.startsWith('scrypt:') || memberPassword.includes(':')) {
            passwordValid = comparePassword(password, memberPassword);
        } else {
            if (password === memberPassword) {
                passwordValid = true;
                needsUpgrade = true;
            }
        }

        if (!passwordValid) {
            logAudit({ actorId: member.id, actorIp: ip, action: 'LOGIN_FAILED', details: { reason: 'bad_password' } });
            writeLog('WARN', ip, 'Başarısız Giriş', member.fullName, { reason: 'Hatalı şifre' });
            return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
        }

        // Şifreyi hash'e yükselt
        if (needsUpgrade) {
            await prisma.member.update({
                where: { id: member.id },
                data: { password: hashPassword(password) }
            });
        }

        // MFA aktif mi? → 2. aşamaya yönlendir
        if (member.totpEnabled && member.totpSecret) {
            // Geçici token (15 dk geçerli, sadece MFA tamamlama için)
            const tempToken = signJwt({
                sub: member.id,
                email: member.email,
                mfaPending: true,
                role: member.memberType,
            }, 15 * 60); // 15 dakika

            return NextResponse.json({
                success: false,
                mfaRequired: true,
                tempToken,
                message: 'Authenticator uygulamanızdaki 6 haneli kodu girin.',
            });
        }

        // MFA yok → doğrudan giriş
        return await completeLogin(member, ip, needsUpgrade);

    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}

// ── MFA Doğrulama Aşaması ─────────────────────────────────────────────────────

async function handleMfaStep(tempToken: string, totpCode: string, ip: string, req: NextRequest) {
    const { verifyJwt } = await import('@/lib/crypto');
    const { verifyTotp, verifyAndConsumeBackupCode } = await import('@/lib/totp');

    const payload = verifyJwt(tempToken);
    if (!payload || !payload.mfaPending) {
        return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş oturum.' }, { status: 401 });
    }

    const member = await prisma.member.findUnique({ where: { id: payload.sub } });
    if (!member) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    let valid = false;

    // 6 haneli TOTP kodu mu?
    if (/^\d{6}$/.test(totpCode.trim())) {
        valid = verifyTotp(totpCode, member.totpSecret || '');
    } else {
        // Yedek kod dene (Prisma json array'i olarak saklıyor, ama burada şimdilik atlıyoruz ya da basit kontrol ediyoruz)
        valid = false;
    }

    if (!valid) {
        logAudit({ actorId: payload.sub, actorIp: ip, action: 'LOGIN_MFA_FAILED' });
        return NextResponse.json({ error: 'Geçersiz doğrulama kodu.' }, { status: 401 });
    }

    logAudit({ actorId: payload.sub, actorIp: ip, action: 'LOGIN_MFA_SUCCESS' });
    return await completeLogin(member, ip, false);
}

// ── Giriş Tamamla ─────────────────────────────────────────────────────────────

async function completeLogin(member: any, ip: string, _needsUpgrade: boolean) {
    // lastLogin güncelle
    await prisma.member.update({
        where: { id: member.id },
        data: { lastLogin: new Date() }
    });

    // Yetki belirleme (üye verisinden — hardcoded liste yok)
    const isAdmin = member.isAdmin === true || member.memberType === 'Lojistik Sorumlusu' ||
        ['Yönetim Kurulu Başkanı', 'Başkan Yardımcısı', 'Genel Sekreter', 'Sayman',
         'Yönetim Kurulu Üyesi', 'Denetim Kurulu Başkanı', 'Denetim Kurulu Üyesi',
         'Disiplin Kurulu Başkanı', 'Disiplin Kurulu Üyesi'].includes(member.memberType || '');

    const userPayload = {
        sub:      member.id,
        uid:      member.id,
        id:       member.id,
        email:    member.email || `${member.id}@m1g.org.tr`,
        name:     member.fullName,
        fullName: member.fullName,
        phone:    member.phone,
        isAdmin,
        isSuperAdmin: member.isSuperAdmin === true,
        role:     member.memberType || 'Gönüllü',
        status:   member.status,
        hasMfa:   !!member.totpEnabled,
        kimlikToken: member.kimlikToken,
        loginMethod: 'password',
    };

    const token = signJwt(userPayload);
    await setSessionCookie(token);

    logAudit({
        actorId: member.id,
        actorEmail: member.email,
        actorRole: member.memberType,
        actorIp: ip,
        action: 'LOGIN_SUCCESS',
        details: { role: userPayload.role, hasMfa: userPayload.hasMfa }
    });
    writeLog('SUCCESS', member.id, 'Başarılı Giriş', member.fullName, { ip, role: userPayload.role });

    return NextResponse.json({ success: true, user: userPayload });
}

// ── Cookie Helper ─────────────────────────────────────────────────────────────

async function setSessionCookie(token: string) {
    (await cookies()).set('m1g_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',   // CSRF koruması
        maxAge: 8 * 60 * 60,  // 8 saat
        path: '/',
    });
}
