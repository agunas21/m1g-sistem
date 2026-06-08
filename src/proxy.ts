/**
 * M1G — WAF (Web Application Firewall) Middleware
 *
 * Tüm istekler bu middleware'den geçer (Next.js edge middleware değil, Node middleware).
 * Saldırı vektörleri:
 *   1. DDoS / Flood — sliding window rate limit
 *   2. SQL Injection
 *   3. XSS (Cross-Site Scripting)
 *   4. Path Traversal
 *   5. Zararlı Bot / User-Agent
 *   6. Request boyut aşımı
 *   7. Honeypot endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_DDOS, RATE_API, RATE_LOGIN } from '@/lib/rateLimit';
import { incrementWafStat, getWafStats } from '@/lib/wafStats';

export { getWafStats };

// ── Tehlikeli Pattern'ler ───────────────────────────────────────────────────

const SQL_INJECTION_PATTERNS = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
    /('\s*(OR|AND)\s*')/i,
    /(SLEEP\s*\(\s*\d+\s*\))/i,
    /(BENCHMARK\s*\()/i,
    /(LOAD_FILE\s*\()/i,
    /(INTO\s+OUTFILE)/i,
];

const XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript\s*:/gi,
    /on\w+\s*=\s*["']?[^"'>]*/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.[\/\\]/,
    /%2e%2e[\/\\%]/i,
    /\.\.%2f/i,
    /%2e%2e%2f/i,
];

// Bilinen kötü bot User-Agent'ları
const BAD_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /zgrab/i,
    /nmap/i,
    /dirbuster/i,
    /gobuster/i,
    /hydra/i,
    /burpsuite/i,
    /havij/i,
    /acunetix/i,
    /appscan/i,
    /w3af/i,
    /skipfish/i,
    /httrack/i,
    /scrapy/i,
    /phantomjs/i,
];

// ── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
    return (
        req.headers.get('cf-connecting-ip') ||    // Cloudflare
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

// ── Güvenlik Response Header'ları ───────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
    const h = response.headers;
    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'SAMEORIGIN');
    h.set('X-XSS-Protection', '1; mode=block');
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    h.set('Permissions-Policy', 'camera=*, microphone=*, geolocation=*, payment=*');
    h.set('X-Powered-By-Hidden', 'true'); // next.js X-Powered-By gizleme
    return response;
}

// ── Ana Proxy (WAF) ─────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
    incrementWafStat('totalRequests');

    const { pathname } = req.nextUrl;
    const ip = getClientIP(req);
    const ua = req.headers.get('user-agent') || '';

    // 1. Honeypot endpoint'ler — botlar bunları arar
    const honeypotPaths = [
        '/wp-admin', '/wp-login.php', '/admin.php', '/.env',
        '/phpmyadmin', '/config.php', '/.git/config',
        '/backup.sql', '/database.sql', '/dump.sql',
        '/shell.php', '/eval.php', '/cmd.php',
        '/.htaccess', '/web.config',
    ];
    if (honeypotPaths.some(p => pathname.toLowerCase() === p)) {
        return blocked('Erişim reddedildi', 403, 'botBlocks');
    }

    // 2. Bot / User-Agent kontrolü
    if (ua && BAD_USER_AGENTS.some(p => p.test(ua))) {
        return blocked('Zararlı istemci tespit edildi', 403, 'botBlocks');
    }

    // 3. Static asset'ler için derin kontrol gereksiz (performans)
    if (pathname.startsWith('/_next/static') || pathname.startsWith('/favicon') ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)$/)) {
        return NextResponse.next();
    }

    // 4. DDoS koruması — genel flood
    const ddosResult = checkRateLimit(`ddos:${ip}`, RATE_DDOS.limit, RATE_DDOS.windowMs, RATE_DDOS.blockMs);
    if (!ddosResult.allowed) {
        const response = blocked('Çok fazla istek gönderdiniz. Lütfen bekleyin.', 429, 'ddosBlocks');
        response.headers.set('Retry-After', String(Math.ceil((ddosResult.retryAfter || 60000) / 1000)));
        return response;
    }

    // 5. API-spesifik rate limiting
    if (pathname.startsWith('/api/')) {
        const rateCfg = pathname.startsWith('/api/auth/login') ? RATE_LOGIN : RATE_API;
        const apiResult = checkRateLimit(`api:${ip}:${pathname}`, rateCfg.limit, rateCfg.windowMs, rateCfg.blockMs);
        if (!apiResult.allowed) {
            const response = blocked('API istek limiti aşıldı.', 429, 'rateLimitBlocks');
            response.headers.set('Retry-After', String(Math.ceil((apiResult.retryAfter || 60000) / 1000)));
            response.headers.set('X-RateLimit-Remaining', '0');
            return response;
        }
    }

    // 6. URL + Query parametresi tarama
    const fullUrl = pathname + req.nextUrl.search;
    const urlScan = scanString(fullUrl);
    if (urlScan.sqlInjection)  return blocked('Geçersiz istek.', 400, 'sqlBlocks');
    if (urlScan.xss)           return blocked('Geçersiz istek.', 400, 'xssBlocks');
    if (urlScan.pathTraversal) return blocked('Geçersiz istek yolu.', 400, 'pathTraversalBlocks');

    // 7. Request boyut limiti (5MB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return blocked('İstek boyutu çok büyük.', 413);
    }

    // ✅ Geçti — güvenlik header'larını ekle
    const response = NextResponse.next();
    return addSecurityHeaders(response);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

