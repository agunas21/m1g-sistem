export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { writeLog } from '@/lib/logger';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

async function readOperations(): Promise<any[]> {
    return await getCollectionDB('global_operations');
}

async function writeOperations(data: any[]): Promise<void> {
    await writeCollectionDB('global_operations', data);
}

// GET: Tüm operasyonları listele (sadece logged-in)
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        const payload = verifyJwt(token);
        if (!payload) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

        const data = await readOperations();
        const res = NextResponse.json(data);
        // private cache, 15 sn (tarayıcı bazlı önbellek, CDN cache kapalı)
        res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
        return res;
    } catch (error) {
        console.error('[active-operations GET]', error);
        return NextResponse.json({ error: 'Operasyonlar okunamadı' }, { status: 500 });
    }
}

// POST: Operasyon güncelle veya yeni ekle (sadece admin)
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const body = await req.json();
        const operations = await readOperations();

        if (!body.id) {
            return NextResponse.json({ error: 'Operasyon ID belirtilmedi' }, { status: 400 });
        }

        const idx = operations.findIndex((o: any) => o.id === body.id);
        if (idx !== -1) {
            // Güncelleme
            const oldOp = operations[idx];
            operations[idx] = { ...oldOp, ...body };
            await writeOperations(operations);
            await writeLog("INFO", payload.fullName || "Admin", `Operasyon Güncellendi: ${body.name || oldOp.name}`, body.id);
        } else {
            // Yeni operasyon
            const newOp = {
                id: body.id,
                name: body.name || 'Yeni Operasyon',
                type: body.type || 'Tatbikat',
                status: body.status || 'Aktif',
                startTime: body.startTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
                endTime: body.endTime || null,
                location: body.location || '',
                radioFrequency: body.radioFrequency || '',
                temperature: body.temperature || '',
                teams: body.teams || [],
                baseCamp: body.baseCamp || { members: [], equipment: [] },
                supplies: body.supplies || { 
                    tentCount: 0, 
                    waterLiters: 0, 
                    mealsCount: 0, 
                    blanketCount: 0, 
                    rakeCount: 0, 
                    pumpCount: 0, 
                    electrolyteLiters: 0,
                    flashlightCount: 0,
                    gpsCount: 0
                },
                logs: body.logs || [{ time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: 'Operasyon/Eğitim kaydı başlatıldı.' }],
                isEvacuationActive: body.isEvacuationActive || false,
                postMortemReport: body.postMortemReport || { completed: false, notes: '', memberNotes: {} }
            };
            operations.unshift(newOp);
            await writeOperations(operations);
            await writeLog("SUCCESS", payload.fullName || "Admin", `Yeni Operasyon Başlatıldı: ${newOp.name}`, newOp.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[active-operations POST]', error);
        return NextResponse.json({ error: 'Operasyon kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Operasyonu kalıcı olarak sil (sadece admin)
export async function DELETE(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Operasyon ID belirtilmedi' }, { status: 400 });
        }

        const operations = await readOperations();
        const filtered = operations.filter((o: any) => o.id !== id);
        await writeOperations(filtered);

        await writeLog("WARN", payload.fullName || "Admin", `Operasyon Kalıcı Olarak Silindi: ${id}`, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[active-operations DELETE]', error);
        return NextResponse.json({ error: 'Operasyon silinemedi: ' + String(error) }, { status: 500 });
    }
}
