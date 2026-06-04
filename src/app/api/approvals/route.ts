import { NextResponse } from 'next/server';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';


export const dynamic = 'force-dynamic';
async function readApprovals() {
    return await getCollectionDB('global_approvals');
}

export async function GET() {
    return NextResponse.json(await readApprovals());
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
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
        const { id, status, resolvedBy } = await req.json();
        let approvals = await readApprovals();
        approvals = approvals.map((a: any) => a.id === id ? { ...a, status, resolvedAt: new Date().toISOString(), resolvedBy } : a);
        await writeCollectionDB('global_approvals', approvals);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
