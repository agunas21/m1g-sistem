import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';
import { getCollectionDB } from '@/lib/settings';

const KAVKAS_REPORTS = [
  'OPERASYONLAR',
  'PLANLAMA_SONUC',
  'MUHENDISLIK',
  'GUVENLIK',
  'LOJISTIK',
  'US_LOJISTIGI',
  'ULASTIRMA_ARAC_LOJISTIGI'
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const token = (await cookies()).get('m1g_session')?.value;
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // const user = verifyJwt(token);
    // if (!user || !user.sub) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { id: operationId } = await params;

    // 1. Fetch operation details and all events
    let operation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!operation) {
      // Fallback: Check if it exists in the active JSON store but hasn't been synced to Prisma yet
      const globalOps = await getCollectionDB('global_operations');
      const activeOp = globalOps.find((o: any) => o.id === operationId);
      
      if (!activeOp) {
        return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
      }

      // Sync it to Prisma to satisfy foreign key constraints for reports
      operation = await prisma.operation.create({
        data: {
          id: activeOp.id,
          name: activeOp.name || 'Bilinmeyen Operasyon',
          type: activeOp.type || 'Eğitim',
          status: activeOp.status || 'Aktif',
          startTime: activeOp.startTime ? new Date(activeOp.startTime) : new Date(),
          location: activeOp.location || null,
          description: activeOp.description || null,
          temperature: activeOp.temperature || null,
        },
        include: {
          events: true
        }
      });
    }

    // 2. Generate Draft Reports based on Events
    // In a real C4ISR system, this is where LLM integration or heavy map-reduce pipelines run.
    // For now, we generate structured templates summarizing the events.
    
    const generatedReports = [];
    
    for (const reportType of KAVKAS_REPORTS) {
      // Find the current latest version to increment
      const lastReport = await prisma.operationReport.findFirst({
        where: { operationId, type: reportType as any },
        orderBy: { version: 'desc' }
      });
      
      const newVersion = lastReport ? lastReport.version + 1 : 1;

      // Temel filtreleme (Event'leri type'a göre sınıflandır)
      const relevantEvents = operation.events.filter(e => {
        if (reportType === 'PLANLAMA_SONUC') return e.type === 'STATUS_UPDATE' || e.type === 'PLANNING';
        if (reportType === 'LOJISTIK' || reportType === 'US_LOJISTIGI' || reportType === 'ULASTIRMA_ARAC_LOJISTIGI') return e.type === 'RESOURCE_ALLOCATION' || e.type === 'LOGISTICS';
        if (reportType === 'MUHENDISLIK') return e.type === 'ENGINEERING';
        if (reportType === 'GUVENLIK') return e.type === 'SECURITY' || e.type === 'HAZARD';
        return true; // 'OPERASYONLAR' veya diğer tüm raporlar için tüm eventler
      });

      const eventCount = relevantEvents.length;
      
      let draftContent: any = {
        metrics: {
          totalEventsAnalyzed: eventCount,
          operationDurationHours: 0,
        },
        timeline: relevantEvents.map(e => ({ time: e.timestamp, type: e.type, actor: e.actorName })),
        gaps: []
      };

      if (eventCount === 0) {
        draftContent.summary = `Bu ${reportType} raporu için ilişkili (Ledger) veri bulunamadı.`;
        draftContent.gaps.push("Saha operasyon kaydı (Mission Ledger) verisi eksik.");
      } else {
        draftContent.summary = `${reportType} raporu, ${eventCount} adet saha kaydından derlenmiştir. Bu rapor KAFKAS Operasyonel Zeka sistemi tarafından üretilen taslak versiyondur.`;
        
        // Dinamik içerik ekle
        if (reportType === 'PLANLAMA_SONUC') {
          draftContent.areaCoverage = {
            scannedPercentage: "%" + Math.min(100, eventCount * 15),
            criticalSector: operation.location || 'Bilinmiyor'
          };
        } else if (reportType === 'ULASTIRMA_ARAC_LOJISTIGI') {
          draftContent.vehicleAnalysis = {
            totalKm: eventCount * 45,
            fuelConsumed: eventCount * 12
          };
        } else if (reportType === 'LOJISTIK' || reportType === 'US_LOJISTIGI') {
           draftContent.logistics = {
             totalAllocations: eventCount
           };
        }
      }

      const newReport = await prisma.operationReport.create({
        data: {
          operationId,
          type: reportType as any,
          content: draftContent,
          version: newVersion,
          draftGeneratedAt: new Date()
        }
      });
      
      generatedReports.push(newReport);
    }

    return NextResponse.json({ 
      success: true, 
      message: '7 adet KAVKAS taslak raporu başarıyla üretildi.',
      reports: generatedReports 
    });

  } catch (error: any) {
    console.error('[GENERATE_REPORTS_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get('m1g_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: operationId } = await params;

    // Fetch the latest version of each report for the operation
    const reports = await prisma.operationReport.findMany({
      where: { operationId },
      orderBy: { version: 'desc' }
    });

    // We only want the latest version per type
    const latestReportsMap = new Map();
    reports.forEach(r => {
      if (!latestReportsMap.has(r.type)) {
        latestReportsMap.set(r.type, r);
      }
    });

    return NextResponse.json(Array.from(latestReportsMap.values()));
  } catch (error: any) {
    console.error('[GENERATE_REPORTS_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
