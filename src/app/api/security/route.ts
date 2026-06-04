/**
 * M1G — Güvenlik İstatistikleri API
 * Sadece admin erişebilir.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { getBlockedEntries, getRateLimitStats } from '@/lib/rateLimit';
import { getWafStats } from '@/lib/wafStats';
import { getLogs } from '@/lib/logger';


export const dynamic = 'force-dynamic';
export async function GET() {
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

    // WAF istatistikleri
    const wafStats = getWafStats();
    
    // Rate limit istatistikleri
    const rateLimitStats = getRateLimitStats();
    
    // Bloklanmış IP'ler
    const blockedIPs = getBlockedEntries().map(entry => ({
        key: entry.key,
        blockedUntil: new Date(entry.blockedUntil).toISOString(),
        blockedUntilMs: entry.blockedUntil,
        strikes: entry.strikes,
        remainingMs: Math.max(0, entry.blockedUntil - Date.now()),
    }));

    // Son güvenlik logları (WARN / ERROR)
    const allLogs = await getLogs();
    const securityLogs = allLogs
        .filter((l: any) => l.level === 'WARN' || l.level === 'ERROR')
        .slice(0, 50);

    // Engel oranı hesapla
    const blockRate = wafStats.totalRequests > 0
        ? `${((wafStats.blockedRequests / wafStats.totalRequests) * 100).toFixed(1)}%`
        : '0%';

    const summary = {
        waf: {
            totalRequests:         wafStats.totalRequests,
            blockedRequests:       wafStats.blockedRequests,
            blockRate,
            ddosBlocks:            wafStats.ddosBlocks,
            sqlInjectionBlocks:    wafStats.sqlBlocks,
            xssBlocks:             wafStats.xssBlocks,
            pathTraversalBlocks:   wafStats.pathTraversalBlocks,
            botBlocks:             wafStats.botBlocks,
            rateLimitBlocks:       wafStats.rateLimitBlocks,
            upSince:               new Date(wafStats.lastReset).toISOString(),
        },
        rateLimit: rateLimitStats,
        blockedIPs,
        recentSecurityEvents: securityLogs,
        generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(summary);
}
