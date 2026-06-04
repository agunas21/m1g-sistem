export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getSiteGalleryDB, writeSiteGalleryDB, getSiteReportsDB, writeSiteReportsDB } from '@/lib/settings';

async function readGallery(): Promise<any> {
    return await getSiteGalleryDB();
}

async function writeGallery(data: any): Promise<void> {
    await writeSiteGalleryDB(data);
}

async function readReports(): Promise<any> {
    return await getSiteReportsDB();
}

async function writeReports(data: any): Promise<void> {
    await writeSiteReportsDB(data);
}

export async function GET() {
    try {
        const galleryData = await readGallery();
        const reportsData = await readReports();

        return NextResponse.json({
            activityGallery: galleryData.activityGallery || [],
            activityReports: reportsData.activityReports || []
        });
    } catch (error) {
        console.error('[activities GET]', error);
        return NextResponse.json({ error: 'Etkinlik verileri okunamadı' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. action="upload_image" 
        if (body.action === 'upload_image') {
            const current = await readGallery();
            const images = current.activityGallery || [];
            images.unshift({
                id: Date.now().toString(),
                data: body.image,
                createdAt: new Date().toISOString()
            });
            await writeGallery({ activityGallery: images });
            return NextResponse.json({ success: true });
        }

        // 2. action="delete_image"
        if (body.action === 'delete_image') {
            const current = await readGallery();
            const images = current.activityGallery || [];
            const filtered = images.filter((img: any) => img.id !== body.id);
            await writeGallery({ activityGallery: filtered });
            return NextResponse.json({ success: true });
        }

        // 3. action="upload_report"
        if (body.action === 'upload_report') {
            const current = await readReports();
            const reports = current.activityReports || [];
            reports.unshift({
                id: Date.now().toString(),
                title: body.title || 'Faaliyet Raporu',
                period: body.period || 'Dönem Belirtilmemiş',
                pdfData: body.pdfData, 
                createdAt: new Date().toISOString()
            });
            await writeReports({ activityReports: reports });
            return NextResponse.json({ success: true });
        }

        // 4. action="delete_report"
        if (body.action === 'delete_report') {
            const current = await readReports();
            const reports = current.activityReports || [];
            const filtered = reports.filter((rep: any) => rep.id !== body.id);
            await writeReports({ activityReports: filtered });
            return NextResponse.json({ success: true });
        }

        // 5. Bulk Update (UI Save)
        if (body.activityGallery !== undefined || body.activityReports !== undefined) {
            if (body.activityGallery !== undefined) {
                await writeGallery({ activityGallery: body.activityGallery });
            }
            if (body.activityReports !== undefined) {
                await writeReports({ activityReports: body.activityReports });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Geçersiz eylem' }, { status: 400 });

    } catch (error) {
        console.error('[activities POST]', error);
        return NextResponse.json({ error: 'İşlem başarısız: ' + String(error) }, { status: 500 });
    }
}
