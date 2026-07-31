import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rotateRefreshTokenInDB } from '@/lib/auth/tokens';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const oldRefreshToken = cookieStore.get('m1g_refresh')?.value;

        if (!oldRefreshToken) {
            return NextResponse.json({ error: 'NO_REFRESH_TOKEN' }, { status: 401 });
        }

        const rotationResult = await rotateRefreshTokenInDB(oldRefreshToken);

        if (!rotationResult) {
            const response = NextResponse.json({ error: 'REFRESH_EXPIRED' }, { status: 401 });
            response.cookies.delete('m1g_refresh');
            return response;
        }

        const response = NextResponse.json({
            accessToken: rotationResult.accessToken,
            expiresIn: rotationResult.expiresIn,
            user: {
                id: rotationResult.member.id,
                email: rotationResult.member.email,
                fullName: rotationResult.member.fullName,
                isAdmin: rotationResult.member.isAdmin,
                isSuperAdmin: rotationResult.member.isSuperAdmin
            }
        });

        // Set httpOnly 30-day refresh token cookie
        response.cookies.set('m1g_refresh', rotationResult.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 Gün
            path: '/api/auth'
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
