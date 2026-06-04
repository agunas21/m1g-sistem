import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const location = searchParams.get('location') || '';

        if (!location.trim()) {
            return NextResponse.json({ temperature: '' });
        }

        // wttr.in is free and returns plain text temperature (e.g. "+15°C" or "-3°C")
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=%t`, {
                signal: controller.signal,
                headers: { 'User-Agent': 'curl' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                let tempText = await res.text();
                tempText = tempText.trim().replace('+', ''); // strip '+' sign
                if (tempText && tempText.includes('°')) {
                    return NextResponse.json({ temperature: tempText });
                }
            }
        } catch (fetchErr) {
            console.warn('Weather fetch failed, falling back to offline generator:', fetchErr);
        }

        // Offline fallback: Generate a pseudo-random temperature based on location text
        let hash = 0;
        for (let i = 0; i < location.length; i++) {
            hash = location.charCodeAt(i) + ((hash << 5) - hash);
        }
        const pseudoTemp = 10 + (Math.abs(hash) % 18); // Generates temperature between 10°C and 28°C
        return NextResponse.json({ temperature: `${pseudoTemp}°C (Offline)` });

    } catch (error) {
        console.error('[weather GET error]', error);
        return NextResponse.json({ temperature: '18°C (Hata)' });
    }
}
