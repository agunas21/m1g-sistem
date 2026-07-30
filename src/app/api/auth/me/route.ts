import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = (await cookies()).get('m1g_session')?.value;
        if (!token) {
            const res = NextResponse.json({ authenticated: false }, { status: 401 });
            res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
            return res;
        }

        const user = verifyJwt(token);
        if (!user) {
            const res = NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
            res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
            return res;
        }

        const res = NextResponse.json({ authenticated: true, user });
        res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
        // Oturumu yenile / uzat (30 gün)
        (await cookies()).set('m1g_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        });
        return res;
    } catch (e) {
        const res = NextResponse.json({ authenticated: false, error: 'Sunucu hatası' }, { status: 500 });
        res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
        return res;
    }
}
