import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';


export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const token = (await cookies()).get('m1g_session')?.value;
        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const user = verifyJwt(token);
        if (!user) {
            return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
        }

        return NextResponse.json({ authenticated: true, user });
    } catch (e) {
        return NextResponse.json({ authenticated: false, error: 'Sunucu hatası' }, { status: 500 });
    }
}
