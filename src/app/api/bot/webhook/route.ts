import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BOT_SECRET_TOKEN = process.env.BOT_SECRET_KEY || 'm1g-secret-whatsapp-token-2026';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('x-bot-api-key');
        if (authHeader !== BOT_SECRET_TOKEN) {
            return NextResponse.json({ error: 'Yetkisiz bot erişimi' }, { status: 401 });
        }

        const body = await req.json();
        const { action, payload } = body;

        // 1. Üye bota bir talep/sorun yazdığında Firestore "messages" tablosuna ticket olarak ekleme
        if (action === 'new_ticket') {
            const { senderName, senderPhone, category, message, priority } = payload;

            const docRef = await addDoc(collection(db, "messages"), {
                name: senderName || 'WhatsApp Üyesi',
                phone: senderPhone || '',
                email: 'whatsapp@m1g.org.tr',
                subject: `[WhatsApp Bot - ${category || 'Genel'}]`,
                message: message || '',
                category: category || 'Genel Destek',
                priority: priority || 'Orta',
                source: 'whatsapp_bot',
                status: 'unread',
                createdAt: serverTimestamp()
            });

            return NextResponse.json({ 
                success: true, 
                ticketId: docRef.id,
                message: 'Talep yönetim paneline kaydedildi' 
            });
        }

        // 2. Bugün doğum günü olan üyeleri bota iletme
        if (action === 'get_birthdays') {
            const today = new Date();
            const day = today.getDate();
            const month = today.getMonth() + 1;

            const members = await prisma.member.findMany({
                where: { status: 'Aktif' },
                select: { id: true, name: true, phone: true, birthDate: true }
            });

            const birthdayMembers = members.filter(m => {
                if (!m.birthDate) return false;
                let bDay = 0, bMonth = 0;
                if (m.birthDate.includes('.')) {
                    const p = m.birthDate.split('.');
                    bDay = parseInt(p[0]);
                    bMonth = parseInt(p[1]);
                } else if (m.birthDate.includes('-')) {
                    const p = m.birthDate.split('-');
                    bMonth = parseInt(p[1]);
                    bDay = parseInt(p[2]);
                }
                return bDay === day && bMonth === month;
            });

            return NextResponse.json({ success: true, birthdays: birthdayMembers });
        }

        // 3. Aktif afet / operasyon bilgisini sorgulama
        if (action === 'get_active_operation') {
            const activeOp = await prisma.operation.findFirst({
                where: { status: 'Aktif' },
                include: { teams: true }
            });

            return NextResponse.json({ success: true, operation: activeOp });
        }

        return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
    } catch (err: any) {
        console.error('Bot webhook error:', err);
        return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 });
    }
}

