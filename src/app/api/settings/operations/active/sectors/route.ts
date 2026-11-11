export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

export interface ASR1Sector {
    id: string;
    code: string;               // örn: "Sektör A", "Sektör B-1"
    name: string;               // örn: "Bayraklı Manavkuyu Afet Sahası"
    polygon: [number, number][]; // [[lat, lng], [lat, lng], ...]
    assignedTeamName?: string;  // örn: "kurtarma timi"
    assignedTeamId?: string;
    status: 'Değerlendirme' | 'Aktif Arama' | 'Tamamlandı' | 'Yüksek Risk';
    priority: 'Kritik' | 'Orta' | 'Düşük';
    hazards?: string;           // örn: "Doğalgaz kaçağı, çökmüş viyadük"
    radioChannel?: string;      // örn: "CH-1 / 446.00625 MHz"
    notes?: string;
    color: string;              // hex kod
    sectorType?: 'ASR-1' | 'ASR-2' | 'WSAR-GRID' | 'LKP'; // ASR-1 Geniş Alan, ASR-2 Sektör Değerlendirme, WSAR-GRID Doğa Kutu Tarama, LKP Çemberi
    lkpMeta?: {
        center: [number, number];
        profileName: string;
        radius50m: number;
        radius95m: number;
        missingPersonName?: string;
        lastSeenTime?: string;
    };
    createdAt: number;
    updatedAt: number;
}

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

// GET: Operasyona ait ASR-1 sektörlerini listele
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token || !verifyJwt(token)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401, headers: NO_STORE_HEADERS });
        }

        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');

        if (!operationId) {
            return NextResponse.json({ error: 'operationId gerekli' }, { status: 400, headers: NO_STORE_HEADERS });
        }

        const dedicatedKey = `global_sectors_${operationId}`;
        const [operations, dedicatedSectors] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const op = operations.find((o: any) => o.id === operationId);
        const opSectors: ASR1Sector[] = Array.isArray(op?.sectors) ? op.sectors : [];
        const backupSectors: ASR1Sector[] = Array.isArray(dedicatedSectors) ? dedicatedSectors : [];

        // İki kaynaktaki sektörleri ID bazlı birleştir (dedicatedSectors öncelikli)
        const mergedMap = new Map<string, ASR1Sector>();
        for (const s of opSectors) {
            if (s && s.id) mergedMap.set(s.id, s);
        }
        for (const s of backupSectors) {
            if (s && s.id) mergedMap.set(s.id, s);
        }

        const finalSectors = Array.from(mergedMap.values());

        // Eğer dedicatedKey boşsa ama opSectors doluysa senkronize et
        if (backupSectors.length === 0 && finalSectors.length > 0) {
            await writeCollectionDB(dedicatedKey, finalSectors);
        }

        return NextResponse.json({ sectors: finalSectors }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[active-operations/sectors GET]', error);
        return NextResponse.json({ error: 'Sektörler getirilemedi: ' + String(error) }, { status: 500, headers: NO_STORE_HEADERS });
    }
}

