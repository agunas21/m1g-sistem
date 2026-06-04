/**
 * M1G — PII Reveal API
 *
 * POST /api/members/reveal
 * Body: { memberId: string, field: 'tcNo' | 'phone' | 'email' }
 *
 * Gerçek değeri döner + audit log yazar.
 * Super Admin maskeleme istisnası burada uygulanır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { canViewPII, isSuperAdmin } from '@/lib/rbac';
import { logAudit, extractIp } from '@/lib/auditLog';

export async function POST(req: NextRequest) {
    // Auth kontrolü
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

    let actor: any;
    try {
        actor = verifyJwt(token);
        if (!actor) throw new Error();
    } catch {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    let body: { memberId?: string; field?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }

    const { memberId, field } = body;

    if (!memberId || !field) {
        return NextResponse.json({ error: 'memberId ve field gerekli.' }, { status: 400 });
    }

    const allowedFields = ['tcNo', 'phone', 'email'];
    if (!allowedFields.includes(field)) {
        return NextResponse.json({ error: 'Geçersiz alan.' }, { status: 400 });
    }

    // IDOR & PII yetki kontrolü
    if (!canViewPII(actor, memberId)) {
        return NextResponse.json({ error: 'Bu veriye erişim yetkiniz yok.' }, { status: 403 });
    }

    const member = await prisma.member.findUnique({
        where: { id: memberId }
    });

    if (!member) {
        return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 });
    }

    const ip = extractIp(req.headers);

    // Audit log — asenkron
    logAudit({
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        actorIp: ip,
        action: 'VIEW_PII',
        targetMemberId: memberId,
        targetField: field,
        details: {
            targetName: member.fullName,
            isSuperAdmin: isSuperAdmin(actor),
        },
    });

    // Değeri dön
    const value = (member as any)[field] || null;

    if (!value) {
        return NextResponse.json({ value: null, message: 'Bu alan henüz doldurulmamış.' });
    }

    return NextResponse.json({ value });
}
