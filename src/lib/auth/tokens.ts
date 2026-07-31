import crypto from 'crypto';
import { signJwt, verifyJwt } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

export interface MemoryAuthState {
    accessToken: string | null;
    accessTokenExpiresAt: number | null;
}

export function generateAccessToken(payload: any, expiresInSeconds = 900) {
    return signJwt(payload, expiresInSeconds);
}

export function generateRefreshTokenString(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function createRefreshTokenInDB(memberId: string) {
    const token = generateRefreshTokenString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Gün

    const record = await prisma.refreshToken.create({
        data: {
            token,
            memberId,
            expiresAt,
            revoked: false
        }
    });

    return record;
}

export async function rotateRefreshTokenInDB(oldToken: string) {
    const record = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
        include: { member: true }
    });

    if (!record || record.revoked || record.expiresAt < new Date()) {
        return null;
    }

    // Revoke old token (single-use token rotation)
    await prisma.refreshToken.update({
        where: { id: record.id },
        data: { revoked: true }
    });

    // Create new refresh token
    const newRecord = await createRefreshTokenInDB(record.memberId);
    
    // Create new 15-min access token
    const newAccessToken = generateAccessToken({
        id: record.member.id,
        email: record.member.email,
        fullName: record.member.fullName,
        isAdmin: record.member.isAdmin,
        isSuperAdmin: record.member.isSuperAdmin
    }, 900);

    return {
        refreshToken: newRecord.token,
        accessToken: newAccessToken,
        expiresIn: 900,
        member: record.member
    };
}
