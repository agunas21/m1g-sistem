import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// Doğum günü yaklaşanları hesapla
function daysUntilBirthday(birthDateStr: string): number | null {
    if (!birthDateStr || birthDateStr === '-') return null;
    
    let day: number, month: number;
    if (birthDateStr.includes('.')) {
        const parts = birthDateStr.split('.');
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
    } else if (birthDateStr.includes('-')) {
        const parts = birthDateStr.split('-');
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
    } else {
        return null;
    }

    if (isNaN(day) || isNaN(month)) return null;

    const today = new Date();
    const thisYear = today.getFullYear();
    
    let nextBirthday = new Date(thisYear, month - 1, day);
    if (nextBirthday < today) {
        nextBirthday = new Date(thisYear + 1, month - 1, day);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// GET: Doğum günü yaklaşanları listele (sadece admin)
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const url = new URL(req.url);
        const withinDays = parseInt(url.searchParams.get('days') || '30');

        const members = await prisma.member.findMany({ where: { status: 'Aktif' } });
        const upcoming = members
            .filter((m: any) => m.birthDate)
            .map((m: any) => {
                const days = daysUntilBirthday(m.birthDate);
                return { ...m, daysUntilBirthday: days };
            })
            .filter((m: any) => m.daysUntilBirthday !== null && m.daysUntilBirthday <= withinDays)
            .sort((a: any, b: any) => a.daysUntilBirthday - b.daysUntilBirthday);

        const res = NextResponse.json(upcoming);
        res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
        return res;
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST: Doğum günü yaklaşanlara mail gönder (sadece admin)
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const { withinDays = 7, sendMails = false } = await req.json();
        const members = await prisma.member.findMany({ where: { status: 'Aktif' } });

        const upcoming = members
            .filter((m: any) => m.birthDate && m.email)
            .map((m: any) => {
                const days = daysUntilBirthday(m.birthDate);
                return { ...m, daysUntilBirthday: days };
            })
            .filter((m: any) => m.daysUntilBirthday !== null && m.daysUntilBirthday <= withinDays);

        if (!sendMails) {
            return NextResponse.json({ preview: upcoming, count: upcoming.length });
        }

        const results: any[] = [];
        for (const member of upcoming) {
            const dayText = member.daysUntilBirthday === 0
                ? 'bugün!'
                : `${member.daysUntilBirthday} gün sonra`;

            const result = await sendEmail(
                member.email,
                member.daysUntilBirthday === 0
                    ? `🎂 İyi ki doğdun, ${member.fullName.split(' ')[0]}!`
                    : `🎂 M1G — Doğum günün yaklaşıyor!`,
                'notification',
                [
                    member.daysUntilBirthday === 0 ? '🎂 Doğum Günün Kutlu Olsun!' : '🎂 Doğum Günün Yaklaşıyor!',
                    member.daysUntilBirthday === 0
                        ? `Sayın ${member.fullName},\n\nM1G Arama ve Kurtarma Derneği ailesi olarak doğum gününüzü en içten dileklerimizle kutluyoruz! 🎉\n\nSağlıklı, mutlu ve başarılı bir yıl diliyoruz.`
                        : `Sayın ${member.fullName},\n\nDoğum gününüz ${dayText} Tüm ekibiniz adına şimdiden nice mutlu yıllar diliyoruz! 🎉`
                ]
            );

            results.push({ member: member.fullName, email: member.email, sent: result.success, days: member.daysUntilBirthday });
        }

        return NextResponse.json({ success: true, results, sent: results.filter(r => r.sent).length });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
