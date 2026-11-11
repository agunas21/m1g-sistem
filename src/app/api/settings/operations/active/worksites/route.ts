export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

export interface VictimExtrication {
    id: string;
    timeString: string;
    triage: 'Yeşil (Hafif)' | 'Sarı (Orta)' | 'Kırmızı (Acil)' | 'Siyah (Vefat/Ex)';
    victimInfo: string;       // örn: "34 Yaş Kadın"
    locationInRubble: string; // örn: "2. Kat Yaşam Üçgeni"
    handedOverTo: string;     // örn: "112 Ambulans (35 ABC 112)"
    recordedBy: string;
}

export interface INSARAGWorksiteLog {
    id: string;
    timestamp: string;      // ISO format
    timeString: string;     // Okunabilir format: "16:10 - 06.11.2026"
    authorName: string;     // Güncelleyen komuta yetkilisi
    action: string;         // Örn: "Vardiya Devri: Tim 1 ➔ Tim 2"
    details?: string;       // Vardiya notu / Değişiklik gerekçesi
    prevTeamName?: string;
    newTeamName?: string;
    prevStatus?: string;
    newStatus?: string;
    victimsSnapshot?: {
        liveExtracted: number;
        deceasedExtracted: number;
        suspectedLive: number;
    };
}

export interface INSARAGWorksite {
    id: string;                    // örn: "WS-8921"
    code: string;                  // örn: "A-1" (Sektör A, 1. Enkaz)
    name: string;                  // örn: "Gül Apartmanı (8 Katlı)"
    address?: string;              // örn: "Mansuroğlu Mah. 283 Sk. No: 14"
    location: [number, number];    // [lat, lng]
    asrLevel?: 'ASR-3' | 'ASR-4' | 'ASR-5'; // INSARAG Müdahale Kademesi
    structureType: 'Betonarme' | 'Yığma' | 'Çelik' | 'Ahşap' | 'Diğer';
    collapseType: 'Sandviç (Pancake)' | 'V-Tipi' | 'Yana Yatma' | 'Kısmi Çökme' | 'Yumuşak Kat';
    status: 'Acil Müdahale' | 'Canlı Tespiti Var' | 'Arama Sürüyor' | 'Tahliye Edildi' | 'Temizlendi' | 'Yüksek Risk';
    priority: 'Kritik (P1)' | 'Yüksek (P2)' | 'Düşük (P3)';
    victims: {
        liveExtracted: number;       // Çıkarılan canlı (L)
        deceasedExtracted: number;   // Çıkarılan vefat (D)
        suspectedLive: number;       // Şüpheli/ses alınan (L?)
        suspectedDeceased: number;   // Şüpheli vefat (D?)
    };
    techSearch?: {
        k9: 'Yapılmadı' | 'Pozitif (Tepki Var)' | 'Negatif (Temiz)';
        acoustic: 'Yapılmadı' | 'Ses Alındı' | 'Negatif (Sessiz)';
        camera: 'Yapılmadı' | 'Temas Var' | 'Negatif';
    };
    extrications?: VictimExtrication[]; // START Triyaj & Kazazede Çıkarma Kartları
    hazards: string[];             // ['Doğalgaz', 'Asbest', 'Elektrik', 'Çökme Riski']
    assignedTeamName?: string;     // örn: "M1G Tim 1"
    assignedTeamId?: string;
    radioChannel?: string;         // örn: "CH-1 / 446.00625 MHz"
    markingDate: string;           // ISO veya okunabilir tarih/saat
    notes?: string;
    history?: INSARAGWorksiteLog[]; // INSARAG Saat Bazlı Vardiya & Durum Tarihçesi
    createdAt: number;
    updatedAt: number;
}

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

// GET: Operasyona ait INSARAG ASR-3/4/5 enkazlarını listele
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

        const dedicatedKey = `global_worksites_${operationId}`;
        const [operations, dedicatedWorksites] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const op = operations.find((o: any) => o.id === operationId);
        const opWorksites: INSARAGWorksite[] = Array.isArray(op?.worksites) ? op.worksites : [];
        const backupWorksites: INSARAGWorksite[] = Array.isArray(dedicatedWorksites) ? dedicatedWorksites : [];

        const mergedMap = new Map<string, INSARAGWorksite>();
        for (const w of opWorksites) {
            if (w && w.id) mergedMap.set(w.id, w);
        }
        for (const w of backupWorksites) {
            if (w && w.id) mergedMap.set(w.id, w);
        }

        const finalWorksites = Array.from(mergedMap.values());
        if (backupWorksites.length === 0 && finalWorksites.length > 0) {
            await writeCollectionDB(dedicatedKey, finalWorksites);
        }

        return NextResponse.json({ worksites: finalWorksites }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('[active-operations/worksites GET]', error);
        return NextResponse.json({ error: 'Enkazlar getirilemedi: ' + String(error) }, { status: 500, headers: NO_STORE_HEADERS });
    }
}