// POST: Yeni ASR-1 Sektörü (veya LKP Çemberi) ekle veya güncelle
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
        const {
            operationId,
            id,
            code,
            name,
            polygon,
            assignedTeamName,
            assignedTeamId,
            status = 'Değerlendirme',
            priority = 'Orta',
            hazards = '',
            radioChannel = '',
            notes = '',
            color = '#3b82f6',
            sectorType = 'ASR-1',
            lkpMeta
        } = payload;

        if (!operationId || !code || !name || !polygon || polygon.length < 3) {
            return NextResponse.json({ error: 'Eksik veri: operationId, code, name ve en az 3 noktalı poligon gerekli' }, { status: 400 });
        }

        const dedicatedKey = `global_sectors_${operationId}`;
        const [operations, dedicatedSectors] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const now = Date.now();
        const normalizedPolygon: [number, number][] = polygon.map((pt: any) => [Number(pt[0]), Number(pt[1])]);

        // Önce mevcut sektör listesini birleştir
        const opIdx = operations.findIndex((o: any) => o.id === operationId);
        const existingOpSectors: ASR1Sector[] = (opIdx !== -1 && Array.isArray(operations[opIdx].sectors)) ? operations[opIdx].sectors : [];
        const existingBackupSectors: ASR1Sector[] = Array.isArray(dedicatedSectors) ? dedicatedSectors : [];

        const mergedMap = new Map<string, ASR1Sector>();
        for (const s of existingOpSectors) {
            if (s && s.id) mergedMap.set(s.id, s);
        }
        for (const s of existingBackupSectors) {
            if (s && s.id) mergedMap.set(s.id, s);
        }

        const sectorList = Array.from(mergedMap.values());
        const existingIdx = id ? sectorList.findIndex((s: any) => s.id === id) : -1;
        let savedSector: ASR1Sector;

        if (existingIdx !== -1) {
            savedSector = {
                ...sectorList[existingIdx],
                code,
                name,
                polygon: normalizedPolygon,
                assignedTeamName,
                assignedTeamId,
                status,
                priority,
                hazards,
                radioChannel,
                notes,
                color,
                sectorType,
                lkpMeta: lkpMeta || sectorList[existingIdx].lkpMeta,
                updatedAt: now
            };
            sectorList[existingIdx] = savedSector;
        } else {
            savedSector = {
                id: id || `SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                code,
                name,
                polygon: normalizedPolygon,
                assignedTeamName,
                assignedTeamId,
                status,
                priority,
                hazards,
                radioChannel,
                notes,
                color,
                sectorType,
                lkpMeta,
                createdAt: now,
                updatedAt: now
            };
            sectorList.push(savedSector);
        }

        // Hem bağımsız koleksiyona hem de global_operations içine kaydet
        await writeCollectionDB(dedicatedKey, sectorList);

        if (opIdx !== -1) {
            operations[opIdx].sectors = sectorList;
            await writeCollectionDB('global_operations', operations);
        }

        // Supabase Realtime ile tüm ekranlara yayınla
        try {
            supabase.channel('operations-channel').send({
                type: 'broadcast',
                event: 'sector_update',
                payload: { operationId, sector: savedSector }
            }).catch(() => {});
        } catch {}

        return NextResponse.json({ success: true, sector: savedSector }, { headers: NO_STORE_HEADERS });

    } catch (error) {
        console.error('[active-operations/sectors POST]', error);
        return NextResponse.json({ error: 'Sektör kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Sektör sil
export async function DELETE(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');
        const sectorId = searchParams.get('sectorId');

        if (!operationId || !sectorId) {
            return NextResponse.json({ error: 'operationId ve sectorId gerekli' }, { status: 400 });
        }

        const dedicatedKey = `global_sectors_${operationId}`;
        const [operations, dedicatedSectors] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const filteredBackup = (Array.isArray(dedicatedSectors) ? dedicatedSectors : []).filter((s: any) => s.id !== sectorId);
        await writeCollectionDB(dedicatedKey, filteredBackup);

        const opIdx = operations.findIndex((o: any) => o.id === operationId);
        if (opIdx !== -1 && Array.isArray(operations[opIdx].sectors)) {
            operations[opIdx].sectors = operations[opIdx].sectors.filter((s: any) => s.id !== sectorId);
            await writeCollectionDB('global_operations', operations);
        }

        try {
            supabase.channel('operations-channel').send({
                type: 'broadcast',
                event: 'sector_delete',
                payload: { operationId, sectorId }
            }).catch(() => {});
        } catch {}

        return NextResponse.json({ success: true, message: 'Sektör silindi' }, { headers: NO_STORE_HEADERS });

    } catch (error) {
        console.error('[active-operations/sectors DELETE]', error);
        return NextResponse.json({ error: 'Sektör silinemedi: ' + String(error) }, { status: 500 });
    }
}
