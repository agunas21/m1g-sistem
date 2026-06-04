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

    const externalUploadUrl = process.env.NEXT_PUBLIC_EXTERNAL_UPLOAD_URL;
    const uploadSecretToken = process.env.UPLOAD_SECRET_TOKEN;

    if (!externalUploadUrl || !uploadSecretToken) {
      return NextResponse.json({ success: false, message: "Upload provider configured incorrectly." }, { status: 500 });
    }

    // Clean base64 string
    const base64Clean = base64Data.split(';base64,').pop();
    const buffer = Buffer.from(base64Clean, 'base64');
    
    const blob = new Blob([buffer], { type: fileType || 'application/octet-stream' });
    const proxyFormData = new FormData();
    proxyFormData.append('file', blob, fileName || 'upload.bin');
    proxyFormData.append('secret', uploadSecretToken);

    const response = await fetch(externalUploadUrl, {
        method: 'POST',
        body: proxyFormData
    });

    if (!response.ok) {
        throw new Error("Harici sunucuya yükleme başarısız oldu.");
    }

    const responseData = await response.json();

    const safeFileName = responseData.fileName || fileName || "uploaded_file";

    // Save to archive json
    const fileRecord: ArchiveFile = {
      id: Date.now().toString(),
      fileName: safeFileName,
      originalName: fileName,
      url: responseData.url,
      type: fileType,
      size: Math.round(base64Clean.length * 0.75), // approximate byte size
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
