import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

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
  { params }: { params: { id: string } }
) {
  try {
    const token = (await cookies()).get('m1g_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = verifyJwt(token);
    if (!user || !user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: operationId } = params;

    // 1. Fetch operation details and all events
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
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

      // Basic aggregation logic example for template
      const eventCount = operation.events.length;
      
      const draftContent = {
        summary: `Bu rapor sistem tarafından otomatik olarak ${eventCount} adet Mission Ledger kaydından derlenmiştir.`,
        metrics: {
          totalEventsAnalyzed: eventCount,
          operationDurationHours: 0, // calculate from first and last event
        },
        timeline: operation.events.map(e => ({ time: e.timestamp, type: e.type })),
        gaps: ["Gelişmiş AI analizi henüz çalıştırılmadı."]
      };

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
