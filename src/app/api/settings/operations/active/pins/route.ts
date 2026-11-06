export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';

// POST: Operasyona yeni bir pin (işaretçi) ekle
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Yetkisiz erişim: Oturum açmalısınız.' }, { status: 401 });
        }
        const user = verifyJwt(token);
        if (!user) {
            return NextResponse.json({ error: 'Geçersiz oturum.' }, { status: 401 });
        }

        const payload = await req.json();
        const { operationId, name, type, lat, lng, createdBy } = payload;

        if (!operationId || !name || !type || !lat || !lng) {
            return NextResponse.json({ error: 'Eksik veri: operationId, name, type, lat, lng gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (!operations[i].pins) operations[i].pins = [];
                
                operations[i].pins.push({
                    id: crypto.randomUUID(),
                    name,
                    type,
                    location: [lat, lng],
                    createdBy: createdBy || 'Sistem',
                    timestamp: Date.now()
                });
                updated = true;
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, message: 'İşaretçi (Pin) eklendi' });
        } else {
            return NextResponse.json({ error: 'İlgili operasyon bulunamadı' }, { status: 404 });
        }

    } catch (error) {
        console.error('[active-operations/pins POST]', error);
        return NextResponse.json({ error: 'Pin kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Operasyondan pin sil
export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Yetkisiz erişim: Oturum açmalısınız.' }, { status: 401 });
        }
        const user = verifyJwt(token);
        if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
            return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');
        const pinId = searchParams.get('pinId');

        if (!operationId || !pinId) {
            return NextResponse.json({ error: 'Eksik veri: operationId ve pinId gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (operations[i].pins) {
                    operations[i].pins = operations[i].pins.filter((p: any) => p.id !== pinId);
                    updated = true;
                }
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, message: 'İşaretçi silindi' });
        } else {
            return NextResponse.json({ error: 'İşaretçi veya operasyon bulunamadı' }, { status: 404 });
        }

    } catch (error) {
        console.error('[active-operations/pins DELETE]', error);
        return NextResponse.json({ error: 'Pin silinemedi: ' + String(error) }, { status: 500 });
    }
}
