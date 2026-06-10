import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { uploadToStorage } from '@/lib/supabase'

/**
 * POST /api/upload
 * 
 * Dosyayı alır ve base64 formatında döner.
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

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Supabase Storage'a Yükle
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        
        const publicUrl = await uploadToStorage(buffer, filename, file.type);

        if (!publicUrl) {
            return NextResponse.json({ error: 'Depolama sunucusuna yüklenemedi.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: publicUrl
        });

    } catch (e: any) {
        console.error('Upload proxy error:', e);
        return NextResponse.json({ error: e.message ?? 'Sunucu hatası.' }, { status: 500 });
    }
}
