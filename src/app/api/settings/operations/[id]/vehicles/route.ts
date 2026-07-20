import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const vehicles = await prisma.operationVehicle.findMany({
            where: { operationId: params.id },
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

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

        const vehicle = await prisma.operationVehicle.create({
            data: {
                operationId: params.id,
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
                actorId: session.user.id || 'system',
                actorName: session.user.name || 'System',
                action: 'operation.vehicle.create',
                detail: `${session.user.name}, operasyona ${plate} plakalı ${type} aracını ekledi.`,
                entityType: 'OperationVehicle',
                entityId: vehicle.id,
                operationId: params.id
            }
        });

        return NextResponse.json(vehicle);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
