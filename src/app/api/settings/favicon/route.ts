export const dynamic = "force-dynamic";
export const revalidate = 0;

import fs from 'fs';
import path from 'path';
import { getSiteImagesDB } from '@/lib/settings';

export async function GET() {
    try {
        let siteFavicon = '';
        try {
            const data = await getSiteImagesDB();
            siteFavicon = data.siteFavicon || '';
        } catch (e) {
            console.error('Error reading siteImages DB in favicon API:', e);
        }

        if (siteFavicon && siteFavicon.startsWith('data:')) {
            const parts = siteFavicon.split(';base64,');
            if (parts.length === 2) {
                const contentType = parts[0].replace('data:', '');
                const base64Data = parts[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                return new Response(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
                    },
                });
            }
        }
        
        // Fallback: serve backup favicon.ico if it exists
        const fallbackPath = path.join(process.cwd(), 'src', 'app', 'favicon.ico.bak');
        if (fs.existsSync(fallbackPath)) {
            const buffer = fs.readFileSync(fallbackPath);
            return new Response(buffer, {
                headers: {
                    'Content-Type': 'image/x-icon',
                    'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
                },
            });
        }

        return new Response('Favicon not found', { status: 404 });
    } catch (error) {
        console.error('[favicon GET]', error);
        return new Response('Error', { status: 500 });
    }
}
