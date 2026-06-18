export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getSiteSettingsDB, getSiteImagesDB, getSiteReportsDB } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint: Homepage ve diğer public sayfalar için hafif veri.
 * Büyük base64 görseller hariç.
 */
export async function GET() {
    try {
        const [
            data,
            imgs,
            reportsData,
            memberCount,
            operationCount,
            membersWithCerts
        ] = await Promise.all([
            getSiteSettingsDB(),
            getSiteImagesDB(),
            getSiteReportsDB().catch(() => ({ activityReports: [] })),
            prisma.member.count({ where: { status: 'Aktif' } }),
            prisma.operation.count({ where: { status: 'Tamamlandı' } }),
            prisma.member.findMany({
                where: { status: 'Aktif' },
                select: { certificates: true }
            })
        ]);

        let certificateCount = 0;
        membersWithCerts.forEach((m: any) => {
            if (m.certificates) {
                let parsed = [];
                if (Array.isArray(m.certificates)) {
                    parsed = m.certificates;
                } else if (typeof m.certificates === 'string') {
                    try {
                        parsed = JSON.parse(m.certificates);
                    } catch {}
                }
                if (Array.isArray(parsed)) {
                    certificateCount += parsed.length;
                }
            }
        });

        const reportCount = reportsData?.activityReports?.length || 0;

        const lite = {
            // Metin alanları
            heroTitle: data.heroTitle || '',
            heroSubtitle: data.heroSubtitle || '',
            heroBadge: data.heroBadge || '',
            heroDesc: data.heroDesc || '',
            heroVideoUrl: data.heroVideoUrl || '',
            aboutText: data.aboutText || '',
            aboutBadge: data.aboutBadge || '',
            aboutTitle: data.aboutTitle || '',
            aboutTag1: data.aboutTag1 || '',
            aboutTag2: data.aboutTag2 || '',
            aboutSections: data.aboutSections || [],
            volunteerTitle: data.volunteerTitle || '',
            volunteerSubtitle: data.volunteerSubtitle || '',
            vizyonTitle: data.vizyonTitle || '',
            vizyonBadge: data.vizyonBadge || '',
            vizyonDesc: data.vizyonDesc || '',
            vizyonText: data.vizyonText || '',
            misyonText: data.misyonText || '',
            degerlerList: data.degerlerList || [],
            liveSession: data.liveSession || {},
            activities: data.activities || [],
            announcements: data.announcements || [],
            calendarEvents: data.calendarEvents || [],
            operations: data.operations || [],
            socialMedia: data.socialMedia || {},
            bankName: data.bankName || '',
            iban: data.iban || '',
            siteTitle: data.siteTitle || '',
            siteDesc: data.siteDesc || '',
            sponsorsBadge: data.sponsorsBadge || '',
            sponsorsTitle: data.sponsorsTitle || '',
            activitiesBadge: data.activitiesBadge || '',
            activitiesTitle: data.activitiesTitle || '',
            // Görsel alanlar (siteImages.json'dan — büyük değil)
            siteLogo: imgs.siteLogo || '',
            siteFavicon: imgs.siteFavicon || '',
            heroImages: imgs.heroImages || [],
            sponsors: (imgs.sponsors && imgs.sponsors.length > 0) ? imgs.sponsors : (data.sponsors || []),
            // Report metadata (fotoğraflar hariç)
            activityReports: [],
            // Dynamic Stats for StatsSection
            stats: {
                memberCount,
                operationCount,
                reportCount,
                certificateCount
            }
        };

        const res = NextResponse.json(lite);
        // 2 dakika CDN cache — ana sayfa içeriği sık değişmez
        res.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
        return res;
    } catch (error) {
        console.error('[public GET]', error);
        return NextResponse.json({ error: 'Veriler okunamadı' }, { status: 500 });
    }
}
