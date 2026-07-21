import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const vehicles = await prisma.operationVehicle.findMany({
            where: { operationId: resolvedParams.id },
            include: {
                assignments: {
                    include: {
                        member: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(vehicles);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { plate, type } = body;

        if (!plate || !type) {
            return NextResponse.json({ error: 'Plaka ve araç tipi zorunludur' }, { status: 400 });
        }

        const resolvedParams = await params;
        const vehicle = await prisma.operationVehicle.create({
            data: {
                operationId: resolvedParams.id,
                plate,
                type,
                status: 'Hazırlanıyor'
            },
            include: {
                assignments: {
                    include: {
                        member: true
                    }
                }
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorId: payload.user?.id || 'system',
                actorName: payload.user?.name || 'System',
                action: 'operation.vehicle.create',
                detail: `${payload.user?.name || 'System'}, operasyona ${plate} plakalı ${type} aracını ekledi.`,
                entityType: 'OperationVehicle',
                entityId: vehicle.id,
                operationId: resolvedParams.id
            }
        });

        return NextResponse.json(vehicle);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
