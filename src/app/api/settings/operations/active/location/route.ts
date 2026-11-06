export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { verifyJwt } from '@/lib/crypto';

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

// POST: Üyeden gelen konum verisini (lat, lng, speed, accuracy, battery veya points array) al ve kaydet
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
        const { memberId, lat, lng, speed, accuracy, battery, points } = payload;

        // Bireysel üye sadece kendi konumunu gönderebilir; admin başkası adına da gönderebilir
        if (!user.isAdmin && !user.isSuperAdmin && user.sub !== memberId && user.id !== memberId && user.email !== memberId) {
            return NextResponse.json({ error: 'Yetkisiz üye konumu bildirimi.' }, { status: 403 });
        }

        const incomingPoints = Array.isArray(points) && points.length > 0 
            ? points 
            : (lat !== undefined && lng !== undefined ? [{ lat, lng, speed, accuracy, battery, timestamp: Date.now() }] : []);

        if (!memberId || incomingPoints.length === 0) {
            return NextResponse.json({ error: 'Eksik veri: memberId ve en az bir koordinat gerekli' }, { status: 400 });
        }

        const operations = await getCollectionDB('global_operations');
        let updated = false;

        for (let i = 0; i < operations.length; i++) {
            if (operations[i].status !== 'Aktif') continue;

            // Bu operasyonun timlerinde bu member var mı?
            for (let t = 0; t < operations[i].teams.length; t++) {
                const team = operations[i].teams[t];
                const memberIndex = team.members.findIndex((m: any) => m.id === memberId);
                if (memberIndex !== -1) {
                    const m = team.members[memberIndex];
                    if (!m.path) m.path = [];

                    for (const pt of incomingPoints) {
                        const ptNow = pt.timestamp || Date.now();
                        let calculatedSpeed = pt.speed !== undefined ? pt.speed : 0;
                        if (m.lastLocation && m.lastLocation.lat && m.lastLocation.lng) {
                            const distKm = getDistanceFromLatLonInKm(m.lastLocation.lat, m.lastLocation.lng, pt.lat, pt.lng);
                            m.distanceCovered = (m.distanceCovered || 0) + distKm;
                            
                            if (pt.speed === undefined && m.lastLocation.timestamp) {
                                const hours = (ptNow - m.lastLocation.timestamp) / 3600000;
                                if (hours > 0) calculatedSpeed = distKm / hours;
                            }
                        } else {
                            m.distanceCovered = m.distanceCovered || 0;
                        }

                        const newLoc = {
                            lat: Number(pt.lat),
                            lng: Number(pt.lng),
                            speed: Math.round(Number(calculatedSpeed) * 10) / 10,
                            accuracy: pt.accuracy ? Number(pt.accuracy) : 15,
                            battery: pt.battery !== undefined ? Number(pt.battery) : (m.lastLocation?.battery ?? 100),
                            timestamp: ptNow
                        };

                        m.lastLocation = newLoc;
                        m.path.push(newLoc);
                        operations[i].teams[t].location = newLoc;
                    }

                    // Son 300 noktayı tut
                    if (m.path.length > 300) {
                        m.path = m.path.slice(m.path.length - 300);
                    }

                    updated = true;
                }
            }
        }

        if (updated) {
            await writeCollectionDB('global_operations', operations);

            // Supabase Realtime broadcast kanalı üzerinden haritaya anında ilet
            try {
                const latestPt = incomingPoints[incomingPoints.length - 1];
                supabase.channel('operations-channel').send({
                    type: 'broadcast',
                    event: 'location_update',
                    payload: {
                        memberId,
                        lat: Number(latestPt.lat),
                        lng: Number(latestPt.lng),
                        speed: latestPt.speed !== undefined ? Number(latestPt.speed) : undefined,
                        accuracy: latestPt.accuracy ? Number(latestPt.accuracy) : 15,
                        battery: latestPt.battery !== undefined ? Number(latestPt.battery) : 100,
                        timestamp: latestPt.timestamp || Date.now()
                    }
                }).catch(() => {});
            } catch {}

            return NextResponse.json({ success: true, message: 'Tim konumu ve hız verisi güncellendi', count: incomingPoints.length });
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
