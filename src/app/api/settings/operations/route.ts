import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'


export const dynamic = 'force-dynamic';
// ─── GET: Tüm Operasyonlar ──────────────────────────────────────────
export async function GET() {
    const operations = await prisma.operation.findMany({
        include: {
            teams: {
                include: {
                    members: {
                        include: { member: { select: { id: true, fullName: true, phone: true } } }
                    },
                    deployments: {
                        orderBy: { deployTime: 'desc' },
                        take: 1
                    }
                }
            }
        },
        orderBy: { startTime: 'desc' }
    })

    // Frontend'in beklediği formata normalize et
    const normalized = operations.map(op => ({
        ...op,
        startTime: op.startTime.toISOString(),
        endTime: op.endTime?.toISOString() ?? null,
        teams: op.teams.map(team => ({
            ...team,
            members: team.members.map(tm => ({
                memberId: tm.memberId,
                role: tm.role,
                fullName: tm.member.fullName,
                phone: tm.member.phone
            })),
            lastDeployment: team.deployments[0] ?? null,
            deployTime: team.deployments[0]?.deployTime?.toISOString() ?? null,
            returnTime: team.deployments[0]?.returnTime?.toISOString() ?? null,
            targetLocation: team.deployments[0]?.targetLocation ?? null,
            pulse: team.deployments[0]?.pulse ?? 'Yeşil'
        }))
    }))

    return NextResponse.json(normalized)
}

// ─── POST: Yeni Operasyon Başlat ────────────────────────────────────
export async function POST(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor?.isAdmin && !actor?.isSuperAdmin) {
        return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
    }

    const body = await req.json()

    const operation = await prisma.operation.create({
        data: {
            name: body.name,
            type: body.type ?? 'Doğada Arama',
            status: 'Aktif',
            location: body.location ?? null,
            temperature: body.temperature ?? null,
            radioFrequency: body.radioFrequency ?? null,
        },
        include: { teams: true }
    })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('operation.create',
        `${actorName}, "${operation.name}" operasyonunu başlattı (Tür: ${operation.type}).`,
        { actorId, actorName, ipAddress, entityType: 'Operation', entityId: operation.id, severity: 'INFO' }
    )

    return NextResponse.json({ ...operation, startTime: operation.startTime.toISOString(), teams: [] }, { status: 201 })
}

// ─── PUT: Operasyon Güncelle / Kapat ────────────────────────────────
export async function PUT(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    const body = await req.json()
    const { id, action, ...updateData } = body

    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    // Operasyon kapat
    if (action === 'close') {
        const closed = await prisma.operation.update({
            where: { id },
            data: {
                status: 'Tamamlandı',
                endTime: new Date(),
                postMortemReport: updateData.postMortemReport ?? {}
            }
        })

        await logAudit('operation.close',
            `${actorName}, "${closed.name}" operasyonunu kapattı.`,
            { actorId, actorName, ipAddress, entityType: 'Operation', entityId: id, severity: 'INFO' }
        )

        return NextResponse.json({ ...closed, endTime: closed.endTime?.toISOString() })
    }

    // Log ekle
    if (action === 'add_log') {
        const existing = await prisma.operation.findUnique({ where: { id }, select: { logs: true } })
        const logs = (existing?.logs as any[]) ?? []
        const newLog = {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            message: updateData.message,
            author: actorName
        }
        logs.push(newLog)

        await prisma.operation.update({ where: { id }, data: { logs } })

        await logAudit('operation.log',
            `${actorName}, operasyona log ekledi: "${updateData.message}"`,
            { actorId, actorName, ipAddress, entityType: 'Operation', entityId: id, operationId: id }
        )

        return NextResponse.json({ success: true, log: newLog })
    }

    // Tim ekle
    if (action === 'add_team') {
        const team = await prisma.team.create({
            data: {
                name: updateData.teamName ?? `Tim ${Date.now()}`,
                operationId: id,
                status: 'Hazırda'
            }
        })

        await logAudit('team.create',
            `${actorName}, operasyona "${team.name}" timini ekledi.`,
            { actorId, actorName, ipAddress, entityType: 'Team', entityId: team.id, operationId: id }
        )

        return NextResponse.json({ success: true, team })
    }

    // Tim sahaya sür
    if (action === 'deploy_team') {
        const { teamId, targetLocation } = updateData

        const [deployment] = await Promise.all([
            prisma.deployment.create({
                data: { teamId, targetLocation, deployTime: new Date() }
            }),
            prisma.team.update({ where: { id: teamId }, data: { status: 'Sahada' } })
        ])

        await logAudit('team.deploy',
            `${actorName}, "${teamId}" timini "${targetLocation ?? 'belirtilmemiş bölge'}"e sürdü.`,
            { actorId, actorName, ipAddress, entityType: 'Team', entityId: teamId, operationId: id }
        )

        return NextResponse.json({ success: true, deployment })
    }

    // Tim kampa çek
    if (action === 'return_team') {
        const { teamId } = updateData

        const lastDeployment = await prisma.deployment.findFirst({
            where: { teamId, returnTime: null },
            orderBy: { deployTime: 'desc' }
        })

        if (lastDeployment) {
            await prisma.deployment.update({
                where: { id: lastDeployment.id },
                data: { returnTime: new Date() }
            })
        }

        await prisma.team.update({ where: { id: teamId }, data: { status: 'Hazırda' } })

        await logAudit('team.return',
            `${actorName}, "${teamId}" timini kampa çekti.`,
            { actorId, actorName, ipAddress, entityType: 'Team', entityId: teamId, operationId: id }
        )

        return NextResponse.json({ success: true })
    }

    // Genel güncelleme
    const updated = await prisma.operation.update({ where: { id }, data: updateData })
    return NextResponse.json({ ...updated, startTime: updated.startTime.toISOString() })
}

// ─── DELETE: Operasyon Sil ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor?.isSuperAdmin) {
        return NextResponse.json({ error: 'Sadece Super Admin silebilir.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    const op = await prisma.operation.findUnique({ where: { id }, select: { name: true } })
    if (!op) return NextResponse.json({ error: 'Operasyon bulunamadı.' }, { status: 404 })

    await prisma.operation.delete({ where: { id } })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('operation.delete',
        `${actorName}, "${op.name}" operasyonunu kalıcı olarak sildi.`,
        { actorId, actorName, ipAddress, entityType: 'Operation', entityId: id, severity: 'CRITICAL' }
    )

    return NextResponse.json({ success: true })
}
