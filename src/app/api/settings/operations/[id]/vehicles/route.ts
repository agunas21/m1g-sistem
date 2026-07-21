import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { getCollectionDB } from '@/lib/settings';

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

        // Ensure operation exists in Prisma Postgres DB
        let opExists = await prisma.operation.findUnique({ where: { id: resolvedParams.id } });
        if (!opExists) {
            const globalOps = await getCollectionDB('global_operations');
            const activeOp = globalOps.find((o: any) => o.id === resolvedParams.id);
            if (!activeOp) return NextResponse.json({ error: 'Operation not found in master DB' }, { status: 404 });
            
            await prisma.operation.create({
                data: {
                    id: activeOp.id,
                    name: activeOp.name || 'Bilinmeyen Operasyon',
                    type: activeOp.type || 'Eğitim',
                    status: activeOp.status || 'Aktif',
                    startTime: activeOp.startTime ? new Date(activeOp.startTime) : new Date(),
                    location: activeOp.location || null,
                    temperature: activeOp.temperature || null,
                }
            });
        }

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
                actorId: payload.id || 'system',
                actorName: payload.fullName || 'System',
                action: 'operation.vehicle.create',
                detail: `${payload.fullName || 'System'}, operasyona ${plate} plakalı ${type} aracını ekledi.`,
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
