export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

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
    createdAt: number;
    updatedAt: number;
}

// GET: Operasyona ait ASR-1 sektörlerini listele
export async function GET(req: Request) {
    try {
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

        return NextResponse.json({ sectors: op.sectors || [] });
    } catch (error) {
        console.error('[active-operations/sectors GET]', error);
        return NextResponse.json({ error: 'Sektörler getirilemedi: ' + String(error) }, { status: 500 });
    }
}

// POST: Yeni ASR-1 Sektörü ekle veya güncelle
export async function POST(req: Request) {
    try {
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
            color = '#3b82f6'
        } = payload;

        if (!operationId || !code || !name || !polygon || polygon.length < 3) {
            return NextResponse.json({ error: 'Eksik veri: operationId, code, name ve en az 3 noktalı poligon gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;
        let savedSector: ASR1Sector | null = null;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (!operations[i].sectors) operations[i].sectors = [];

                const now = Date.now();
                const existingIdx = id ? operations[i].sectors.findIndex((s: any) => s.id === id) : -1;

                if (existingIdx !== -1) {
                    // Güncelle
                    operations[i].sectors[existingIdx] = {
                        ...operations[i].sectors[existingIdx],
                        code,
                        name,
                        polygon,
                        assignedTeamName,
                        assignedTeamId,
                        status,
                        priority,
                        hazards,
                        radioChannel,
                        notes,
                        color,
                        updatedAt: now
                    };
                    savedSector = operations[i].sectors[existingIdx];
                } else {
                    // Yeni oluştur
                    const newSector: ASR1Sector = {
                        id: id || `SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        code,
                        name,
                        polygon,
                        assignedTeamName,
                        assignedTeamId,
                        status,
                        priority,
                        hazards,
                        radioChannel,
                        notes,
                        color,
                        createdAt: now,
                        updatedAt: now
                    };
                    operations[i].sectors.push(newSector);
                    savedSector = newSector;
                }

                updated = true;
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, sector: savedSector });
        } else {
            return NextResponse.json({ error: 'Operasyon bulunamadı' }, { status: 404 });
        }

    } catch (error) {
        console.error('[active-operations/sectors POST]', error);
        return NextResponse.json({ error: 'Sektör kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Sektör sil
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');
        const sectorId = searchParams.get('sectorId');

        if (!operationId || !sectorId) {
            return NextResponse.json({ error: 'operationId ve sectorId gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                if (operations[i].sectors) {
                    operations[i].sectors = operations[i].sectors.filter((s: any) => s.id !== sectorId);
                    updated = true;
                }
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, message: 'Sektör silindi' });
        } else {
            return NextResponse.json({ error: 'Sektör veya operasyon bulunamadı' }, { status: 404 });
        }

    } catch (error) {
        console.error('[active-operations/sectors DELETE]', error);
        return NextResponse.json({ error: 'Sektör silinemedi: ' + String(error) }, { status: 500 });
    }
}
