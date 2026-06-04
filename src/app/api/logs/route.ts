import { NextResponse } from "next/server";
import { getLogs, writeLog } from "@/lib/logger";


export const dynamic = 'force-dynamic';
export async function GET() {
  const logs = await getLogs();
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  try {
    const { level, user, action, target, details } = await req.json();
    const newLog = await writeLog(level, user, action, target, details);
    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    return NextResponse.json({ error: "Failed to write log" }, { status: 500 });
  }
}
