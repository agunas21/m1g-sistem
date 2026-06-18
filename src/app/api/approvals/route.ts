import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

async function readApprovals() {
    return await getCollectionDB('global_approvals');
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

        const approvals = await readApprovals();
        let filtered = approvals;

        if (!payload.isAdmin) {
            // Normal member: only show their own dues/approvals
            const userId = payload.id || payload.uid;
            filtered = approvals.filter((a: any) => a.memberId === userId);
        }

        const res = NextResponse.json(filtered);
        res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
        return res;
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

        const body = await req.json();

        // Enforce memberId check unless requester is admin
        const userId = payload.id || payload.uid;
        if (!payload.isAdmin && body.memberId !== userId) {
            return NextResponse.json({ error: 'Yetkisiz işlem' }, { status: 403 });
        }

        const approvals = await readApprovals();
        const newApproval = {
            id: Date.now(),
            ...body,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        approvals.unshift(newApproval);
        await writeCollectionDB('global_approvals', approvals);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('m1g_session')?.value;
        if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
        
        const payload = verifyJwt(token);
        if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

        const { id, status, resolvedBy } = await req.json();
        let approvals = await readApprovals();
        approvals = approvals.map((a: any) => a.id === id ? { ...a, status, resolvedAt: new Date().toISOString(), resolvedBy } : a);
        await writeCollectionDB('global_approvals', approvals);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
