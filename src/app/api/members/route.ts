import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyJwt, encryptField, decryptField, maskField } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'
import { canAccessAdmin, isSuperAdmin } from '@/lib/rbac'
import { randomUUID } from 'crypto'


export const dynamic = 'force-dynamic';
// ─── GET: Üye Listesi ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    const isAdmin = actor?.isAdmin === true || actor?.isSuperAdmin === true

    const members = await prisma.member.findMany({
        where: { isSuperAdmin: false },
        orderBy: { joinDate: 'desc' }
    })

    // Envanter zimmetleri
    const inventoryItems = await prisma.inventoryItem.findMany({
        where: { assignedToId: { not: null } },
        select: { id: true, name: true, assignedToId: true, maintenanceDate: true }
    })

    const enriched = members.map((m: any) => {
        const memberInventory = inventoryItems
            .filter(i => i.assignedToId === m.id)
            .map(i => ({
                item: i.name,
                date: i.maintenanceDate ?? new Date().toLocaleDateString('tr-TR'),
                status: 'Zimmetli'
            }))

        const enrichedMember = {
            ...m,
            inventory: memberInventory.length > 0 ? memberInventory : (m.inventory ?? [])
        }

        // TC No maskeleme
        if (enrichedMember.tcNo) {
            if (actor && isSuperAdmin(actor)) {
                enrichedMember.tcNo = decryptField(enrichedMember.tcNo)
            } else if (isAdmin) {
                const plain = decryptField(enrichedMember.tcNo)
                enrichedMember.tcNo = maskField(plain, 5, 2)
            } else {
                const plain = decryptField(enrichedMember.tcNo)
                enrichedMember.tcNo = maskField(plain, 3, 2)
            }
        }

        // Şifreyi asla döndürme
        const { password, totpSecret, ...safe } = enrichedMember
        return safe
    })

    return NextResponse.json(enriched)
}

// ─── POST: Yeni Üye Ekle ────────────────────────────────────────────
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

    const body = await req.json()
    const rawTcNo = body.tcNo || ''
    const encryptedTcNo = rawTcNo ? encryptField(rawTcNo) : null

    const newMember = await prisma.member.create({
        data: {
            id: randomUUID(),
            kimlikToken: randomUUID(),
            fullName: body.fullName,
            tcNo: encryptedTcNo,
            gender: body.gender || null,
            phone: body.phone || null,
            email: body.email || '',
            password: rawTcNo || randomUUID(),
            profession: body.profession || null,
            education: body.education || null,
            memberType: body.memberType || 'Üye',
            honorary: body.honorary || 'Hayır',
            status: 'Aktif',
            birthDate: body.birthDate || null,
        }
    })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('member.create', `${actorName}, "${newMember.fullName}" adlı yeni üyeyi sisteme ekledi.`, {
        actorId, actorName, ipAddress,
        entityType: 'Member', entityId: newMember.id
    })

    const { password, totpSecret, ...safe } = newMember as any
    return NextResponse.json(safe, { status: 201 })
}

// ─── PATCH: Üye Güncelle / FTR Kayıt Ekle ──────────────────────────
export async function PATCH(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

    const body = await req.json()
    const id = body.id || body.memberId
    const action = body.action
    const { id: _, memberId: __, action: ___, ...updateData } = body

    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    // FTR kaydı ekleme
    if (action === 'add_ftr_record') {
        const existing = await prisma.member.findUnique({ where: { id }, select: { ftrRecords: true } })
        if (!existing) return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 })

        const records = (existing.ftrRecords as any[]) ?? []
        const newRecord = {
            id: randomUUID(),
            date: new Date().toISOString(),
            note: body.note,
            addedBy: actorName
        }
        records.push(newRecord)

        await prisma.member.update({ where: { id }, data: { ftrRecords: records } })
        await logAudit('member.ftr_record', `${actorName}, "${id}" üyesine FTR kaydı ekledi: "${body.note}"`, {
            actorId, actorName, ipAddress, entityType: 'Member', entityId: id
        })
        return NextResponse.json({ success: true, record: newRecord })
    }

    // TC No varsa şifrele
    if (updateData.tcNo && !updateData.tcNo.startsWith('enc:')) {
        updateData.tcNo = encryptField(updateData.tcNo)
    }

    // Şifre güncellemesi varsa hash'le
    // (login/change-password rotalarına bırakılmış)
    const { password, ...safeUpdate } = updateData

    const updated = await prisma.member.update({
        where: { id },
        data: safeUpdate
    })

    await logAudit('member.update', `${actorName}, "${updated.fullName}" üyesini güncelledi.`, {
        actorId, actorName, ipAddress, entityType: 'Member', entityId: id
    })

    const { password: pw, totpSecret, ...safeResult } = updated as any
    return NextResponse.json(safeResult)
}

// ─── DELETE: Üye Sil (Hard Delete — Admin Only) ─────────────────────
export async function DELETE(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor || (!actor.isAdmin && !actor.isSuperAdmin)) {
        return NextResponse.json({ error: 'Bu işlem için Admin yetkisi gerekli.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || searchParams.get('memberId')
    if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 })

    const member = await prisma.member.findUnique({ where: { id }, select: { fullName: true } })
    if (!member) return NextResponse.json({ error: 'Üye bulunamadı.' }, { status: 404 })

    await prisma.member.delete({ where: { id } })

    const { actorId, actorName } = extractActor(actor)
    const { ipAddress } = extractRequestMeta(req.headers)

    await logAudit('member.delete', `${actorName}, "${member.fullName}" üyesini kalıcı olarak sildi.`, {
        actorId, actorName, ipAddress, entityType: 'Member', entityId: id, severity: 'WARN'
    })

    return NextResponse.json({ success: true })
}
