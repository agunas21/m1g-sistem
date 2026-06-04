/**
 * M1G — Immutable Audit Log (KVKK Denetim Günlüğü)
 *
 * Her PII erişimi, üye değişikliği ve silme işlemini asenkron olarak
 * append-only JSONL dosyasına kaydeder. Silme/güncelleme endpoint'i yoktur.
 *
 * Çağrı: logAudit({...}) — response'u bloklamaz (setImmediate)
 */

import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export type AuditAction =
    | 'VIEW_MEMBER_LIST'
    | 'VIEW_MEMBER_DETAIL'
    | 'VIEW_PII'
    | 'EDIT_MEMBER'
    | 'BAN_MEMBER'
    | 'UNBAN_MEMBER'
    | 'DELETE_MEMBER'
    | 'RESET_PASSWORD'
    | 'CHANGE_ROLE'
    | 'EXPORT_CSV'
    | 'MAGIC_LINK_REQUEST'
    | 'MAGIC_LINK_USED'
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGIN_MFA_SUCCESS'
    | 'LOGIN_MFA_FAILED'
    | 'MFA_SETUP'
    | 'MFA_DISABLED'
    | 'LOGOUT'
    | 'ADD_MEMBER';

export interface AuditEntry {
    action: AuditAction;
    actorId: string;
    actorEmail?: string;
    actorRole?: string;
    actorIp: string;
    sessionId?: string;
    targetMemberId?: string;
    targetField?: string;
    details?: Record<string, unknown>;
}

export function logAudit(params: AuditEntry): void {
    setImmediate(async () => {
        try {
            await prisma.auditLog.create({
                data: {
                    actorId: params.actorId || null,
                    actorName: params.actorEmail || params.actorRole || 'Unknown',
                    action: params.action,
                    detail: JSON.stringify({
                        actorEmail: params.actorEmail,
                        actorRole: params.actorRole,
                        sessionId: params.sessionId,
                        targetField: params.targetField,
                        details: params.details
                    }),
                    entityType: params.targetMemberId ? 'Member' : null,
                    entityId: params.targetMemberId || null,
                    ipAddress: params.actorIp || null,
                    userAgent: null,
                    severity: 'INFO'
                }
            });
        } catch (err) {
            console.error('[AuditLog] Kayıt başarısız:', err);
        }
    });
}

export interface AuditQueryOptions {
    actorId?: string;
    targetMemberId?: string;
    action?: AuditAction;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
}

export async function queryAuditLog(options: AuditQueryOptions = {}) {
    try {
        const where: any = {};
        
        if (options.actorId) where.actorId = options.actorId;
        if (options.targetMemberId) where.entityId = options.targetMemberId;
        if (options.action) where.action = options.action;
        
        if (options.fromDate || options.toDate) {
            where.createdAt = {};
            if (options.fromDate) where.createdAt.gte = new Date(options.fromDate);
            if (options.toDate) where.createdAt.lte = new Date(options.toDate);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: options.limit || 100,
            skip: options.offset || 0
        });

        return logs.map(l => ({
            id: l.id,
            timestamp: l.createdAt.toISOString(),
            action: l.action as AuditAction,
            actorId: l.actorId || '',
            actorIp: l.ipAddress || '',
            targetMemberId: l.entityId || undefined,
            details: l.detail ? JSON.parse(l.detail) : undefined
        }));
    } catch (err) {
        console.error('[AuditLog] Sorgulama hatası:', err);
        return [];
    }
}

export function extractIp(headers: Headers | { get: (k: string) => string | null }): string {
    return (
        headers.get('cf-connecting-ip') ||
        headers.get('x-real-ip') ||
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown'
    );
}
