export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

// POST: Üyeden gelen konum verisini (lat, lng) al ve bağlı olduğu aktif timin konumuna yaz
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { memberId, lat, lng } = payload;

        if (!memberId || !lat || !lng) {
            return NextResponse.json({ error: 'Eksik veri: memberId, lat, lng gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].status !== 'Aktif') continue;

            // Bu operasyonun timlerinde bu member var mı ve tim "Sahada" mı?
            for (let t = 0; t < operations[i].teams.length; t++) {
                const team = operations[i].teams[t];
                if (team.status === 'Sahada') {
                    const isMemberHere = team.members.find((m: any) => m.id === memberId);
                    if (isMemberHere) {
                        // Eğer bu üye bu timdeyse, timin konumunu güncelle (Tim lideri veya üye fark etmez, herkes güncelleyebilir)
                        // Gerçekte sadece liderin konumu timin konumu sayılabilir ama basitlik için ilk ping atan timin konumu olur.
                        operations[i].teams[t].location = { lat, lng, timestamp: Date.now() };
                        updated = true;
                    }
                }
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, message: 'Tim konumu güncellendi' });
        } else {
            return NextResponse.json({ success: false, message: 'Aktif sahada olan ilgili tim bulunamadı' });
        }

    } catch (error) {
        console.error('[active-operations/location POST]', error);
        return NextResponse.json({ error: 'Konum kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}
