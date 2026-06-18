import { NextResponse } from "next/server";
import { getArchives, saveToArchive, ArchiveFile } from "@/lib/archiver";
import { writeLog } from "@/lib/logger";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/crypto";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    
    const payload = verifyJwt(token);
    if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

    const archives = await getArchives();
    const res = NextResponse.json({ archives });
    res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
    return res;
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    
    const payload = verifyJwt(token);
    if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

    const body = await req.json();
    const { fileName, fileType, base64Data, uploadedBy, category } = body;
    
    if (!base64Data) {
      return NextResponse.json({ success: false, message: "No file data" }, { status: 400 });
    }

    const safeFileName = fileName || "uploaded_file";

    const fileRecord: ArchiveFile = {
      id: Date.now().toString(),
      fileName: safeFileName,
      originalName: fileName,
      url: base64Data,
      type: fileType,
      size: Math.round(base64Data.length * 0.75), // approximate byte size
      uploadedBy: uploadedBy || payload.fullName || "Admin",
      uploadedAt: new Date().toISOString(),
      category: category || "Genel"
    };

    await saveToArchive(fileRecord);
    
    await writeLog("SUCCESS", uploadedBy || payload.fullName || "Admin", "Dosya Arşivlendi", safeFileName, { type: fileType, category });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("Archive upload error", error);
    return NextResponse.json({ success: false, message: "Archive upload failed" }, { status: 500 });
  }
}
