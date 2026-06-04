/**
 * M1G — Sessiz Audit Log Defteri
 *
 * Arayüzde hiçbir şey gerektirmez.
 * Backend'deki her kritik CRUD işleminde çağrılır.
 * AuditLog tablosuna işlem yapanın ID'si, tarih ve detaylarıyla yazar.
 */

import { prisma } from '@/lib/prisma'

export type AuditAction =
    // Envanter
    | 'inventory.assign'
    | 'inventory.return'
    | 'inventory.create'
    | 'inventory.update'
    | 'inventory.delete'
    | 'inventory.damage'
    // Üye
    | 'member.create'
    | 'member.update'
    | 'member.delete'
    | 'member.ban'
    | 'member.approve'
    | 'member.ftr_record'
    // Operasyon
    | 'operation.create'
    | 'operation.close'
    | 'operation.delete'
    | 'operation.evacuation'
    | 'operation.log'
    // Tim
    | 'team.create'
    | 'team.deploy'
    | 'team.return'
    | 'team.delete'
    | 'team.member_add'
    | 'team.member_remove'
    // Auth
    | 'auth.login'
    | 'auth.logout'
    | 'auth.password_change'
    | 'auth.totp_enable'
    // Sistem
    | 'settings.update'
    | 'document.upload'
    | 'document.delete'

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export interface AuditContext {
    actorId?: string
    actorName?: string
    ipAddress?: string
    userAgent?: string
    operationId?: string
    entityType?: 'Member' | 'Inventory' | 'Operation' | 'Team' | 'System'
    entityId?: string
    severity?: AuditSeverity
}

/**
 * Sessiz log kaydı oluşturur.
 * UI'da hiçbir şey göstermez, sadece veritabanına yazar.
 *
 * @param action - İşlem türü (ör: 'inventory.assign')
 * @param detail - İnsan okunabilir açıklama (ör: "Ali Kaya, Jeneratörü Alfa Timine zimmetledi")
 * @param ctx    - Bağlam bilgileri (kim, ne, nerede)
 */
export async function logAudit(
    action: AuditAction,
    detail: string,
    ctx: AuditContext = {}
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                detail,
                actorId: ctx.actorId ?? null,
                actorName: ctx.actorName ?? 'Sistem',
                ipAddress: ctx.ipAddress ?? null,
                userAgent: ctx.userAgent ?? null,
                operationId: ctx.operationId ?? null,
                entityType: ctx.entityType ?? null,
                entityId: ctx.entityId ?? null,
                severity: ctx.severity ?? 'INFO',
            }
        })
    } catch (e) {
        // Audit log hatası asla ana işlemi durdurmamalı
        console.error('[AuditLog] Kayıt hatası:', e)
    }
}

/**
 * JWT token'dan actor bilgilerini çıkarır.
 * API route'larında kullanım kolaylığı için.
 */
export function extractActor(actor: any): Pick<AuditContext, 'actorId' | 'actorName'> {
    return {
        actorId: actor?.sub ?? actor?.id ?? undefined,
        actorName: actor?.fullName ?? actor?.email ?? 'Bilinmeyen Kullanıcı'
    }
}

/**
 * Request headers'dan IP ve User-Agent çıkarır.
 */
export function extractRequestMeta(headers: Headers): Pick<AuditContext, 'ipAddress' | 'userAgent'> {
    return {
        ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? headers.get('x-real-ip')
            ?? 'unknown',
        userAgent: headers.get('user-agent') ?? undefined
    }
}
