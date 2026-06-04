import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

export interface ArchiveFile {
  id: string;
  fileName: string;
  originalName: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
}

export async function getArchives(): Promise<ArchiveFile[]> {
  try {
    return await getCollectionDB('global_archive');
  } catch (error) {
    return [];
  }
}

export async function saveToArchive(fileRecord: ArchiveFile) {
  try {
    const archives = await getArchives();
    archives.unshift(fileRecord);
    await writeCollectionDB('global_archive', archives);
    return fileRecord;
  } catch (error) {
    console.error("Failed to save to archive", error);
  }
}
