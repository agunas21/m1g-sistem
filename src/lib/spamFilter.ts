/**
 * M1G Güvenlik — Spam Filtresi
 * Form gönderimlerini bot ve spam'den korur.
 */

// Spam anahtar kelimeler (Türkçe + İngilizce)
const SPAM_KEYWORDS = [
  'casino', 'poker', 'bahis', 'slot', 'rulet', 'blackjack',
  'bitcoin', 'crypto', 'btc', 'ethereum', 'binance',
  'viagra', 'cialis', 'levitra',
  'free money', 'win prize', 'click here', 'buy now',
  'discount', 'offer expires', 'limited time',
  'xxx', 'porn', 'adult',
  'weight loss', 'diet pill', 'make money fast',
  'loan', 'mortgage', 'insurance quote',
];

// Şüpheli URL pattern'leri
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  score: number; // 0-100 arası spam skoru
}

export interface FormSubmission {
  text: string;           // Kontrol edilecek metin (mesaj, açıklama vb.)
  submittedAt: number;    // Form açılış zamanı (ms timestamp)
  honeypot?: string;      // Gizli honeypot alanı (bot dolduracak)
  ip?: string;
}

/**
 * Honeypot alanı kontrolü. Botlar gizli alanları da doldurur.
 */
export function checkHoneypot(value: string | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Gönderim zamanı kontrolü. İnsanlar formu en az 3 saniyede doldurur.
 */
export function checkSubmissionTiming(formOpenedAt: number, minSeconds = 3): boolean {
  const elapsed = (Date.now() - formOpenedAt) / 1000;
  return elapsed >= minSeconds;
}

/**
 * Metin içeriğini spam açısından analiz et.
 */
export function analyzeText(text: string): SpamCheckResult {
  if (!text || text.trim() === '') {
    return { isSpam: false, score: 0 };
  }

  let score = 0;
  const reasons: string[] = [];
  const lower = text.toLowerCase();

  // 1. Spam anahtar kelimeler
  const foundKeywords = SPAM_KEYWORDS.filter(kw => lower.includes(kw));
  if (foundKeywords.length > 0) {
    score += foundKeywords.length * 20;
    reasons.push(`Spam anahtar kelime: ${foundKeywords.slice(0, 3).join(', ')}`);
  }

  // 2. URL sayısı (2'den fazla şüpheli)
  const urls = text.match(URL_PATTERN) || [];
  if (urls.length > 2) {
    score += (urls.length - 2) * 15;
    reasons.push(`Çok fazla URL: ${urls.length}`);
  }

  // 3. E-posta sayısı (1'den fazla şüpheli)
  const emails = text.match(EMAIL_PATTERN) || [];
  if (emails.length > 1) {
    score += emails.length * 10;
    reasons.push(`Çok fazla e-posta adresi: ${emails.length}`);
  }

  // 4. BÜYÜK HARF oranı (>%60 şüpheli)
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 10) {
    const upperRatio = (text.replace(/[^A-Z]/g, '').length / letters.length);
    if (upperRatio > 0.6) {
      score += 20;
      reasons.push('Aşırı büyük harf kullanımı');
    }
  }

  // 5. Tekrarlayan karakter (aaaa, !!!!, .... gibi)
  if (/(.)\1{4,}/.test(text)) {
    score += 15;
    reasons.push('Tekrarlayan karakterler');
  }

  // 6. Çok kısa veya çok uzun içerik
  if (text.length > 5000) {
    score += 25;
    reasons.push('Aşırı uzun içerik');
  }

  // 7. Satır sayısı (>20 satır şüpheli)
  const lines = text.split('\n').length;
  if (lines > 20) {
    score += 10;
    reasons.push('Çok fazla satır');
  }

  const finalScore = Math.min(score, 100);
  const isSpam = finalScore >= 50;

  return {
    isSpam,
    score: finalScore,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
  };
}

/**
 * Tam form spam kontrolü (hepsini birleştirir).
 */
export function checkSpam(submission: FormSubmission): SpamCheckResult {
  // 1. Honeypot kontrolü
  if (submission.honeypot !== undefined && !checkHoneypot(submission.honeypot)) {
    return { isSpam: true, score: 100, reason: 'Bot algılandı (honeypot)' };
  }

  // 2. Zamanlama kontrolü
  if (!checkSubmissionTiming(submission.submittedAt, 3)) {
    return { isSpam: true, score: 90, reason: 'Çok hızlı gönderim (bot şüphesi)' };
  }

  // 3. Metin analizi
  return analyzeText(submission.text);
}
