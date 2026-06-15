import { NextResponse } from 'next/server';
import { getSiteGalleryDB, getSiteReportsDB } from '@/lib/settings';


export const dynamic = 'force-dynamic';
/**
 * GET /api/settings/gallery?type=gallery&index=N  → galeri öğesinin fotoğrafını döndür
 * GET /api/settings/gallery?type=report&reportId=X → rapor fotoğraflarını döndür
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get('type');
        const index = parseInt(url.searchParams.get('index') || '0', 10);
        const reportId = url.searchParams.get('reportId');

        if (type === 'gallery') {
            const data = await getSiteGalleryDB();
            const gallery = data.activityGallery || [];
            const item = gallery[index];
            if (!item) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            const r = NextResponse.json({
                photo: item.photo?.url || item.image || '',
                text: item.common || '',
            });
            // 10 dakika CDN cache — galeri fotoğları nadiren değişir
            r.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
            return r;
        }

        if (type === 'report' && reportId) {
            const data = await getSiteReportsDB();
            const reports = data.activityReports || [];
            const report = reports.find((r: any) => String(r.id) === String(reportId));
            if (!report) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            const r2 = NextResponse.json({ photos: report.photos || [] });
            r2.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
            return r2;
        }

        return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
