import { NextResponse } from 'next/server';
import { incrementWafStat } from '@/lib/wafStats';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        // Gerçek kullanıcı siteye girdiğinde bu route'a arka planda bir ping atılır
        // ve bu sayede WAF istatistiklerindeki "Toplam İstek" (ve dolayısıyla "İzin Verilen") gerçek zamanlı artar.
        incrementWafStat('totalRequests');
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
