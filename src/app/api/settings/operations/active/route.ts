export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { writeLog } from '@/lib/logger';

async function readOperations(): Promise<any[]> {
    return await getCollectionDB('global_operations');
}

async function writeOperations(data: any[]): Promise<void> {
    await writeCollectionDB('global_operations', data);
}

// GET: Tüm operasyonları listele
export async function GET() {
    try {
        const data = await readOperations();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[active-operations GET]', error);
        return NextResponse.json({ error: 'Operasyonlar okunamadı' }, { status: 500 });
    }
}

// POST: Operasyon güncelle veya yeni ekle
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const operations = await readOperations();

        if (!payload.id) {
            return NextResponse.json({ error: 'Operasyon ID belirtilmedi' }, { status: 400 });
        }

        const idx = operations.findIndex((o: any) => o.id === payload.id);
        if (idx !== -1) {
            // Güncelleme
            const oldOp = operations[idx];
            operations[idx] = { ...oldOp, ...payload };
            await writeOperations(operations);
            await writeLog("INFO", "Admin", `Operasyon Güncellendi: ${payload.name || oldOp.name}`, payload.id);
        } else {
            // Yeni operasyon
            const newOp = {
                id: payload.id,
                name: payload.name || 'Yeni Operasyon',
                type: payload.type || 'Tatbikat',
                status: payload.status || 'Aktif',
                startTime: payload.startTime || new Date().toISOString().replace('T', ' ').substring(0, 16),
                endTime: payload.endTime || null,
                location: payload.location || '',
                radioFrequency: payload.radioFrequency || '',
                temperature: payload.temperature || '',
                teams: payload.teams || [],
                baseCamp: payload.baseCamp || { members: [], equipment: [] },
                supplies: payload.supplies || { 
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
                logs: payload.logs || [{ time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: 'Operasyon/Eğitim kaydı başlatıldı.' }],
                isEvacuationActive: payload.isEvacuationActive || false,
                postMortemReport: payload.postMortemReport || { completed: false, notes: '', memberNotes: {} }
            };
            operations.unshift(newOp);
            await writeOperations(operations);
            await writeLog("SUCCESS", "Admin", `Yeni Operasyon Başlatıldı: ${newOp.name}`, newOp.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[active-operations POST]', error);
        return NextResponse.json({ error: 'Operasyon kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Operasyonu kalıcı olarak sil (Hard Delete)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Operasyon ID belirtilmedi' }, { status: 400 });
        }

        const operations = await readOperations();
        const filtered = operations.filter((o: any) => o.id !== id);
        await writeOperations(filtered);

        await writeLog("WARN", "Admin", `Operasyon Kalıcı Olarak Silindi: ${id}`, id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[active-operations DELETE]', error);
        return NextResponse.json({ error: 'Operasyon silinemedi: ' + String(error) }, { status: 500 });
    }
}
