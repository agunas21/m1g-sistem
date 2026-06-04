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

        const isPasif = member.status === "Pasif";
        // To get serial, we could count members joined before, but for simplicity let's just use a stub or short id.
        // Actually since we migrated to DB, serial can just use the short hash of ID or count.
        const serial = `M1G-${member.id.substring(0, 4).toUpperCase()}`;

        return NextResponse.json({
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
            tcNo: member.tcNo ? decryptField(member.tcNo) : '',
            serial: serial
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
    }
}
