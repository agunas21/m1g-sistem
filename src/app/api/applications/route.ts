import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { checkRateLimit, RATE_APPLY } from '@/lib/rateLimit';
import { checkSpam } from '@/lib/spamFilter';
import { writeLog } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/crypto';
import { randomBytes } from 'crypto';


export const dynamic = 'force-dynamic';
async function readJSON(key: string, fallback: any = []) {
    return await getCollectionDB(key);
}

async function writeJSON(key: string, data: any) {
    await writeCollectionDB(key, data);
}

// ─── GET: Tüm başvuruları getir ─────────────────────────────────────────
export async function GET() {
    return NextResponse.json(await readJSON('global_applications'));
}

// ─── POST: Yeni başvuru kaydet + Onay kuyruğuna ekle ────────────────────
export async function POST(req: Request) {
    try {
        // IP tespiti
        const ip =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Rate limit: 3 başvuru / saat (aynı IP'den)
        const rateResult = checkRateLimit(
            `apply:${ip}`,
            RATE_APPLY.limit,
            RATE_APPLY.windowMs,
            RATE_APPLY.blockMs
        );
        if (!rateResult.allowed) {
            const retryMin = Math.ceil((rateResult.retryAfter || RATE_APPLY.blockMs) / 60000);
            writeLog('WARN', ip, 'Spam — Başvuru Formu', 'Rate limit aşıldı', { ip });
            return NextResponse.json(
                { error: `Çok fazla başvuru gönderdiniz. ${retryMin} dakika sonra tekrar deneyin.` },
                { status: 429, headers: { 'Retry-After': String(retryMin * 60) } }
            );
        }

        const body = await req.json();

        // ── Spam Kontrolü ──────────────────────────────────────────────────

        // 1. Honeypot alanı (formda hidden input "_hp" olmalı — botlar doldurur)
        if (body._hp && body._hp.trim() !== '') {
            writeLog('WARN', ip, 'Spam — Bot Algılandı (honeypot)', body.isim || 'Bilinmeyen', { ip });
            // Bota başarılı gibi göster ama kaydetme
            return NextResponse.json({ success: true, id: Date.now() });
        }

        // 2. Zamanlama kontrolü (formOpenedAt gönderilmişse)
        if (body._formOpenedAt) {
            const elapsed = (Date.now() - Number(body._formOpenedAt)) / 1000;
            if (elapsed < 3) {
                writeLog('WARN', ip, 'Spam — Hızlı Gönderim (bot şüphesi)', body.isim || 'Bilinmeyen', { elapsed, ip });
                return NextResponse.json({ success: true, id: Date.now() }); // Bota sessiz reddet
            }
        }

        // 3. İçerik analizi (deneyim notu, motivasyon metni)
        const textToCheck = [
            body.deneyim_notu || '',
            body.motivasyon || '',
            body.mesaj || '',
        ].join(' ');

        const spamResult = checkSpam({
            text: textToCheck,
            submittedAt: body._formOpenedAt ? Number(body._formOpenedAt) : Date.now() - 10000,
            ip,
        });

        if (spamResult.isSpam) {
            writeLog('WARN', ip, 'Spam — İçerik Filtresi', body.isim || 'Bilinmeyen', {
                score: spamResult.score,
                reason: spamResult.reason,
                ip
            });
            return NextResponse.json(
                { error: 'Başvurunuz spam filtresi tarafından engellendi. Lütfen içeriği gözden geçirin.' },
                { status: 400 }
            );
        }

        // ── Honeypot ve spam alanlarını temizle ────────────────────────────
        const { _hp, _formOpenedAt, ...cleanBody } = body;

        // ── Kaydet ────────────────────────────────────────────────────────
        const applications = await readJSON('global_applications');
        const approvals    = await readJSON('global_approvals');

        const newApp = {
            id:          Date.now(),
            ...cleanBody,
            status:      'pending',
            submittedAt: new Date().toISOString(),
            submitterIp: ip,
        };

        // 1) global_applications'a kaydet
        applications.unshift(newApp);
        await writeJSON('global_applications', applications);

        // 2) Admin onay kuyruğuna da ekle
        const approvalEntry = {
            id:            Date.now() + 1,
            type:          'volunteer_application',
            applicationId: newApp.id,
            memberName:    `${cleanBody.isim} ${cleanBody.soyisim}`,
            memberId:      null,
            changes:       cleanBody,
            status:        'pending',
            createdAt:     new Date().toISOString(),
        };
        approvals.unshift(approvalEntry);
        await writeJSON('global_approvals', approvals);

        writeLog('SUCCESS', ip, 'Gönüllü Başvurusu', `${cleanBody.isim} ${cleanBody.soyisim}`, { id: newApp.id });

        return NextResponse.json({ success: true, id: newApp.id });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 });
    }
}

// ─── PATCH: Başvuruyu onayla / reddet ────────────────────────────────────
export async function PATCH(req: Request) {
    try {
        const { id, status, approvalId } = await req.json();

        // 1) global_applications'da güncelle
        let applications = await readJSON('global_applications');
        const appIdx = applications.findIndex((a: any) => a.id === id);
        if (appIdx === -1) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

        applications[appIdx].status = status;
        applications[appIdx].resolvedAt = new Date().toISOString();
        await writeJSON('global_applications', applications);

        // 2) Onay kuyruğunu güncelle
        let approvals = await readJSON('global_approvals');
        approvals = approvals.map((a: any) =>
            a.id === approvalId ? { ...a, status, resolvedAt: new Date().toISOString() } : a
        );
        await writeJSON('global_approvals', approvals);

        // 3) ONAYLANDIYSA: DB'ye otomatik üye olarak ekle
        if (status === 'approved') {
            const app = applications[appIdx];

            const tempPassword = randomBytes(8).toString('hex');
            const hashedPassword = hashPassword(tempPassword);

            const newMember = await prisma.member.create({
                data: {
                    fullName:     `${app.isim} ${app.soyisim}`,
                    email:        app.email,
                    phone:        app.telefon,
                    role:         'Gönüllü',
                    status:       'Aktif',
                    joinDate:     new Date(),
                    password:     hashedPassword,
                    avatar:       '',
                }
            });

            return NextResponse.json({ success: true, newMemberId: newMember.id });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    }
}
