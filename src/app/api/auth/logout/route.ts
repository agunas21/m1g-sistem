import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        (await cookies()).delete('m1g_session');
        return NextResponse.json({ success: true, message: 'Çıkış yapıldı' });
    } catch (e) {
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
    }
}