// POST: Yeni ASR-3/4/5 Enkazı ekle veya güncelle
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
            address = '',
            location,
            asrLevel = 'ASR-3',
            structureType = 'Betonarme',
            collapseType = 'Sandviç (Pancake)',
            status = 'Arama Sürüyor',
            priority = 'Yüksek (P2)',
            victims = { liveExtracted: 0, deceasedExtracted: 0, suspectedLive: 0, suspectedDeceased: 0 },
            techSearch,
            extrications,
            hazards = [],
            assignedTeamName = '',
            assignedTeamId = '',
            radioChannel = '',
            markingDate = new Date().toLocaleString('tr-TR'),
            notes = ''
        } = payload;

        if (!operationId || !code || !name || !location || !Array.isArray(location) || location.length < 2) {
            return NextResponse.json({ error: 'Eksik veri: operationId, code, name ve koordinat gerekli' }, { status: 400 });
        }

        const dedicatedKey = `global_worksites_${operationId}`;
        const [operations, dedicatedWorksites] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const opIdx = operations.findIndex((o: any) => o.id === operationId);
        const existingOpWs: INSARAGWorksite[] = (opIdx !== -1 && Array.isArray(operations[opIdx].worksites)) ? operations[opIdx].worksites : [];
        const existingBackupWs: INSARAGWorksite[] = Array.isArray(dedicatedWorksites) ? dedicatedWorksites : [];

        const mergedMap = new Map<string, INSARAGWorksite>();
        for (const w of existingOpWs) {
            if (w && w.id) mergedMap.set(w.id, w);
        }
        for (const w of existingBackupWs) {
            if (w && w.id) mergedMap.set(w.id, w);
        }

        const worksiteList = Array.from(mergedMap.values());
        const now = Date.now();
        const userAuthor = (user as any).name || (user as any).fullName || (user as any).email || 'Komuta Masası';
        const nowTimeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('tr-TR');

        const existingIdx = id ? worksiteList.findIndex((w: any) => w.id === id) : -1;
        let savedWorksite: INSARAGWorksite;

        if (existingIdx !== -1) {
            const prev = worksiteList[existingIdx];
            const prevHistory: INSARAGWorksiteLog[] = prev.history || [];

            const changes: string[] = [];
            if ((prev.asrLevel || 'ASR-3') !== asrLevel) {
                changes.push(`Kademe: ${prev.asrLevel || 'ASR-3'} ➔ ${asrLevel}`);
            }
            if (prev.assignedTeamName !== assignedTeamName) {
                changes.push(`Vardiya Devri: ${prev.assignedTeamName || 'Atanmadı'} ➔ ${assignedTeamName || 'Atanmadı'}`);
            }
            if (prev.status !== status) {
                changes.push(`Durum: ${prev.status} ➔ ${status}`);
            }
            if (prev.priority !== priority) {
                changes.push(`Öncelik: ${prev.priority} ➔ ${priority}`);
            }
            if (prev.victims?.liveExtracted !== victims?.liveExtracted || prev.victims?.deceasedExtracted !== victims?.deceasedExtracted || prev.victims?.suspectedLive !== victims?.suspectedLive) {
                changes.push(`Kazazede Sayımı (Canlı: ${victims?.liveExtracted || 0}, Vefat: ${victims?.deceasedExtracted || 0}, Şüpheli: ${victims?.suspectedLive || 0})`);
            }

            const actionSummary = payload.logAction || (changes.length > 0 ? changes.join(' | ') : 'Enkaz Bilgileri / Notlar Güncellendi');

            const newLog: INSARAGWorksiteLog = {
                id: `LOG-${now}`,
                timestamp: new Date().toISOString(),
                timeString: nowTimeStr,
                authorName: userAuthor,
                action: actionSummary,
                details: payload.updateNote || notes || '',
                prevTeamName: prev.assignedTeamName,
                newTeamName: assignedTeamName,
                prevStatus: prev.status,
                newStatus: status,
                victimsSnapshot: {
                    liveExtracted: victims?.liveExtracted || 0,
                    deceasedExtracted: victims?.deceasedExtracted || 0,
                    suspectedLive: victims?.suspectedLive || 0
                }
            };

            savedWorksite = {
                ...prev,
                code,
                name,
                address,
                location: [Number(location[0]), Number(location[1])],
                asrLevel: asrLevel || prev.asrLevel || 'ASR-3',
                structureType,
                collapseType,
                status,
                priority,
                victims,
                techSearch: techSearch || prev.techSearch || { k9: 'Yapılmadı', acoustic: 'Yapılmadı', camera: 'Yapılmadı' },
                extrications: Array.isArray(extrications) ? extrications : (prev.extrications || []),
                hazards,
                assignedTeamName,
                assignedTeamId,
                radioChannel,
                markingDate,
                notes,
                history: [newLog, ...prevHistory],
                updatedAt: now
            };
            worksiteList[existingIdx] = savedWorksite;
        } else {
            const initialLog: INSARAGWorksiteLog = {
                id: `LOG-${now}`,
                timestamp: new Date().toISOString(),
                timeString: nowTimeStr,
                authorName: userAuthor,
                action: `${asrLevel || 'ASR-3'} İlk Saha İşaretlemesi Yapıldı`,
                details: notes || 'Enkaz komuta sistemine ilk kez kaydedildi',
                newTeamName: assignedTeamName,
                newStatus: status,
                victimsSnapshot: {
                    liveExtracted: victims?.liveExtracted || 0,
                    deceasedExtracted: victims?.deceasedExtracted || 0,
                    suspectedLive: victims?.suspectedLive || 0
                }
            };

            savedWorksite = {
                id: id || `WS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                code,
                name,
                address,
                location: [Number(location[0]), Number(location[1])],
                asrLevel: asrLevel || 'ASR-3',
                structureType,
                collapseType,
                status,
                priority,
                victims,
                techSearch: techSearch || { k9: 'Yapılmadı', acoustic: 'Yapılmadı', camera: 'Yapılmadı' },
                extrications: Array.isArray(extrications) ? extrications : [],
                hazards,
                assignedTeamName,
                assignedTeamId,
                radioChannel,
                markingDate,
                notes,
                history: [initialLog],
                createdAt: now,
                updatedAt: now
            };
            worksiteList.push(savedWorksite);
        }

        await writeCollectionDB(dedicatedKey, worksiteList);
        if (opIdx !== -1) {
            operations[opIdx].worksites = worksiteList;
            await writeCollectionDB('global_operations', operations);
        }

        try {
            supabase.channel('operations-channel').send({
                type: 'broadcast',
                event: 'worksite_update',
                payload: { operationId, worksite: savedWorksite }
            }).catch(() => {});
        } catch {}

        return NextResponse.json({ success: true, worksite: savedWorksite }, { headers: NO_STORE_HEADERS });

    } catch (error) {
        console.error('[active-operations/worksites POST]', error);
        return NextResponse.json({ error: 'Enkaz kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Enkaz sil
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
        const worksiteId = searchParams.get('worksiteId');

        if (!operationId || !worksiteId) {
            return NextResponse.json({ error: 'operationId ve worksiteId gerekli' }, { status: 400 });
        }

        const dedicatedKey = `global_worksites_${operationId}`;
        const [operations, dedicatedWorksites] = await Promise.all([
            getCollectionDB('global_operations'),
            getCollectionDB(dedicatedKey)
        ]);

        const filteredBackup = (Array.isArray(dedicatedWorksites) ? dedicatedWorksites : []).filter((w: any) => w.id !== worksiteId);
        await writeCollectionDB(dedicatedKey, filteredBackup);

        const opIdx = operations.findIndex((o: any) => o.id === operationId);
        if (opIdx !== -1 && Array.isArray(operations[opIdx].worksites)) {
            operations[opIdx].worksites = operations[opIdx].worksites.filter((w: any) => w.id !== worksiteId);
            await writeCollectionDB('global_operations', operations);
        }

        try {
            supabase.channel('operations-channel').send({
                type: 'broadcast',
                event: 'worksite_delete',
                payload: { operationId, worksiteId }
            }).catch(() => {});
        } catch {}

        return NextResponse.json({ success: true, message: 'Enkaz silindi' }, { headers: NO_STORE_HEADERS });

    } catch (error) {
        console.error('[active-operations/worksites DELETE]', error);
        return NextResponse.json({ error: 'Enkaz silinemedi: ' + String(error) }, { status: 500 });
    }
}
