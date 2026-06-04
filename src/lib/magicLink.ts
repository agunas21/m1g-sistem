/**
 * M1G — Magic Link Authentication
 *
 * Şifresiz e-posta bağlantısı ile giriş.
 * - Token: 32 byte cryptographically secure random hex
 * - TTL: 5 dakika
 * - Tek kullanım: link tıklanınca token silinir
 */

import { randomBytes } from 'crypto';
import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 dakika

interface MagicToken {
    token: string;
    email: string;
    memberId: string;
    createdAt: string;  // ISO 8601
    expiresAt: string;  // ISO 8601
    used: boolean;
}

// ── Dosya İşlemleri ───────────────────────────────────────────────────────────

async function readTokens(): Promise<MagicToken[]> {
    try {
        return await getCollectionDB('global_magic_tokens');
    } catch {
        return [];
    }
}

async function writeTokens(tokens: MagicToken[]): Promise<void> {
    await writeCollectionDB('global_magic_tokens', tokens);
}

function cleanExpiredTokens(tokens: MagicToken[]): MagicToken[] {
    const now = Date.now();
    return tokens.filter(t => new Date(t.expiresAt).getTime() > now && !t.used);
}

// ── Ana Fonksiyonlar ──────────────────────────────────────────────────────────

/**
 * Yeni magic link token üretir ve kaydeder.
 * @returns token string (e-posta linkinde kullanılacak)
 */
export async function createMagicToken(email: string, memberId: string): Promise<string> {
    const token = randomBytes(32).toString('hex'); // 64 char secure hex
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);

    const tokens = cleanExpiredTokens(await readTokens());

    // Aynı e-posta için eski tokenları geçersiz kıl
    const filtered = tokens.filter(t => t.email !== email.toLowerCase());

    filtered.push({
        token,
        email: email.toLowerCase(),
        memberId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        used: false,
    });

    await writeTokens(filtered);
    return token;
}

/**
 * Token doğrular, tek kullanımlık işaretler.
 * @returns MagicToken veya null (geçersiz/süresi dolmuş/kullanılmış)
 */
export async function verifyMagicToken(token: string): Promise<MagicToken | null> {
    const tokens = await readTokens();
    const idx = tokens.findIndex((t: MagicToken) => t.token === token);

    if (idx === -1) return null;

    const entry = tokens[idx];

    // Kullanılmış mı?
    if (entry.used) return null;

    // Süresi dolmuş mu?
    if (new Date(entry.expiresAt).getTime() < Date.now()) return null;

    // Tek kullanımlık: hemen geçersiz kıl
    tokens[idx].used = true;
    await writeTokens(tokens);

    return entry;
}

/**
 * Magic Link URL'sini oluşturur.
 */
export function buildMagicLinkUrl(token: string, baseUrl?: string): string {
    const base = baseUrl ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000';
    return `${base}/api/auth/magic-link?token=${token}`;
}
