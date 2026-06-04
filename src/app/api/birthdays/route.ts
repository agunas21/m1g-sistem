import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendEmail } from '@/lib/mailer';

import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
// Doğum gününe kaç gün kaldığını hesapla (her yıl döngüsel)
function daysUntilBirthday(birthDateStr: string): number | null {
    if (!birthDateStr || birthDateStr === '-') return null;
    
    // "DD.MM.YYYY" veya "YYYY-MM-DD" formatını destekle
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

// GET: Doğum günü yaklaşanları listele (default 30 gün içinde)
export async function GET(req: Request) {
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

    return NextResponse.json(upcoming);
}

// POST: Doğum günü yaklaşanlara mail gönder
export async function POST(req: Request) {
    try {
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
