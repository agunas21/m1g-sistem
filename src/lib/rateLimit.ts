/**
 * M1G Güvenlik — Sliding Window Rate Limiter
 * Tüm API route'ları ve WAF middleware için merkezi rate limiting.
 */

interface WindowEntry {
  timestamps: number[];
  blockedUntil: number;
  strikeCount: number;
}

// Global in-memory store (Next.js server process başına)
const store = new Map<string, WindowEntry>();

// Temizleme: 5 dakikada bir eski kayıtları sil
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.blockedUntil < now && entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms
  retryAfter?: number; // ms
}

/**
 * Sliding window rate limit kontrolü.
 * @param key      Benzersiz anahtar (ip, ip+route, ip+user gibi)
 * @param limit    İzin verilen maksimum istek sayısı
 * @param windowMs Zaman penceresi (ms)
 * @param blockMs  Limit aşılınca blok süresi (ms). 0 = blok yok, sadece ret
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  blockMs = 0
): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [], blockedUntil: 0, strikeCount: 0 };

  // Aktif blok kontrolü
  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.blockedUntil - now,
      retryAfter: entry.blockedUntil - now,
    };
  }

  // Blok süresi geçtiyse sıfırla
  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    entry.timestamps = [];
    entry.blockedUntil = 0;
  }

  // Pencere dışındaki eski timestamp'leri temizle
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  // Limit kontrolü
  if (entry.timestamps.length >= limit) {
    entry.strikeCount += 1;
    // Tekrarlayan ihlallerde bloklama süresini artır
    const effectiveBlockMs = blockMs > 0
      ? blockMs * Math.min(entry.strikeCount, 4) // max 4x
      : 0;

    if (effectiveBlockMs > 0) {
      entry.blockedUntil = now + effectiveBlockMs;
    }
    store.set(key, entry);

    return {
      allowed: false,
      remaining: 0,
      resetIn: (entry.timestamps[0] + windowMs) - now,
      retryAfter: effectiveBlockMs > 0 ? effectiveBlockMs : windowMs,
    };
  }

  // İsteği kaydet
  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetIn: windowMs,
  };
}

/**
 * Belirli bir key için bloğu manuel kaldır (admin işlemi)
 */
export function unblockKey(key: string): void {
  const entry = store.get(key);
  if (entry) {
    entry.blockedUntil = 0;
    entry.strikeCount = 0;
    entry.timestamps = [];
    store.set(key, entry);
  }
}

/**
 * Tüm bloklu IP'leri listele
 */
export function getBlockedEntries(): Array<{ key: string; blockedUntil: number; strikes: number }> {
  const now = Date.now();
  const result: Array<{ key: string; blockedUntil: number; strikes: number }> = [];
  for (const [key, entry] of store.entries()) {
    if (entry.blockedUntil > now) {
      result.push({ key, blockedUntil: entry.blockedUntil, strikes: entry.strikeCount });
    }
  }
  return result;
}

/**
 * Genel istatistikler
 */
export function getRateLimitStats() {
  const now = Date.now();
  let totalTracked = 0;
  let totalBlocked = 0;
  for (const entry of store.values()) {
    totalTracked++;
    if (entry.blockedUntil > now) totalBlocked++;
  }
  return { totalTracked, totalBlocked, storeSize: store.size };
}

// ── Hazır profil sabitleri ──────────────────────────────────────────────────

/** Login endpoint: 5 deneme / 10 dakika, 15 dk blok */
export const RATE_LOGIN   = { limit: 5,   windowMs: 10 * 60 * 1000, blockMs: 15 * 60 * 1000 };
/** API genel: 100 istek / dakika, 2 dk blok */
export const RATE_API     = { limit: 100, windowMs: 60 * 1000,       blockMs: 2 * 60 * 1000  };
/** Başvuru formu: 3 başvuru / saat, 1 saat blok */
export const RATE_APPLY   = { limit: 3,   windowMs: 60 * 60 * 1000,  blockMs: 60 * 60 * 1000 };
/** İletişim formu: 5 mesaj / saat */
export const RATE_CONTACT = { limit: 5,   windowMs: 60 * 60 * 1000,  blockMs: 30 * 60 * 1000 };
/** Şifre sıfırlama: 3 / saat */
export const RATE_RESET   = { limit: 3,   windowMs: 60 * 60 * 1000,  blockMs: 60 * 60 * 1000 };
/** WAF DDoS: 200 istek / dakika penceresi */
export const RATE_DDOS    = { limit: 200, windowMs: 60 * 1000,        blockMs: 10 * 60 * 1000 };
