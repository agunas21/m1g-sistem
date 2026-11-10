import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
        if (!isCron) {
            const cookieStore = await cookies();
            const token = cookieStore.get('m1g_session')?.value;
            const payload = token ? verifyJwt(token) : null;
            if (!payload || (!payload.isAdmin && !payload.isSuperAdmin)) {
                return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
            }
        }
        const members = await prisma.member.findMany({
            where: {
                status: 'Aktif',
                birthDate: {
                    not: null
                }
            }
        });

        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentDay = today.getDate(); // 1-31

        let sentCount = 0;
        const sentTo = [];

        for (const member of members) {
            if (!member.birthDate || !member.email) continue;
            if (!member.email.includes('@')) continue;

            // birthDate format: YYYY-MM-DD or DD.MM.YYYY
            let bMonth = 0;
            let bDay = 0;

            if (member.birthDate.includes('-')) {
                // YYYY-MM-DD
                const parts = member.birthDate.split('-');
                if (parts.length === 3) {
                    bMonth = parseInt(parts[1], 10);
                    bDay = parseInt(parts[2], 10);
                }
            } else if (member.birthDate.includes('.')) {
                // DD.MM.YYYY
                const parts = member.birthDate.split('.');
                if (parts.length === 3) {
                    bDay = parseInt(parts[0], 10);
                    bMonth = parseInt(parts[1], 10);
                }
            }

            if (bMonth === currentMonth && bDay === currentDay) {
                // Bugün doğum günü!
                const result = await sendEmail(
                    member.email,
                    'Doğum Gününüz Kutlu Olsun! - M1G Ailesi',
                    'birthday',
                    [member.fullName]
                );

                if (result.success) {
                    sentCount++;
                    sentTo.push(member.fullName);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${sentCount} kişiye doğum günü maili gönderildi.`,
            sentTo
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Sunucu hatası: ' + error.message }, { status: 500 });
    }
}
