import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'


export const dynamic = 'force-dynamic';
// ─── GET: Envanter Listesi ──────────────────────────────────────────
export async function GET() {
    const items = await prisma.inventoryItem.findMany({
        orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(items)
}

// ─── POST: Yeni Malzeme Ekle ────────────────────────────────────────
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
    const newId = body.id || `eq-${Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')}`

    const item = await prisma.inventoryItem.create({
        data: {
            id: newId,
            name: body.name,
            category: body.category ?? 'Kişisel Koruyucu',
            status: 'Depoda',
            isContainer: body.isContainer ?? false,
            containerItems: [],
            condition: body.condition ?? 'Yeni',
            type: body.type ?? 'Demirbaş',
            expirationDate: body.expirationDate ?? null,
            maintenanceDate: body.maintenanceDate ?? null,
            lastMaintenance: '-',
        }
    })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('inventory.create', `${actorName}, "${item.name}" malzemesini depoya ekledi.`, {
        actorId, actorName, ipAddress, entityType: 'Inventory', entityId: item.id
    })

    return NextResponse.json(item, { status: 201 })
}

// ─── PUT: Malzeme Güncelle ──────────────────────────────────────────
export async function PUT(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    // containerItems normalize — her zaman string ID
    if (updateData.containerItems && Array.isArray(updateData.containerItems)) {
        updateData.containerItems = updateData.containerItems.map((v: any) =>
            typeof v === 'string' ? v : (v?.id ? String(v.id) : String(v))
        )
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Malzeme bulunamadı.' }, { status: 404 })

    const updated = await prisma.inventoryItem.update({
        where: { id },
        data: updateData
    })

    // Zimmet değişikliği audit
    if (actor && existing.assignedToId !== updated.assignedToId) {
        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)

        if (updated.assignedToId) {
            const member = await prisma.member.findUnique({
                where: { id: updated.assignedToId },
                select: { fullName: true }
            })
            await logAudit('inventory.assign',
                `${actorName}, "${updated.name}" malzemesini "${member?.fullName ?? updated.assignedToId}" kişisine zimmetledi.`,
                { actorId, actorName, ipAddress, entityType: 'Inventory', entityId: id }
            )
        } else {
            await logAudit('inventory.return',
                `${actorName}, "${updated.name}" malzemesini depoya iade etti.`,
                { actorId, actorName, ipAddress, entityType: 'Inventory', entityId: id }
            )
        }
    }

    // Hasar durumu değişikliği audit
    if (actor && existing.status !== updated.status && (updated.status === 'Bakımda' || updated.status === 'Kayıp/Hurda')) {
        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)
        await logAudit('inventory.damage',
            `${actorName}, "${updated.name}" malzemesini "${updated.status}" olarak işaretledi.`,
            { actorId, actorName, ipAddress, entityType: 'Inventory', entityId: id, severity: 'WARN' }
        )
    }

    return NextResponse.json(updated)
}

// ─── DELETE: Malzeme Sil (Hard Delete — Admin Only) ─────────────────
export async function DELETE(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor?.isAdmin && !actor?.isSuperAdmin) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: 'Malzeme bulunamadı.' }, { status: 404 })

    await prisma.inventoryItem.delete({ where: { id } })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('inventory.delete', `${actorName}, "${item.name}" malzemesini kalıcı olarak sildi.`, {
        actorId, actorName, ipAddress, entityType: 'Inventory', entityId: id, severity: 'WARN'
    })

    return NextResponse.json({ success: true })
}
