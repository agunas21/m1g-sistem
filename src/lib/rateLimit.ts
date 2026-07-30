/**
 * M1G Güvenlik — Sliding Window Rate Limiter
 * Mobile GSM Operator (Turkcell/Vodafone/TT) friendly limits.
 */

interface WindowEntry {
  timestamps: number[];
  blockedUntil: number;
  strikeCount: number;
}

const store = new Map<string, WindowEntry>();

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
  resetIn: number;
  retryAfter?: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  blockMs = 0
): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [], blockedUntil: 0, strikeCount: 0 };

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.blockedUntil - now,
      retryAfter: entry.blockedUntil - now,
    };
  }

  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    entry.timestamps = [];
    entry.blockedUntil = 0;
  }

  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= limit) {
    entry.strikeCount += 1;
    const effectiveBlockMs = blockMs > 0 ? blockMs : 0;

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

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetIn: windowMs,
  };
}

export function unblockKey(key: string): void {
  const entry = store.get(key);
  if (entry) {
    entry.blockedUntil = 0;
    entry.strikeCount = 0;
    entry.timestamps = [];
    store.set(key, entry);
  }
}

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

// ── Mobile Operator Friendly Limits ──────────────────────────────────────────

/** Login endpoint: 15 deneme / 10 dakika */
export const RATE_LOGIN   = { limit: 15,   windowMs: 10 * 60 * 1000, blockMs: 2 * 60 * 1000 };
/** API genel: 1000 istek / dakika */
export const RATE_API     = { limit: 1000, windowMs: 60 * 1000,       blockMs: 30 * 1000  };
/** Başvuru formu: 10 başvuru / saat */
export const RATE_APPLY   = { limit: 10,   windowMs: 60 * 60 * 1000,  blockMs: 5 * 60 * 1000 };
/** İletişim formu: 15 mesaj / saat */
export const RATE_CONTACT = { limit: 15,   windowMs: 60 * 60 * 1000,  blockMs: 5 * 60 * 1000 };
/** Şifre sıfırlama: 10 / saat */
export const RATE_RESET   = { limit: 10,   windowMs: 60 * 60 * 1000,  blockMs: 5 * 60 * 1000 };
/** WAF DDoS: GSM Operatörleri için yüksek limit (5000 istek / dk) */
export const RATE_DDOS    = { limit: 5000, windowMs: 60 * 1000,        blockMs: 10 * 1000 };
