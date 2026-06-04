import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';


export const dynamic = 'force-dynamic';
async function getDocuments() {
    return await getCollectionDB('global_documents');
}

async function saveDocuments(data: any) {
    await writeCollectionDB('global_documents', data);
}

export async function GET() {
    return NextResponse.json(await getDocuments());
}

export async function POST(req: Request) {
    try {
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
        const { id } = await req.json();
        let documents = await getDocuments();
        documents = documents.filter((doc: any) => doc.id !== id);
        await saveDocuments(documents);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
    }
}
