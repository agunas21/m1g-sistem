export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

// Mesafe hesaplama (Haversine formülü) - kilometre cinsinden döner
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Yerkürenin yarıçapı km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180)
}

// POST: Üyeden gelen konum verisini (lat, lng, speed, accuracy, battery) al ve bireysel olarak kaydet
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { memberId, lat, lng, speed, accuracy, battery } = payload;

        if (!memberId || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Eksik veri: memberId, lat, lng gerekli' }, { status: 400 });
        }

        const now = Date.now();
        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].status !== 'Aktif') continue;

            // Bu operasyonun timlerinde bu member var mı? (Kampta veya Sahada fark etmez, takip et)
            for (let t = 0; t < operations[i].teams.length; t++) {
                const team = operations[i].teams[t];
                const memberIndex = team.members.findIndex((m: any) => m.id === memberId);
                if (memberIndex !== -1) {
                        const m = team.members[memberIndex];
                        
                        // Hız hesabı (Eğer cihazdan speed gelmediyse mesafe/zaman üzerinden hesapla)
                        let calculatedSpeed = speed !== undefined ? speed : 0;
                        if (m.lastLocation && m.lastLocation.lat && m.lastLocation.lng) {
                            const distKm = getDistanceFromLatLonInKm(m.lastLocation.lat, m.lastLocation.lng, lat, lng);
                            m.distanceCovered = (m.distanceCovered || 0) + distKm;
                            
                            if (speed === undefined && m.lastLocation.timestamp) {
                                const hours = (now - m.lastLocation.timestamp) / 3600000;
                                if (hours > 0) calculatedSpeed = distKm / hours;
                            }
                        } else {
                            m.distanceCovered = m.distanceCovered || 0;
                        }

                        const newLocation = { 
                            lat: Number(lat), 
                            lng: Number(lng), 
                            speed: Math.round(Number(calculatedSpeed) * 10) / 10,
                            accuracy: accuracy ? Number(accuracy) : 15,
                            battery: battery !== undefined ? Number(battery) : (m.lastLocation?.battery ?? 100),
                            timestamp: now 
                        };
                        
                        m.lastLocation = newLocation;
                        
                        // Yolu (path) kaydet
                        if (!m.path) m.path = [];
                        m.path.push(newLocation);
                        
                        // Çok uzamaması için son 200 noktayı tut
                        if (m.path.length > 200) {
                            m.path = m.path.slice(m.path.length - 200);
                        }

                        // Timin genel konumunu da güncelleyelim
                        operations[i].teams[t].location = newLocation;
                        updated = true;
                    }
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);

            // Supabase Realtime broadcast kanalı üzerinden haritaya anında ilet
            try {
                supabase.channel('operations-channel').send({
                    type: 'broadcast',
                    event: 'location_update',
                    payload: {
                        memberId,
                        lat: Number(lat),
                        lng: Number(lng),
                        speed: speed !== undefined ? Number(speed) : undefined,
                        accuracy: accuracy ? Number(accuracy) : 15,
                        battery: battery !== undefined ? Number(battery) : 100,
                        timestamp: now
                    }
                }).catch(() => {});
            } catch {}

            return NextResponse.json({ success: true, message: 'Tim konumu ve hız verisi güncellendi' });
        } else {
            return NextResponse.json({ success: false, message: 'Aktif sahada olan ilgili tim bulunamadı' });
        }

    } catch (error) {
        console.error('[active-operations/location POST]', error);
        return NextResponse.json({ error: 'Konum kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}

// DELETE: Operasyona ait eski GPS konumlarını ve rotaları sıfırla
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const operationId = searchParams.get('operationId');

        if (!operationId) {
            return NextResponse.json({ error: 'operationId gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].id === operationId) {
                // Tüm timlerin ve üyelerin eski GPS ve rota verilerini sıfırla
                if (operations[i].teams) {
                    for (let t = 0; t < operations[i].teams.length; t++) {
                        operations[i].teams[t].location = undefined;
                        if (operations[i].teams[t].members) {
                            for (let m = 0; m < operations[i].teams[t].members.length; m++) {
                                operations[i].teams[t].members[m].lastLocation = undefined;
                                operations[i].teams[t].members[m].path = [];
                                operations[i].teams[t].members[m].distanceCovered = 0;
                            }
                        }
                    }
                }
                updated = true;
                break;
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);
            return NextResponse.json({ success: true, message: 'Operasyonun eski GPS konumları ve rotaları başarıyla temizlendi' });
        } else {
            return NextResponse.json({ error: 'Operasyon bulunamadı' }, { status: 404 });
        }
    } catch (error) {
        console.error('[active-operations/location DELETE]', error);
        return NextResponse.json({ error: 'Konumlar temizlenemedi: ' + String(error) }, { status: 500 });
    }
}
