import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'm1g-super-secret-key-2026';

// AES-256-GCM için şifreleme anahtarı (32 byte)
// Production'da .env dosyasında ENCRYPTION_KEY tanımlanmalı
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'm1g-aes-encryption-key-2026-sec!';
// 32 byte'a getir
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(ENCRYPTION_KEY_RAW)
  .digest(); // 32 byte Buffer

// ── JWT ─────────────────────────────────────────────────────────────────────

// 🔐 Custom JWT Implementation (No external dependencies)
export function signJwt(payload: any, expiresInSeconds = 86400) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string) {
    try {
        if (!token) return null;
        const [header, body, signature] = token.split('.');
        if (!header || !body || !signature) return null;
        
        const expectedSignature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expectedSignature) return null;
        
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }
        return payload;
    } catch {
        return null;
    }
}

// ── Şifre Hashing (scrypt) ───────────────────────────────────────────────────

// 🔐 Custom Password Hashing (Equivalent to bcrypt, using scrypt)
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}

export function comparePassword(password: string, hash: string): boolean {
    try {
        const [salt, key] = hash.split(':');
        if (!salt || !key) return false;
        const keyBuffer = Buffer.from(key, 'hex');
        const derivedKey = crypto.scryptSync(password, salt, 64);
        return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
        return false;
    }
}

// ── AES-256-GCM PII Şifreleme ────────────────────────────────────────────────

const AES_PREFIX = 'aes256gcm:';

/**
 * Hassas veriyi AES-256-GCM ile şifreler.
 * Dönen format: "aes256gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encryptField(plaintext: string): string {
    if (!plaintext) return plaintext;
    // Zaten şifrelenmiş mi?
    if (plaintext.startsWith(AES_PREFIX)) return plaintext;

    const iv = crypto.randomBytes(12); // 96-bit IV (GCM standartı)
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${AES_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * AES-256-GCM ile şifrelenmiş veriyi çözer.
 * Şifrelenmemiş değer gelirse olduğu gibi döndürür.
 */
export function decryptField(ciphertext: string): string {
    if (!ciphertext) return ciphertext;
    if (!ciphertext.startsWith(AES_PREFIX)) return ciphertext; // Şifrelenmemiş, plain

    try {
        const raw = ciphertext.slice(AES_PREFIX.length);
        const parts = raw.split(':');
        if (parts.length !== 3) return ciphertext;

        const [ivHex, authTagHex, encHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encData = Buffer.from(encHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encData), decipher.final()]);
        return decrypted.toString('utf8');
    } catch {
        // Bozuk şifreli veri — güvenli şekilde boş döndür
        return '';
    }
}

/**
 * Şifrelenmiş alanı maskeler (admin olmayan kullanıcılar için).
 * TC No: "12345678901" → "123****8901"
 * Telefon: "5551234567" → "555***4567"
 */
export function maskField(value: string, visibleStart = 3, visibleEnd = 3): string {
    if (!value) return '';
    // Önce çöz (şifreliyse)
    const plain = decryptField(value);
    if (!plain || plain.length <= visibleStart + visibleEnd) return '***';
    const start = plain.slice(0, visibleStart);
    const end = plain.slice(-visibleEnd);
    const masked = '*'.repeat(Math.max(plain.length - visibleStart - visibleEnd, 3));
    return `${start}${masked}${end}`;
}

/**
 * Bir üye objesindeki hassas alanları şifreler (yeni kayıt / güncelleme için).
 */
export function encryptMemberFields(member: any): any {
    const result = { ...member };
    if (result.tcNo && !result.tcNo.startsWith(AES_PREFIX)) {
        result.tcNo = encryptField(result.tcNo);
    }
    return result;
}

/**
 * Bir üye objesindeki şifreli alanları çözer (sadece admin için).
 */
export function decryptMemberFields(member: any): any {
    const result = { ...member };
    if (result.tcNo) result.tcNo = decryptField(result.tcNo);
    return result;
}

/**
 * Bir üye objesindeki hassas alanları maskeler (normal kullanıcı için).
 */
export function maskMemberFields(member: any): any {
    const result = { ...member };
    if (result.tcNo) result.tcNo = maskField(result.tcNo, 3, 2);
    return result;
}

/**
 * Değerin AES şifreli olup olmadığını kontrol eder.
 */
export function isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(AES_PREFIX);
}
