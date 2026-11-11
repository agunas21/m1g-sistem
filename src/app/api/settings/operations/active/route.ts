export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { writeLog } from '@/lib/logger';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

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
        // Her operasyonun bağımsız sektör ve enkaz kayıtlarını da senkronize et
        for (let i = 0; i < data.length; i++) {
            const opId = data[i]?.id;
            if (!opId) continue;
            const [secBackup, wsBackup] = await Promise.all([
                getCollectionDB(`global_sectors_${opId}`),
                getCollectionDB(`global_worksites_${opId}`)
            ]);
            if (Array.isArray(secBackup) && secBackup.length > 0) {
                const secMap = new Map<string, any>();
                for (const s of (data[i].sectors || [])) { if (s?.id) secMap.set(s.id, s); }
                for (const s of secBackup) { if (s?.id) secMap.set(s.id, s); }
                data[i].sectors = Array.from(secMap.values());
            }
            if (Array.isArray(wsBackup) && wsBackup.length > 0) {
                const wsMap = new Map<string, any>();
                for (const w of (data[i].worksites || [])) { if (w?.id) wsMap.set(w.id, w); }
                for (const w of wsBackup) { if (w?.id) wsMap.set(w.id, w); }
                data[i].worksites = Array.from(wsMap.values());
            }
        }
        const res = NextResponse.json(data);
        res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
            // Güncelleme — Harita üzerinde bağımsız API ile kaydedilen sectors, worksites ve pins verilerinin ezilmesini önle
            const oldOp = operations[idx];
            const [secBackup, wsBackup] = await Promise.all([
                getCollectionDB(`global_sectors_${body.id}`),
                getCollectionDB(`global_worksites_${body.id}`)
            ]);
            const preservedSectors = (Array.isArray(secBackup) && secBackup.length > 0)
                ? secBackup
                : (Array.isArray(oldOp.sectors) && oldOp.sectors.length > 0 ? oldOp.sectors : (body.sectors || []));
            const preservedWorksites = (Array.isArray(wsBackup) && wsBackup.length > 0)
                ? wsBackup
                : (Array.isArray(oldOp.worksites) && oldOp.worksites.length > 0 ? oldOp.worksites : (body.worksites || []));
            const preservedPins = (Array.isArray(oldOp.pins) && oldOp.pins.length > (body.pins?.length || 0))
                ? oldOp.pins
                : (body.pins || oldOp.pins || []);

            operations[idx] = {
                ...oldOp,
                ...body,
                sectors: preservedSectors,
                worksites: preservedWorksites,
                pins: preservedPins
            };
            await writeOperations(operations);
            await writeLog("INFO", payload.fullName || "Admin", `Operasyon Güncellendi: ${body.name || oldOp.name}`, body.id);

            // Sync to Prisma Postgres
            try {
                await prisma.operation.upsert({
                    where: { id: body.id },
                    update: {
                        name: body.name || oldOp.name || 'Bilinmeyen',
                        type: body.type || oldOp.type || 'Eğitim',
                        status: body.status || oldOp.status || 'Aktif',
                        location: body.location || oldOp.location || '',
                        temperature: body.temperature || oldOp.temperature || '',
                    },
                    create: {
                        id: body.id,
                        name: body.name || oldOp.name || 'Bilinmeyen',
                        type: body.type || oldOp.type || 'Eğitim',
                        status: body.status || oldOp.status || 'Aktif',
                        startTime: oldOp.startTime ? new Date(oldOp.startTime) : new Date(),
                        location: body.location || oldOp.location || '',
                        temperature: body.temperature || oldOp.temperature || '',
                    }
                });
            } catch (e) {
                console.error("Prisma sync failed for update", e);
            }
        } else {
            // Yeni operasyon
            const newOp = {
                id: body.id,
                name: body.name || 'Yeni Operasyon',
                type: body.type || 'Tatbikat',
                status: body.status || 'Hazırlık',
                startTime: body.startTime || '',
                endTime: body.endTime || null,
                location: body.location || '',
                radioFrequency: body.radioFrequency || '',
                description: body.description || null,
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

            // Sync to Prisma Postgres
            try {
                await prisma.operation.upsert({
                    where: { id: newOp.id },
                    update: {
                        name: newOp.name,
                        type: newOp.type,
                        status: newOp.status,
                        location: newOp.location,
                        temperature: newOp.temperature,
                    },
                    create: {
                        id: newOp.id,
                        name: newOp.name,
                        type: newOp.type,
                        status: newOp.status,
                        startTime: newOp.startTime ? new Date(newOp.startTime) : new Date(),
                        location: newOp.location,
                        temperature: newOp.temperature,
                    }
                });
            } catch (e) {
                console.error("Prisma sync failed for create", e);
            }
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
