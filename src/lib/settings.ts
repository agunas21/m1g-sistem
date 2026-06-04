import { prisma } from './prisma';

// Helper for Site Settings
export async function getSiteSettingsDB() {
    try {
        const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_settings' } });
        return conf?.value ? (conf.value as any) : {};
    } catch {
        return {};
    }
}

export async function writeSiteSettingsDB(data: any) {
    try {
        const existing = await getSiteSettingsDB();
        const merged = { ...existing, ...data };
        await prisma.siteConfig.upsert({
            where: { key: 'global_settings' },
            update: { value: merged },
            create: { key: 'global_settings', value: merged }
        });
        return merged;
    } catch (e) {
        console.error('Error writing settings:', e);
        return null;
    }
}

// Helper for Images / Galleries (to separate large payloads if needed)
export async function getSiteImagesDB() {
    try {
        const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_images' } });
        return conf?.value ? (conf.value as any) : {};
    } catch {
        return {};
    }
}

export async function writeSiteImagesDB(data: any) {
    try {
        const existing = await getSiteImagesDB();
        const merged = { ...existing, ...data };
        await prisma.siteConfig.upsert({
            where: { key: 'global_images' },
            update: { value: merged },
            create: { key: 'global_images', value: merged }
        });
        return merged;
    } catch (e) {
        console.error('Error writing images:', e);
        return null;
    }
}

export async function getSiteGalleryDB() {
    try {
        const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_gallery' } });
        return conf?.value ? (conf.value as any) : { activityGallery: [] };
    } catch {
        return { activityGallery: [] };
    }
}

export async function writeSiteGalleryDB(data: any) {
    try {
        const existing = await getSiteGalleryDB();
        const merged = { ...existing, ...data };
        await prisma.siteConfig.upsert({
            where: { key: 'global_gallery' },
            update: { value: merged },
            create: { key: 'global_gallery', value: merged }
        });
        return merged;
    } catch (e) { return null; }
}

export async function getSiteReportsDB() {
    try {
        const conf = await prisma.siteConfig.findUnique({ where: { key: 'global_reports' } });
        return conf?.value ? (conf.value as any) : { activityReports: [] };
    } catch {
        return { activityReports: [] };
    }
}

export async function writeSiteReportsDB(data: any) {
    try {
        const existing = await getSiteReportsDB();
        const merged = { ...existing, ...data };
        await prisma.siteConfig.upsert({
            where: { key: 'global_reports' },
            update: { value: merged },
            create: { key: 'global_reports', value: merged }
        });
        return merged;
    } catch (e) { return null; }
}

export async function getCollectionDB(key: string) {
    try {
        const conf = await prisma.siteConfig.findUnique({ where: { key } });
        return conf?.value ? (conf.value as any[]) : [];
    } catch {
        return [];
    }
}

export async function writeCollectionDB(key: string, data: any[]) {
    try {
        await prisma.siteConfig.upsert({
            where: { key },
            update: { value: data },
            create: { key, value: data }
        });
        return data;
    } catch (e) { return null; }
}
