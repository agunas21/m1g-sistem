import { NextResponse } from 'next/server';
import { getSiteSettingsDB } from '@/lib/settings';


export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const data = await getSiteSettingsDB();
        return NextResponse.json({ calendarEvents: data.calendarEvents || [] });
    } catch {
        return NextResponse.json({ calendarEvents: [] });
    }
}
