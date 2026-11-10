import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const body = await req.json();
        const { memberId, lat, lng } = body;

        // Sadece kendi konumunu veya yönetici ise güncelleyebilir
        if (payload.id !== memberId && !payload.isAdmin && !payload.isSuperAdmin) {
            return NextResponse.json({ error: 'Başka bir personelin konumunu güncelleyemezsiniz' }, { status: 403 });
        }

        if (memberId && lat && lng) {
            await prisma.member.update({
                where: { id: memberId },
                data: {
                    lastLatitude: parseFloat(lat),
                    lastLongitude: parseFloat(lng),
                    lastLocationUpdate: new Date(),
                }
            }).catch(() => { });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
