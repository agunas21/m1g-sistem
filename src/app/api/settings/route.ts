export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getSiteSettingsDB, writeSiteSettingsDB } from '@/lib/settings';

// GET: Metin ayarlarını döndür (görseller hariç — hafif)
export async function GET() {
    try {
        const data = await getSiteSettingsDB();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[settings GET]', error);
        return NextResponse.json({ error: 'Ayarlar okunamadı' }, { status: 500 });
    }
}

// POST: Metin ayarlarını kaydet (görseller burada değil, /api/settings/images'de)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Mevcut veriyle birleştir
        const existing = await getSiteSettingsDB();

        // Sadece metin/meta alanlarını güncelle; görsel alanlarına dokunma
        const imageFields = ['heroImages', 'activityGallery', 'activityReports', 'siteLogo'];
        const clean = { ...body };
        for (const field of imageFields) {
            delete clean[field];
        }

        // Sponsors: logo varsa siteImages'e taşınacak, burada sadece meta
        if (clean.sponsors) {
            clean.sponsors = clean.sponsors.map((s: any) => ({
                id: s.id,
                name: s.name,
                role: s.role,
                // logo bilgisini de tut (küçükse)
                ...(s.logo && s.logo.length < 500000 ? { logo: s.logo } : {})
            }));
        }

        const merged = { ...existing, ...clean };
        await writeSiteSettingsDB(merged);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[settings POST]', error);
        return NextResponse.json({ error: 'Kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}
