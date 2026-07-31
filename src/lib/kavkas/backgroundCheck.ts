import { prisma } from '@/lib/prisma';

export interface KavkasFlag {
  checkKey: string;
  status: "YESIL" | "SARI" | "KIRMIZI";
  reason: string;
}

export async function runBackgroundKavkasCheck(operationId: string): Promise<KavkasFlag[]> {
  const flags: KavkasFlag[] = [];

  try {
    // 1. Düzenli Raporlama: GERÇEK event sıklığına bakılır (son 4 saat)
    const recentEventsCount = await prisma.operationEvent.count({
      where: { 
        operationId, 
        timestamp: { gte: new Date(Date.now() - 4 * 3600 * 1000) } 
      },
    });

    flags.push({
      checkKey: "DUZENLI_RAPORLAMA",
      status: recentEventsCount > 0 ? "YESIL" : "KIRMIZI",
      reason: recentEventsCount > 0 
        ? `Son 4 saatte ${recentEventsCount} olay kaydı doğrulandı.` 
        : "Son 4 saatte hiç olay kaydı bulunamadı.",
    });

    // 2. Rol Eşleştirmeleri Kontrolü
    const totalRoles = await prisma.operationRoleAssignment.count({
      where: { operationId }
    });

    flags.push({
      checkKey: "ROL_ESLESTIRME",
      status: totalRoles > 0 ? "YESIL" : "SARI",
      reason: totalRoles > 0 
        ? `Operasyonel rolde ${totalRoles} personel görevlendirildi.` 
        : "Rol ataması tamamlanmamış.",
    });
  } catch (error) {
    console.error('[KAVKAS_BG_CHECK_ERROR]', error);
  }

  return flags;
}
