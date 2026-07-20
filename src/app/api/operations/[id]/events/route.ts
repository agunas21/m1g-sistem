import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

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
    const body = await request.json();

    // Mission Ledger: Append-only event
    const event = await prisma.operationEvent.create({
      data: {
        operationId,
        actorId: user.sub as string,
        
        type: body.type,
        entityType: body.entityType,
        entityId: body.entityId,
        role: body.role,
        lat: body.lat,
        lng: body.lng,
        payload: body.payload || {},
        sourceType: body.sourceType || 'SYSTEM',
        confidence: body.confidence !== undefined ? body.confidence : 1.0,
        isDecision: body.isDecision || false,
        decisionImpactScore: body.decisionImpactScore,
        isCorrection: body.isCorrection || false,
        correctedEventId: body.correctedEventId,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('[OPERATION_EVENT_POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const events = await prisma.operationEvent.findMany({
      where: { operationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { fullName: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('[OPERATION_EVENT_GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
