/**
 * M1G — RBAC (Role-Based Access Control) & IDOR Koruması
 *
 * Tüm server-side yetki kontrolleri buradan yapılır.
 * Hiçbir zaman client-side yetki kontrolüne güvenilmez.
 */

export interface JwtActor {
    sub: string;         // Kullanıcı ID
    email?: string;
    role?: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    loginMethod?: string;
    iat?: number;
    exp?: number;
}

// ── Rol Hiyerarşisi ───────────────────────────────────────────────────────────

// Yüksek yetkili roller — admin paneli tam erişim, MFA zorunlu
export const HIGH_PRIVILEGE_ROLES = [
    'Yönetim Kurulu Başkanı',
    'Başkan Yardımcısı',
    'Genel Sekreter',
    'Sayman',
    'Yönetim Kurulu Üyesi',
    'Denetim Kurulu Başkanı',
    'Denetim Kurulu Üyesi',
    'Disiplin Kurulu Başkanı',
    'Disiplin Kurulu Üyesi',
    'Lojistik Sorumlusu',
    'admin',
    'super_admin',
];

// MFA zorunlu roller (Kullanıcı kararı: sadece Yönetim Kurulu)
export const MFA_REQUIRED_ROLES = [
    'Yönetim Kurulu Başkanı',
    'Başkan Yardımcısı',
    'Genel Sekreter',
    'Sayman',
    'Yönetim Kurulu Üyesi',
    'admin',
    'super_admin',
];

// ── Yetki Kontrol Fonksiyonları ───────────────────────────────────────────────

/**
 * Super admin mi? (tüm kısıtlamaların dışında)
 */
export function isSuperAdmin(actor: JwtActor): boolean {
    return actor.isSuperAdmin === true || actor.role === 'super_admin';
}

/**
 * Admin paneline erişim yetkisi var mı?
 */
export function canAccessAdmin(actor: JwtActor): boolean {
    return actor.isAdmin === true || isSuperAdmin(actor) ||
        HIGH_PRIVILEGE_ROLES.includes(actor.role || '');
}

/**
 * Belirli bir üyeyi görüntüleme yetkisi var mı?
 * Normal üyeler sadece kendilerini görebilir.
 */
export function canViewMember(actor: JwtActor, targetMemberId: string): boolean {
    if (isSuperAdmin(actor) || canAccessAdmin(actor)) return true;
    return actor.sub === targetMemberId; // Sadece kendi profili
}

/**
 * Üye bilgilerini düzenleme yetkisi var mı?
 */
export function canEditMember(actor: JwtActor, targetMemberId: string): boolean {
    if (isSuperAdmin(actor) || actor.isAdmin === true) return true;
    if (HIGH_PRIVILEGE_ROLES.includes(actor.role || '') &&
        actor.role !== 'Lojistik Sorumlusu') return true;
    // Normal üye sadece kendi profilini düzenleyebilir (kısıtlı alanlar)
    return actor.sub === targetMemberId;
}

/**
 * PII (Kişisel Tanımlayıcı Bilgi) görüntüleme yetkisi var mı?
 * TC No, Telefon, E-posta — maskesiz görmek için
 *
 * Kural: Super Admin maskesiz, diğerleri audit log + izin gerekir
 */
export function canViewPII(actor: JwtActor, targetMemberId: string): boolean {
    // Super admin kısıtlama yok
    if (isSuperAdmin(actor)) return true;
    // Kendi verisine erişim
    if (actor.sub === targetMemberId) return true;
    // Admin + Yönetim Kurulu: audit log yazılarak erişebilir
    if (canAccessAdmin(actor)) return true;
    return false;
}

/**
 * Veri dışa aktarma (CSV, Excel) yetkisi var mı?
 */
export function canExportData(actor: JwtActor): boolean {
    if (isSuperAdmin(actor) || actor.isAdmin === true) return true;
    return [
        'Yönetim Kurulu Başkanı',
        'Genel Sekreter',
        'Sayman',
    ].includes(actor.role || '');
}

/**
 * Üyeyi banlama yetkisi var mı?
 */
export function canBanMember(actor: JwtActor): boolean {
    return isSuperAdmin(actor) || actor.isAdmin === true;
}

/**
 * Üyeyi silme yetkisi var mı?
 */
export function canDeleteMember(actor: JwtActor): boolean {
    return isSuperAdmin(actor) || actor.isAdmin === true;
}

/**
 * Rol atama yetkisi var mı?
 */
export function canAssignRole(actor: JwtActor): boolean {
    return isSuperAdmin(actor) || actor.isAdmin === true;
}

/**
 * MFA bu kullanıcı için zorunlu mu?
 */
export function isMfaRequired(actor: JwtActor): boolean {
    return MFA_REQUIRED_ROLES.includes(actor.role || '');
}

// ── Yardımcı: Mask Fonksiyonları ──────────────────────────────────────────────

/**
 * TC Kimlik numarasını maskeler: 12345678901 → 12345****01
 */
export function maskTcNo(value: string): string {
    if (!value || value.length < 4) return '***';
    return value.slice(0, 5) + '****' + value.slice(-2);
}

/**
 * Telefon numarasını maskeler: 05321234567 → 0532****567
 */
export function maskPhone(value: string): string {
    if (!value || value.length < 6) return '***';
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 4) + '****' + digits.slice(-3);
}

/**
 * E-posta adresini maskeler: user@m1g.org.tr → *****@m1g.org.tr
 */
export function maskEmail(value: string): string {
    if (!value || !value.includes('@')) return '***';
    const [local, domain] = value.split('@');
    return '*'.repeat(Math.min(local.length, 5)) + '@' + domain;
}

/**
 * Değeri maskeler veya ham döner — actor yetkisine göre.
 */
export function applyMask(
    value: string,
    field: 'tcNo' | 'phone' | 'email',
    actor: JwtActor,
    targetMemberId: string
): string {
    // Super admin maskeleme yok
    if (isSuperAdmin(actor) || actor.sub === targetMemberId) return value;

    switch (field) {
        case 'tcNo':    return maskTcNo(value);
        case 'phone':   return maskPhone(value);
        case 'email':   return maskEmail(value);
        default:        return value;
    }
}
