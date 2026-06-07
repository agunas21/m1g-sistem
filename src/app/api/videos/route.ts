import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'

export const dynamic = 'force-dynamic';

// GET: Videoları listele
export async function GET(req: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { order: 'asc' }
        })
        return NextResponse.json(videos)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Yeni video ekle
export async function POST(req: NextRequest) {
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
        const body = await req.json()
        const newVideo = await prisma.video.create({
            data: {
                title: body.title,
                description: body.description,
                url: body.url,
                order: body.order || 0
            }
        })

        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)

        await logAudit('video.create', `${actorName}, "${newVideo.title}" adlı yeni bir eğitim videosu ekledi.`, {
            actorId, actorName, ipAddress,
            entityType: 'Video', entityId: newVideo.id
        })

        return NextResponse.json(newVideo, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
