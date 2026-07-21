import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { vehicleId, memberId, role } = body;

        if (!vehicleId || !memberId || !role) {
            return NextResponse.json({ error: 'Araç, personel ve rol zorunludur' }, { status: 400 });
        }

        // Önce aynı personelin bu araçta başka bir rolü varsa güncelleyebiliriz veya silebiliriz
        // Şimdilik basitleştirmek adına UPSERT veya sadece CREATE yapıyoruz
        
        const resolvedParams = await params;
        
        // Personelin operasyondaki başka araç atamalarını kaldıralım (bir personel aynı anda iki araca binemez)
        await prisma.operationVehicleAssignment.deleteMany({
            where: {
                memberId: memberId,
                vehicle: {
                    operationId: resolvedParams.id
                }
            }
        });

        const assignment = await prisma.operationVehicleAssignment.create({
            data: {
                vehicleId,
                memberId,
                role
            },
            include: {
                member: true,
                vehicle: true
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorId: payload.id || 'system',
                actorName: payload.fullName || 'System',
                action: 'operation.vehicle.assign',
                detail: `${payload.fullName || 'System'}, ${assignment.member.fullName} isimli personeli ${assignment.vehicle.plate} plakalı araca "${role}" olarak atadı.`,
                entityType: 'OperationVehicleAssignment',
                entityId: assignment.id,
                operationId: resolvedParams.id
            }
        });

        return NextResponse.json(assignment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
