import { NextResponse } from "next/server";
import { getLogs, writeLog } from "@/lib/logger";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/crypto";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    
    const payload = verifyJwt(token);
    if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

    const logs = await getLogs();
    const res = NextResponse.json({ logs });
    res.headers.set('Cache-Control', 'private, no-store, must-revalidate');
    return res;
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('m1g_session')?.value;
    if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    
    const payload = verifyJwt(token);
    if (!payload?.isAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

    const { level, user, action, target, details } = await req.json();
    const newLog = await writeLog(level, user, action, target, details);
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    return NextResponse.json({ error: "Failed to write log" }, { status: 500 });
  }
}
