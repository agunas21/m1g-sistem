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
        const roles = await prisma.operationRoleAssignment.findMany({
            where: { operationId: resolvedParams.id },
            include: {
                member: true
            }
        });

        return NextResponse.json(roles);
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
        const { memberId, roleTitle } = body;

        if (!memberId || !roleTitle) {
            return NextResponse.json({ error: 'Personel ve Görev Unvanı zorunludur' }, { status: 400 });
        }

        const resolvedParams = await params;
        // Aynı göreve aynı kişiyi tekrar atamamak için upsert veya delete yapabiliriz
        const existing = await prisma.operationRoleAssignment.findUnique({
            where: {
                operationId_memberId_roleTitle: {
                    operationId: resolvedParams.id,
                    memberId,
                    roleTitle
                }
            }
        });

        if (existing) {
             return NextResponse.json({ error: 'Bu personel zaten bu göreve atanmış.' }, { status: 400 });
        }

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

        const role = await prisma.operationRoleAssignment.create({
            data: {
                operationId: resolvedParams.id,
                memberId,
                roleTitle
            },
            include: {
                member: true
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                actorId: payload.id || 'system',
                actorName: payload.fullName || 'System',
                action: 'operation.role.assign',
                detail: `${payload.fullName || 'System'}, ${role.member.fullName} isimli personeli "${roleTitle}" olarak atadı.`,
                entityType: 'OperationRoleAssignment',
                entityId: role.id,
                operationId: resolvedParams.id
            }
        });

        return NextResponse.json(role);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
 
         const body = await req.json();
         const { roleId } = body;
 
         if (!roleId) {
             return NextResponse.json({ error: 'Görev ID zorunludur' }, { status: 400 });
         }
 
         const resolvedParams = await params;
         const deletedRole = await prisma.operationRoleAssignment.delete({
             where: { id: roleId },
             include: { member: true }
         });
 
         // Audit Log
         await prisma.auditLog.create({
             data: {
                 actorId: payload.id || 'system',
                 actorName: payload.fullName || 'System',
                 action: 'operation.role.remove',
                 detail: `${payload.fullName || 'System'}, ${deletedRole.member.fullName} isimli personelin "${deletedRole.roleTitle}" görevini iptal etti.`,
                 entityType: 'OperationRoleAssignment',
                 entityId: deletedRole.id,
                 operationId: resolvedParams.id
             }
         });
 
         return NextResponse.json({ success: true });
    } catch(error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
