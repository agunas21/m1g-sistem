import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { incrementWafStat } from '@/lib/wafStats';
import { writeLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const body = await req.json();
        const { type, count } = body;

        const loopCount = count || 1;

        for (let i = 0; i < loopCount; i++) {
            incrementWafStat('totalRequests');
            
            if (type === 'ddos') {
                incrementWafStat('blockedRequests');
                incrementWafStat('ddosBlocks');
                await writeLog('WARN', 'SYSTEM_WAF', `Simulated DDoS block from 192.168.1.${Math.floor(Math.random()*255)}`, 'WAF_ENGINE');
            } else if (type === 'sql') {
                incrementWafStat('blockedRequests');
                incrementWafStat('sqlBlocks');
                await writeLog('ERROR', 'SYSTEM_WAF', `Simulated SQL Injection blocked: SELECT * FROM users`, 'WAF_ENGINE');
            } else if (type === 'xss') {
                incrementWafStat('blockedRequests');
                incrementWafStat('xssBlocks');
                await writeLog('WARN', 'SYSTEM_WAF', `Simulated XSS Payload blocked: <script>alert(1)</script>`, 'WAF_ENGINE');
            } else if (type === 'bot') {
                incrementWafStat('blockedRequests');
                incrementWafStat('botBlocks');
                await writeLog('WARN', 'SYSTEM_WAF', `Simulated Bot access blocked: BadBot/1.0`, 'WAF_ENGINE');
            }
        }

        return NextResponse.json({ success: true, message: `${loopCount} adet ${type} simülasyonu başarıyla tetiklendi.` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
