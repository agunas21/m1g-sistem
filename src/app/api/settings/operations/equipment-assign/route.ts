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
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        // action: 'assign' veya 'unassign'
        const { qrCode, operationId, memberId, action } = body;

        if (!qrCode || !operationId) {
            return NextResponse.json({ error: 'QR Kodu ve Operasyon ID zorunludur' }, { status: 400 });
        }

        // Clean & parse QR code format (handles full URLs, JSON, raw tokens)
        const parsed = parseQRString(qrCode);
        const searchTerms = Array.from(new Set([qrCode, parsed.cleanCode, parsed.raw])).filter(Boolean);

        // Envanteri çoklu alanla bul (id, barcode, serialNumber)
        const inventory = await prisma.inventoryItem.findFirst({
            where: {
                OR: [
                    { id: { in: searchTerms } },
                    { barcode: { in: searchTerms } },
                    { serialNumber: { in: searchTerms } }
                ]
            }
        });

        if (!inventory) {
            return NextResponse.json({ 
                error: `Bu QR koda/Barkoda ait ekipman bulunamadı. (Okunan Kod: ${parsed.cleanCode})` 
            }, { status: 404 });
        }

        if (action === 'assign') {
            if (!memberId) {
                 return NextResponse.json({ error: 'Zimmetlenecek personel seçilmelidir' }, { status: 400 });
            }

            // Clean & normalize memberId if provided
            const memberParsed = parseQRString(memberId);
            const memberSearchTerms = Array.from(new Set([memberId, memberParsed.cleanCode])).filter(Boolean);

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

            // Ekipmanı zimmetle ve operasyon bilgisini güncelle
            const updated = await prisma.inventoryItem.update({
                where: { id: inventory.id },
                data: {
                    status: 'Sahada', // Operasyonda kullanılıyor
                    assignedToId: targetMemberId
                },
                include: {
                    assignedTo: true
                }
            });

            await prisma.auditLog.create({
                data: {
                    actorId: payload?.id || 'system',
                    actorName: payload?.fullName || 'System',
                    action: 'inventory.operation_assign',
                    detail: `${payload?.fullName || 'System'}, ${inventory.name} (${inventory.id}) isimli ekipmanı ${updated.assignedTo?.fullName || targetMemberId} personeline zimmetledi.`,
                    entityType: 'InventoryItem',
                    entityId: inventory.id,
                    operationId: operationId
                }
            });

            return NextResponse.json({ success: true, item: updated });

        } else if (action === 'unassign') {
            // Zimmeti kaldır
            const updated = await prisma.inventoryItem.update({
                where: { id: inventory.id },
                data: {
                    status: 'Depoda',
                    assignedToId: null
                }
            });

            await prisma.auditLog.create({
                data: {
                    actorId: payload?.id || 'system',
                    actorName: payload?.fullName || 'System',
                    action: 'inventory.operation_unassign',
                    detail: `${payload?.fullName || 'System'}, ${inventory.name} (${inventory.id}) isimli ekipmanı zimmetten düşürerek depoya iade aldı.`,
                    entityType: 'InventoryItem',
                    entityId: inventory.id,
                    operationId: operationId
                }
            });

            return NextResponse.json({ success: true, item: updated });
        }

        return NextResponse.json({ error: 'Geçersiz işlem tipi' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
