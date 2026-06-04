/**
 * M1G — Audit Log API
 * Sadece admin kullanabilir. Silme endpoint'i yoktur (immutable).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { queryAuditLog, AuditQueryOptions } from '@/lib/auditLog';


export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
    // Admin kimlik doğrulama
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
    } catch {
        return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const options: AuditQueryOptions = {
        actorId: searchParams.get('actorId') || undefined,
        targetMemberId: searchParams.get('targetMemberId') || undefined,
        action: searchParams.get('action') as any || undefined,
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0'),
    };

    const entries = await queryAuditLog(options);
    return NextResponse.json({ entries, count: entries.length });
}
