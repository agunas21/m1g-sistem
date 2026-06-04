import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const end = new Date();
        const start = new Date(end.getTime() - (2 * 24 * 60 * 60 * 1000)); // 48 hours ago

        const startStr = start.toISOString().split(".")[0]; // AFAD API prefers format without ms
        const endStr = end.toISOString().split(".")[0];

        const url = `https://deprem.afad.gov.tr/apiv2/event/filter?start=${startStr}&end=${endStr}`;

        const res = await fetch(url, {
            cache: 'no-store',
            headers: {
                "Accept": "application/json"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "AFAD API did not respond successfully" }, { status: res.status });
        }

        let data = await res.json();

        // Ensure chronological top-down sorting if not already
        if (Array.isArray(data)) {
            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Internal AFAD Proxy Error:", error);
        return NextResponse.json({ error: "Failed to fetch from AFAD" }, { status: 500 });
    }
}
