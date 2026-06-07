import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'

export const dynamic = 'force-dynamic';

// PATCH: Video Güncelle
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor || (!actor.isAdmin && !actor.isSuperAdmin)) {
        return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
    }

    try {
        const { id } = await context.params;
        const body = await req.json()
        
        const updatedVideo = await prisma.video.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                url: body.url,
                order: body.order
            }
        })

        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)

        await logAudit('video.update', `${actorName}, "${updatedVideo.title}" adlı eğitim videosunu güncelledi.`, {
            actorId, actorName, ipAddress,
            entityType: 'Video', entityId: id
        })

        return NextResponse.json(updatedVideo)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// DELETE: Video Sil
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor || (!actor.isAdmin && !actor.isSuperAdmin)) {
        return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 })
    }

    try {
        const { id } = await context.params;
        const video = await prisma.video.findUnique({ where: { id } })
        if (!video) return NextResponse.json({ error: 'Video bulunamadı.' }, { status: 404 })

        await prisma.video.delete({ where: { id } })

        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)

        await logAudit('video.delete', `${actorName}, "${video.title}" adlı eğitim videosunu sildi.`, {
            actorId, actorName, ipAddress,
            entityType: 'Video', entityId: id, severity: 'WARN'
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
