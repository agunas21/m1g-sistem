/**
 * M1G — WAF (Web Application Firewall) Middleware
 *
 * All requests pass through this Node middleware.
 * iOS / Mobile Carrier Network (CG-NAT) friendly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_DDOS, RATE_API, RATE_LOGIN } from '@/lib/rateLimit';
import { incrementWafStat, getWafStats } from '@/lib/wafStats';

export { getWafStats };

// ── Tehlikeli Pattern'ler ───────────────────────────────────────────────────

const SQL_INJECTION_PATTERNS = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
    /(SLEEP\s*\(\s*\d+\s*\))/i,
    /(BENCHMARK\s*\()/i,
];

const XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["']?[^"'>]*/gi,
    /eval\s*\(/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.[\/\\]/,
    /%2e%2e[\/\\%]/i,
    /\.\.%2f/i,
    /%2e%2e%2f/i,
];

const BAD_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
    /dirbuster/i,
    /gobuster/i,
    /hydra/i,
    /acunetix/i,
];

function getClientIP(req: NextRequest): string {
    return (
        req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        '127.0.0.1'
    );
}

function blocked(reason: string, status: number, statKey?: 'ddosBlocks' | 'sqlBlocks' | 'xssBlocks' | 'pathTraversalBlocks' | 'botBlocks' | 'rateLimitBlocks'): NextResponse {
    incrementWafStat('blockedRequests');
    if (statKey) incrementWafStat(statKey);

    return new NextResponse(
        JSON.stringify({ error: reason, code: 'WAF_BLOCKED' }),
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                'X-Blocked-By': 'M1G-WAF',
            },
        }
    );
}

function scanString(value: string): { sqlInjection: boolean; xss: boolean; pathTraversal: boolean } {
    let decoded = value;
    try { decoded = decodeURIComponent(value).replace(/\+/g, ' '); } catch { }
    return {
        sqlInjection: SQL_INJECTION_PATTERNS.some(p => p.test(decoded)),
        xss: XSS_PATTERNS.some(p => p.test(decoded)),
        pathTraversal: PATH_TRAVERSAL_PATTERNS.some(p => p.test(decoded)),
    };
}

function addSecurityHeaders(response: NextResponse): NextResponse {
    const h = response.headers;
    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'SAMEORIGIN');
    h.set('X-XSS-Protection', '1; mode=block');
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

export async function proxy(req: NextRequest) {
    incrementWafStat('totalRequests');

    const { pathname } = req.nextUrl;
    const ip = getClientIP(req);
    const ua = req.headers.get('user-agent') || '';

    // 1. Honeypot endpoints
    const honeypotPaths = [
        '/wp-admin', '/wp-login.php', '/admin.php', '/.env',
        '/phpmyadmin', '/config.php', '/.git/config',
        '/shell.php', '/eval.php', '/cmd.php',
    ];
    if (honeypotPaths.some(p => pathname.toLowerCase() === p)) {
        return blocked('Erişim reddedildi', 403, 'botBlocks');
    }

    // 2. Bad user agents
    if (ua && BAD_USER_AGENTS.some(p => p.test(ua))) {
        return blocked('Zararlı istemci tespit edildi', 403, 'botBlocks');
    }

    // 3. Static assets, public documents, and images bypass WAF rate limits
    if (pathname.startsWith('/_next') || 
        pathname.startsWith('/documents/') || 
        pathname.startsWith('/images/') || 
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/sw.js') ||
        pathname.startsWith('/manifest.json') ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map|pdf)$/i)) {
        return NextResponse.next();
    }

    // 4. Mobile Carrier friendly Rate limiting for general pages
    const ddosResult = checkRateLimit(`ddos:${ip}`, RATE_DDOS.limit, RATE_DDOS.windowMs, RATE_DDOS.blockMs);
    if (!ddosResult.allowed) {
        const response = blocked('Çok fazla istek gönderdiniz. Lütfen bekleyin.', 429, 'ddosBlocks');
        response.headers.set('Retry-After', String(Math.ceil((ddosResult.retryAfter || 60000) / 1000)));
        return response;
    }

    // 5. API-specific rate limiting
    if (pathname.startsWith('/api/')) {
        const rateCfg = pathname.startsWith('/api/auth/login') ? RATE_LOGIN : RATE_API;
        const apiResult = checkRateLimit(`api:${ip}:${pathname}`, rateCfg.limit, rateCfg.windowMs, rateCfg.blockMs);
        if (!apiResult.allowed) {
            const response = blocked('API istek limiti aşıldı.', 429, 'rateLimitBlocks');
            response.headers.set('Retry-After', String(Math.ceil((apiResult.retryAfter || 60000) / 1000)));
            return response;
        }
    }

    // 6. Security scan
    const fullUrl = pathname + req.nextUrl.search;
    const urlScan = scanString(fullUrl);
    if (urlScan.sqlInjection)  return blocked('Geçersiz istek.', 400, 'sqlBlocks');
    if (urlScan.xss)           return blocked('Geçersiz istek.', 400, 'xssBlocks');
    if (urlScan.pathTraversal) return blocked('Geçersiz istek yolu.', 400, 'pathTraversalBlocks');

    const response = NextResponse.next();
    return addSecurityHeaders(response);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
