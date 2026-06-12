import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { logAudit, extractActor, extractRequestMeta } from '@/lib/db-audit'

/**
 * POST /api/inventory/damage-photo
 *
 * Hasar fotoğrafı yükler:
 * 1. Supabase Storage → m1g-assets/damage-photos/{operationId}/{itemId}_{ts}.jpg
 * 2. InventoryItem.damagePhotos[] alanına URL eklenir
 * 3. InventoryItem.status → "Bakımda", condition → "Arızalı"
 * 4. AuditLog'a kayıt düşer
 *
 * Body: multipart/form-data
 *   - file: Blob (zorunlu)
 *   - itemId: string (zorunlu)
 *   - operationId: string (opsiyonel)
 */
export async function POST(req: NextRequest) {
    let actor: any = null
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('m1g_session')?.value
        if (token) actor = verifyJwt(token)
    } catch {}

    if (!actor) {
        return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const itemId = formData.get('itemId') as string | null
        const operationId = formData.get('operationId') as string | null

        if (!file) return NextResponse.json({ error: 'Dosya gerekli.' }, { status: 400 })
        if (!itemId) return NextResponse.json({ error: 'Malzeme ID gerekli.' }, { status: 400 })

        // Dosya tipi doğrula
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Sadece görsel dosyaları kabul edilir.' }, { status: 400 })
        }

        // Boyut sınırı: 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "Dosya 10MB'dan büyük olamaz." }, { status: 400 })
        }

        let photoUrl = '';
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const dataUri = "data:" + file.type + ";base64," + buffer.toString("base64");
            photoUrl = await uploadToCloudinary(dataUri, "m1g_damage_photos");
        } catch (uploadErr: any) {
            console.error('Cloudinary upload error:', uploadErr);
            return NextResponse.json({ error: 'Fotoğraf Cloudinary sunucusuna yüklenemedi: ' + uploadErr.message }, { status: 500 });
        }

        // InventoryItem güncelle: fotoğraf URL'si + durum değişikliği
        const existing = await prisma.inventoryItem.findUnique({
            where: { id: itemId },
            select: { damagePhotos: true, name: true, status: true }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Malzeme bulunamadı.' }, { status: 404 })
        }

        const updatedPhotos = [...(existing.damagePhotos ?? []), photoUrl]

        const updated = await prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                damagePhotos: updatedPhotos,
                status: 'Bakımda',
                condition: 'Arızalı',
            }
        })

        // Audit log
        const { actorId, actorName } = extractActor(actor)
        const { ipAddress } = extractRequestMeta(req.headers)

        await logAudit('inventory.damage',
            `${actorName}, "${existing.name}" malzemesi için hasar fotoğrafı yükledi. Durum: Bakımda/Arızalı.`,
            {
                actorId, actorName, ipAddress,
                entityType: 'Inventory', entityId: itemId,
                operationId: operationId ?? undefined,
                severity: 'WARN'
            }
        )

        return NextResponse.json({
            success: true,
            photoUrl,
            updatedItem: updated
        })

    } catch (e: any) {
        console.error('damage-photo route error:', e)
        return NextResponse.json({ error: e.message ?? 'Sunucu hatası.' }, { status: 500 })
    }
}
