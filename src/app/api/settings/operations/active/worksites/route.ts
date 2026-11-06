export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

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

// GET: Operasyona ait INSARAG ASR-3 enkazlarını listele
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token || !verifyJwt(token)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');

        if (!operationId) {
            return NextResponse.json({ error: 'operationId gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        const op = operations.find((o: any) => o.id === operationId);

        if (!op) {
            return NextResponse.json({ error: 'Operasyon bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ worksites: op.worksites || [] });
    } catch (error) {
        console.error('[active-operations/worksites GET]', error);
        return NextResponse.json({ error: 'Enkazlar getirilemedi: ' + String(error) }, { status: 500 });
    }
}

// POST: Yeni ASR-3 Enkazı ekle veya güncelle
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
            structureType = 'Betonarme',
            collapseType = 'Sandviç (Pancake)',
            status = 'Arama Sürüyor',
            priority = 'Yüksek (P2)',
            victims = { liveExtracted: 0, deceasedExtracted: 0, suspectedLive: 0, suspectedDeceased: 0 },
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

        const operations = await getCollectionDB('global_operations');
        let updated = false;
        let savedWorksite: INSARAGWorksite | null = null;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (!operations[i].worksites) operations[i].worksites = [];

                const now = Date.now();
                const userAuthor = (user as any).name || (user as any).email || 'Komuta Masası';
                const nowTimeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('tr-TR');

                const existingIdx = id ? operations[i].worksites.findIndex((w: any) => w.id === id) : -1;

                if (existingIdx !== -1) {
                    // Mevcut enkazı güncelle ve INSARAG Vardiya/Durum Logu oluştur
                    const prev = operations[i].worksites[existingIdx];
                    const prevHistory: INSARAGWorksiteLog[] = prev.history || [];

                    // Değişiklikleri tespit et
                    const changes: string[] = [];
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

                    operations[i].worksites[existingIdx] = {
                        ...prev,
                        code,
                        name,
                        address,
                        location,
                        structureType,
                        collapseType,
                        status,
                        priority,
                        victims,
                        hazards,
                        assignedTeamName,
                        assignedTeamId,
                        radioChannel,
                        markingDate,
                        notes,
                        history: [newLog, ...prevHistory],
                        updatedAt: now
                    };
                    savedWorksite = operations[i].worksites[existingIdx];
                } else {
                    // Yeni oluştur ve ilk saha işaretleme logunu ekle
                    const initialLog: INSARAGWorksiteLog = {
                        id: `LOG-${now}`,
                        timestamp: new Date().toISOString(),
                        timeString: nowTimeStr,
                        authorName: userAuthor,
                        action: 'ASR-3 İlk Saha İşaretlemesi Yapıldı',
                        details: notes || 'Enkaz komuta sistemine ilk kez kaydedildi',
                        newTeamName: assignedTeamName,
                        newStatus: status,
                        victimsSnapshot: {
                            liveExtracted: victims?.liveExtracted || 0,
                            deceasedExtracted: victims?.deceasedExtracted || 0,
                            suspectedLive: victims?.suspectedLive || 0
                        }
                    };

                    const newWorksite: INSARAGWorksite = {
                        id: id || `WS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        code,
                        name,
                        address,
                        location: [Number(location[0]), Number(location[1])],
                        structureType,
                        collapseType,
                        status,
                        priority,
                        victims,
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
                    operations[i].worksites.push(newWorksite);
                    savedWorksite = newWorksite;
                }

                updated = true;
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);

            // Supabase Realtime ile tüm komuta ekranlarına anında fırlat
            try {
                supabase.channel('operations-channel').send({
                    type: 'broadcast',
                    event: 'worksite_update',
                    payload: { operationId, worksite: savedWorksite }
                }).catch(() => {});
            } catch {}

            return NextResponse.json({ success: true, worksite: savedWorksite });
        } else {
            return NextResponse.json({ error: 'Operasyon bulunamadı' }, { status: 404 });
        }

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
        if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
            return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gereklidir.' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');
        const worksiteId = searchParams.get('worksiteId');

        if (!operationId || !worksiteId) {
            return NextResponse.json({ error: 'operationId ve worksiteId gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (operations[i].worksites) {
                    operations[i].worksites = operations[i].worksites.filter((w: any) => w.id !== worksiteId);
                    updated = true;
                }
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);

            try {
                supabase.channel('operations-channel').send({
                    type: 'broadcast',
                    event: 'worksite_delete',
                    payload: { operationId, worksiteId }
                }).catch(() => {});
            } catch {}

            return NextResponse.json({ success: true, message: 'Enkaz silindi' });
        } else {
            return NextResponse.json({ error: 'Enkaz veya operasyon bulunamadı' }, { status: 404 });
        }

    } catch (error) {
        console.error('[active-operations/worksites DELETE]', error);
        return NextResponse.json({ error: 'Enkaz silinemedi: ' + String(error) }, { status: 500 });
    }
}

