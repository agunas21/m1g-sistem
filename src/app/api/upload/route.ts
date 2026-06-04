import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'

/**
 * POST /api/upload
 * 
 * Güvenli Dosya Yükleme Proxy'si:
 * Tüm medya yüklemeleri (avatar, makbuz, etkinlik görseli vb.) 
 * frontend tarafından bu adrese POST (FormData) edilir.
 * 
 * Bu route, gelen dosyayı alır ve .env'deki NEXT_PUBLIC_EXTERNAL_UPLOAD_URL 
 * adresine UPLOAD_SECRET_TOKEN ile birlikte iletir.
 * Dönen URL'i frontend'e geri verir.
 */
export async function POST(req: NextRequest) {
    let actor: any = null;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (token) actor = verifyJwt(token);
    } catch {}

    if (!actor) {
        return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Dosya gerekli.' }, { status: 400 });
        }

        const EXTERNAL_UPLOAD_URL = process.env.NEXT_PUBLIC_EXTERNAL_UPLOAD_URL;
        const SECRET_TOKEN = process.env.UPLOAD_SECRET_TOKEN;

        if (!EXTERNAL_UPLOAD_URL || !SECRET_TOKEN) {
            return NextResponse.json({ error: 'Harici sunucu upload ayarları (.env) eksik.' }, { status: 500 });
        }

        // Harici sunucuya iletmek için yeni FormData oluştur
        const externalFormData = new FormData();
        externalFormData.append('file', file);

        const externalRes = await fetch(EXTERNAL_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SECRET_TOKEN}`
            },
            body: externalFormData
        });

        if (!externalRes.ok) {
            const errText = await externalRes.text();
            throw new Error(`Harici sunucu hatası (${externalRes.status}): ${errText}`);
        }

        const externalData = await externalRes.json();
        
        if (!externalData.success || !externalData.url) {
            throw new Error(externalData.error || 'Harici sunucu URL döndürmedi.');
        }

        return NextResponse.json({
            success: true,
            url: externalData.url
        });

    } catch (e: any) {
        console.error('Upload proxy error:', e);
        return NextResponse.json({ error: e.message ?? 'Sunucu hatası.' }, { status: 500 });
    }
}
