import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { memberId, lat, lng } = body;

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
