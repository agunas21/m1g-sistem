import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyJwt, decryptField } from '@/lib/crypto';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        
        // Search ONLY by kimlikToken (unpredictable UUID v4)
        const member = await prisma.member.findUnique({
            where: { kimlikToken: id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 });
        }

        let actor: any = null;
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('m1g_session')?.value;
            if (token) actor = verifyJwt(token);
        } catch {}

        const isSelf = actor && (actor.id === member.id);
        const isAdmin = actor && (actor.isAdmin || actor.isSuperAdmin);
        const showTcNo = isSelf || isAdmin;

        const plainTc = member.tcNo ? decryptField(member.tcNo) : '';
        const maskedTc = plainTc 
            ? (plainTc.length === 11 ? "*******" + plainTc.slice(-4) : "*".repeat(Math.max(0, plainTc.length - 4)) + plainTc.slice(-4)) 
            : '';

        const isPasif = member.status === "Pasif";
        const serial = `M1G-${member.id.substring(0, 4).toUpperCase()}`;

        // Get President's phone number
        const president = await prisma.member.findFirst({
            where: { 
                memberType: 'Yönetim Kurulu Başkanı',
                phone: { not: null }
            },
            select: { phone: true }
        });
        const presidentPhone = president?.phone || '0(544) 727-6075';

        const res = NextResponse.json({
            id: member.id,
            fullName: member.fullName,
            avatar: member.avatar || '',
            status: isPasif ? 'Pasif' : 'Aktif',
            joinDate: member.joinDate || new Date(),
            role: member.memberType || 'Üye',
            honorary: member.honorary || 'Hayır',
            emergencyContact: member.emergencyContact || '',
            bloodType: member.bloodType || 'Belirtilmemiş',
            kimlikToken: member.kimlikToken,
            tcNo: showTcNo ? plainTc : maskedTc,
            serial: serial,
            presidentPhone: presidentPhone
        });

        res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
