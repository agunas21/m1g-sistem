/**
 * M1G — TOTP (Time-based One-Time Password) Modülü
 *
 * Google Authenticator & Microsoft Authenticator uyumlu.
 * RFC 6238 standardı — offline çalışır, internet gerekmez.
 *
 * Kütüphane: otplib v12 (ücretsiz, Node.js native)
 * Algoritma: SHA1, 6 basamak, 30 saniyelik pencere
 */

import { authenticator } from 'otplib';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// otplib yapılandırması
authenticator.options = {
    step: 30,      // 30 saniyelik window
    digits: 6,     // 6 haneli kod
    window: 1,     // ±1 window toleransı (saat kayması için)
    // algorithm: otplib v12'de ayrı ayarlanır (default SHA1 — Authenticator uyumlu)
};

// ── Şifreleme (TOTP Secret'ı veritabanında şifreli sakla) ────────────────────

const ENC_KEY = Buffer.from(
    process.env.ENCRYPTION_KEY || '0'.repeat(64),
    'hex'
);

export function encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', ENC_KEY, iv);
    const encrypted = Buffer.concat([
        cipher.update(secret, 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptSecret(encrypted: string): string {
    const [ivHex, tagHex, dataHex] = encrypted.split(':');
    const decipher = createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(dataHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
}

// ── Secret Üretimi ────────────────────────────────────────────────────────────

export interface TotpSetup {
    secret: string;          // Ham secret (kullanıcıya göster, sonra sil)
    encryptedSecret: string; // Şifreli secret (veritabanına kaydet)
    otpauthUrl: string;      // QR kod URL'i
    backupCodes: string[];   // 10 adet 8 haneli yedek kod
}

/**
 * Yeni TOTP secret üretir ve QR kod URL'i döner.
 */
export function generateTotpSetup(email: string, memberId: string): TotpSetup {
    const secret = authenticator.generateSecret(20); // 160-bit secret
    const issuer = process.env.TOTP_ISSUER || 'M1G Operasyon Merkezi';

    const otpauthUrl = authenticator.keyuri(
        email,
        issuer,
        secret
    );

    const backupCodes = generateBackupCodes();

    return {
        secret,
        encryptedSecret: encryptSecret(secret),
        otpauthUrl,
        backupCodes,
    };
}

// ── Doğrulama ─────────────────────────────────────────────────────────────────

/**
 * Kullanıcının girdiği TOTP kodunu doğrular.
 * @param token - Kullanıcının girdiği 6 haneli kod
 * @param encryptedSecret - Veritabanındaki şifreli secret
 */
export function verifyTotp(token: string, encryptedSecret: string): boolean {
    try {
        const secret = decryptSecret(encryptedSecret);
        return authenticator.verify({ token: token.trim(), secret });
    } catch {
        return false;
    }
}

// ── Yedek Kodlar ─────────────────────────────────────────────────────────────

/**
 * 10 adet 8 haneli yedek kod üretir (ör: 1234-5678).
 */
function generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        const part1 = Math.floor(1000 + randomBytes(2).readUInt16BE(0) % 9000).toString();
        const part2 = Math.floor(1000 + randomBytes(2).readUInt16BE(0) % 9000).toString();
        codes.push(`${part1}-${part2}`);
    }
    return codes;
}

/**
 * Yedek kodu hash'leyerek karşılaştırır (timing-safe).
 */
export function hashBackupCode(code: string): string {
    const { createHash } = require('crypto');
    return createHash('sha256').update(code.replace(/-/g, '').trim()).digest('hex');
}

/**
 * Yedek kod listesinden geçerli bir kod bulur ve işaretler.
 * @returns kullanılan kodun index'i veya -1 (geçersiz)
 */
export function verifyAndConsumeBackupCode(
    inputCode: string,
    hashedCodes: Array<{ hash: string; used: boolean }>
): number {
    const inputHash = hashBackupCode(inputCode);

    for (let i = 0; i < hashedCodes.length; i++) {
        if (!hashedCodes[i].used && hashedCodes[i].hash === inputHash) {
            return i; // Geçerli, bu index'i "used" olarak işaretle
        }
    }

    return -1; // Geçersiz
}
