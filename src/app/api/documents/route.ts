import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
async function getDocuments() {
    return await getCollectionDB('global_documents');
}

async function saveDocuments(data: any) {
    await writeCollectionDB('global_documents', data);
}

export async function GET() {
    const res = NextResponse.json(await getDocuments());
    // 5 dakika CDN cache — döküman listesi sık değişmez
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res;
}

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

        const payload = await req.json();
        const documents = await getDocuments();
        
        const newDoc = {
            id: `doc-${Date.now()}`,
            title: payload.title || "Yeni Döküman",
            desc: payload.desc || "",
            type: payload.type || "PDF",
            size: payload.size || "Bilinmiyor",
            icon: payload.icon || "FileText",
            color: payload.color || "neutral",
            url: payload.url || ""
        };

        documents.push(newDoc);
        await saveDocuments(documents);

        return NextResponse.json({ success: true, document: newDoc });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create document" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
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

        const { id } = await req.json();
        let documents = await getDocuments();
        documents = documents.filter((doc: any) => doc.id !== id);
        await saveDocuments(documents);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
    }
}
