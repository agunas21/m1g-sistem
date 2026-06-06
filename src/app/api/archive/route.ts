import { NextResponse } from "next/server";
import { getArchives, saveToArchive, ArchiveFile } from "@/lib/archiver";
import { writeLog } from "@/lib/logger";


export const dynamic = 'force-dynamic';
export async function GET() {
  const archives = await getArchives();
  return NextResponse.json({ archives });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileType, base64Data, uploadedBy, category } = body;
    
    if (!base64Data) {
      return NextResponse.json({ success: false, message: "No file data" }, { status: 400 });
    }

    // Dosyayı dış sunucuya göndermek yerine Base64 stringini arşiv json'ına koyalım
    // veya basitçe kaydedelim
    const safeFileName = fileName || "uploaded_file";

    // Save to archive json
    const fileRecord: ArchiveFile = {
      id: Date.now().toString(),
      fileName: safeFileName,
      originalName: fileName,
      url: base64Data,
      type: fileType,
      size: Math.round(base64Data.length * 0.75), // approximate byte size
      uploadedBy: uploadedBy || "Sistem",
      uploadedAt: new Date().toISOString(),
      category: category || "Genel"
    };

    await saveToArchive(fileRecord);
    
    // Log the action
    await writeLog("SUCCESS", uploadedBy || "Sistem", "Dosya Arşivlendi", safeFileName, { type: fileType, category });

    return NextResponse.json({ success: true, file: fileRecord });
  } catch (error) {
    console.error("Archive upload error", error);
    return NextResponse.json({ success: false, message: "Archive upload failed" }, { status: 500 });
  }
}
