export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSiteImagesDB, writeSiteImagesDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';

// GET: Görsel verilerini döndür (siteLogo, siteFavicon, heroImages, sponsor logoları)
export async function GET() {
    try {
        const data = await getSiteImagesDB();
        const res = NextResponse.json({
            siteLogo: data.siteLogo || '',
            siteFavicon: data.siteFavicon || '',
            heroImages: data.heroImages || [],
            sponsors: data.sponsors || [],
        });
        // Görseller nadiren değişir — 1 dakika CDN cache
        res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return res;
    } catch (error) {
        console.error('[images GET]', error);
        return NextResponse.json({ siteLogo: '', siteFavicon: '', heroImages: [], sponsors: [] }, { status: 500 });
    }
}

// POST: Görsel verilerini güncelle
export async function POST(req: Request) {
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
