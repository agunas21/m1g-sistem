import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { parseQRString } from '@/lib/qrResolver';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        const payload = token ? verifyJwt(token) : null;
        if (!payload) return NextResponse.json({ error: 'Yetkisiz erişim. Lütfen giriş yapın.' }, { status: 401 });

        const body = await req.json();
        const { qrCode, operationId, memberId, action } = body;

        if (!qrCode || !operationId) {
            return NextResponse.json({ error: 'QR Kodu ve Operasyon ID zorunludur' }, { status: 400 });
        }

        // Clean & parse QR code format (handles full URLs, JSON, raw tokens)
        const parsed = parseQRString(qrCode);
        const searchTerms = Array.from(new Set([
            qrCode.trim(),
            parsed.cleanCode.trim(),
            parsed.raw.trim(),
            ...parsed.possibleTokens.map(t => t.trim())
        ])).filter(Boolean);

        // Case-insensitive variants
        const allTerms = Array.from(new Set([
            ...searchTerms,
            ...searchTerms.map(t => t.toLowerCase()),
            ...searchTerms.map(t => t.toUpperCase())
        ]));

        // Envanteri sadece Prisma schema'da var olan 'id' alanı üzerinden ara
        const inventory = await prisma.inventoryItem.findFirst({
            where: {
                id: { in: allTerms }
            }
        });

        if (!inventory) {
            // Fallback: contains search for ID
            const fallbackInventory = await prisma.inventoryItem.findFirst({
                where: {
                    OR: allTerms.map(term => ({ id: { contains: term, mode: 'insensitive' as const } }))
                }
            });

            if (!fallbackInventory) {
                return NextResponse.json({ 
                    error: `Ekipman sistemde bulunamadı. (Okunan QR/Kod: ${parsed.cleanCode})` 
                }, { status: 404 });
            }
        }

        const targetInventory = inventory || (await prisma.inventoryItem.findFirst({
            where: { OR: allTerms.map(term => ({ id: { contains: term, mode: 'insensitive' as const } })) }
        }))!;

        if (action === 'assign') {
            if (!memberId) {
                return NextResponse.json({ error: 'Zimmetlenecek personel seçilmelidir' }, { status: 400 });
            }

            const memberParsed = parseQRString(memberId);
            const memberSearchTerms = Array.from(new Set([memberId, memberParsed.cleanCode, ...memberParsed.possibleTokens])).filter(Boolean);

            const targetMember = await prisma.member.findFirst({
                where: {
                    OR: [
                        { id: { in: memberSearchTerms } },
                        { kimlikToken: { in: memberSearchTerms } },
                        { email: { in: memberSearchTerms } }
                    ]
                }
            });

            const targetMemberId = targetMember ? targetMember.id : memberId;
            const targetMemberName = targetMember ? targetMember.fullName : 'Personel';

            // Ekipmanı zimmetle ve operasyon durumunu güncelle
            const updated = await prisma.inventoryItem.update({
                where: { id: targetInventory.id },
                data: {
                    status: 'Sahada',
                    assignedToId: targetMemberId
                },
                include: {
                    assignedTo: true
                }
            });

            try {
                await prisma.auditLog.create({
                    data: {
                        actorId: payload?.id || 'system',
                        actorName: payload?.fullName || 'System',
                        action: 'inventory.operation_assign',
                        detail: `${payload?.fullName || 'System'}, ${targetInventory.name} (${targetInventory.id}) ekipmanını ${targetMemberName} personeline zimmetledi.`,
                        entityType: 'InventoryItem',
                        entityId: targetInventory.id,
                        operationId: operationId
                    }
                });
            } catch (e) {
                console.warn('Audit log creation failed, continuing', e);
            }

            return NextResponse.json({ 
                success: true, 
                message: `${targetInventory.name} (${targetInventory.id}) -> ${targetMemberName} personeline zimmetlendi.`,
                item: updated 
            });

        } else if (action === 'unassign') {
            // Zimmeti kaldır ve depoya iade al
            const updated = await prisma.inventoryItem.update({
                where: { id: targetInventory.id },
                data: {
                    status: 'Depoda',
                    assignedToId: null
                }
            });

            try {
                await prisma.auditLog.create({
                    data: {
                        actorId: payload?.id || 'system',
                        actorName: payload?.fullName || 'System',
                        action: 'inventory.operation_unassign',
                        detail: `${payload?.fullName || 'System'}, ${targetInventory.name} (${targetInventory.id}) ekipmanını depoya iade aldı.`,
                        entityType: 'InventoryItem',
                        entityId: targetInventory.id,
                        operationId: operationId
                    }
                });
            } catch (e) {
                console.warn('Audit log creation failed, continuing', e);
            }

            return NextResponse.json({ 
                success: true, 
                message: `${targetInventory.name} (${targetInventory.id}) depoya iade alındı.`,
                item: updated 
            });
        }

        return NextResponse.json({ error: 'Geçersiz işlem tipi' }, { status: 400 });

    } catch (error: any) {
        console.error('Equipment assign error:', error);
        return NextResponse.json({ error: error.message || 'Zimmetleme sırasında sunucu hatası oluştu' }, { status: 500 });
    }
}
