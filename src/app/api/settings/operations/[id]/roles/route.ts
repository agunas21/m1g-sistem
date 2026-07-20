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

        const roles = await prisma.operationRoleAssignment.findMany({
            where: { operationId: params.id },
            include: {
                member: true
            }
        });

        return NextResponse.json(roles);
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
        const { memberId, roleTitle } = body;

        if (!memberId || !roleTitle) {
            return NextResponse.json({ error: 'Personel ve Görev Unvanı zorunludur' }, { status: 400 });
        }

        // Aynı göreve aynı kişiyi tekrar atamamak için upsert veya delete yapabiliriz
        const existing = await prisma.operationRoleAssignment.findUnique({
            where: {
                operationId_memberId_roleTitle: {
                    operationId: params.id,
                    memberId,
                    roleTitle
                }
            }
        });

        if (existing) {
             return NextResponse.json({ error: 'Bu personel zaten bu göreve atanmış.' }, { status: 400 });
        }

        const role = await prisma.operationRoleAssignment.create({
            data: {
                operationId: params.id,
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
                actorId: session.user.id || 'system',
                actorName: session.user.name || 'System',
                action: 'operation.role.assign',
                detail: `${session.user.name}, ${role.member.name} isimli personele "${roleTitle}" görevini atadı.`,
                entityType: 'OperationRoleAssignment',
                entityId: role.id,
                operationId: params.id
            }
        });

        return NextResponse.json(role);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
         const session = await getServerSession(authOptions);
         if (!session?.user) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         }
 
         const body = await req.json();
         const { roleId } = body;
 
         if (!roleId) {
             return NextResponse.json({ error: 'Görev ID zorunludur' }, { status: 400 });
         }
 
         const role = await prisma.operationRoleAssignment.delete({
             where: { id: roleId },
             include: { member: true }
         });
 
         // Audit Log
         await prisma.auditLog.create({
             data: {
                 actorId: session.user.id || 'system',
                 actorName: session.user.name || 'System',
                 action: 'operation.role.unassign',
                 detail: `${session.user.name}, ${role.member.name} isimli personelin "${role.roleTitle}" görevini iptal etti.`,
                 entityType: 'OperationRoleAssignment',
                 entityId: role.id,
                 operationId: params.id
             }
         });
 
         return NextResponse.json({ success: true });
    } catch(error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
