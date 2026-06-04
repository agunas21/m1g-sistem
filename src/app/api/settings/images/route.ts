export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getSiteImagesDB, writeSiteImagesDB } from '@/lib/settings';

// GET: Görsel verilerini döndür (siteLogo, siteFavicon, heroImages, sponsor logoları)
export async function GET() {
    try {
        const data = await getSiteImagesDB();
        return NextResponse.json({
            siteLogo: data.siteLogo || '',
            siteFavicon: data.siteFavicon || '',
            heroImages: data.heroImages || [],
            sponsors: data.sponsors || [],
        });
    } catch (error) {
        console.error('[images GET]', error);
        return NextResponse.json({ siteLogo: '', siteFavicon: '', heroImages: [], sponsors: [] }, { status: 500 });
    }
}

// POST: Görsel verilerini güncelle
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const existing = await getSiteImagesDB();

        const merged = { ...existing };
        if (body.siteLogo !== undefined) merged.siteLogo = body.siteLogo;
        if (body.siteFavicon !== undefined) merged.siteFavicon = body.siteFavicon;
        if (body.heroImages !== undefined) merged.heroImages = body.heroImages;
        if (body.sponsors !== undefined) merged.sponsors = body.sponsors;

        await writeSiteImagesDB(merged);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[images POST]', error);
        return NextResponse.json({ error: 'Görseller kaydedilemedi: ' + String(error) }, { status: 500 });
    }
}
