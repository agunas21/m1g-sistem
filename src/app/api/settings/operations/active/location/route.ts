export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

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

// POST: Üyeden gelen konum verisini (lat, lng) al ve bireysel olarak kaydet
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

            // Bu operasyonun timlerinde bu member var mı? (Kampta veya Sahada fark etmez, takip et)
            for (let t = 0; t < operations[i].teams.length; t++) {
                const team = operations[i].teams[t];
                const memberIndex = team.members.findIndex((m: any) => m.id === memberId);
                if (memberIndex !== -1) {
                        const m = team.members[memberIndex];
                        
                        const newLocation = { lat, lng, timestamp: Date.now() };
                        
                        // Mesafe hesapla
                        if (m.lastLocation && m.lastLocation.lat && m.lastLocation.lng) {
                            const distKm = getDistanceFromLatLonInKm(m.lastLocation.lat, m.lastLocation.lng, lat, lng);
                            m.distanceCovered = (m.distanceCovered || 0) + distKm;
                        } else {
                            m.distanceCovered = m.distanceCovered || 0;
                        }
                        
                        m.lastLocation = newLocation;
                        
                        // Yolu (path) kaydet
                        if (!m.path) m.path = [];
                        m.path.push(newLocation);
                        
                        // Çok uzamaması için son 100 noktayı tut
                        if (m.path.length > 100) {
                            m.path = m.path.slice(m.path.length - 100);
                        }

                        // Timin genel konumunu da (basitlik için) güncelleyelim
                        operations[i].teams[t].location = newLocation;
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
