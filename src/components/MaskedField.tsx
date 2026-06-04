"use client";

/**
 * M1G — MaskedField Bileşeni
 *
 * Hassas PII verilerini (TC No, Telefon, E-posta) maskeli gösterir.
 * "Görüntüle" butonuna basınca sunucudan gerçek değeri çeker + audit log.
 *
 * Super Admin için maskeleme yok — direkt gösterir.
 * 30 saniye sonra otomatik maskelenir.
 */

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

interface MaskedFieldProps {
    label: string;
    maskedValue: string;          // Maskeli değer (sunucu tarafından hesaplanmış)
    memberId: string;
    field: "tcNo" | "phone" | "email";
    isSuperAdmin?: boolean;       // true ise maskeleme yok
    rawValue?: string;            // Super Admin için direkt değer
    icon?: React.ReactNode;
    autoHideSeconds?: number;     // Kaç saniye sonra gizlensin (default: 30)
}

export function MaskedField({
    label,
    maskedValue,
    memberId,
    field,
    isSuperAdmin = false,
    rawValue,
    icon,
    autoHideSeconds = 30,
}: MaskedFieldProps) {
    const [revealed, setRevealed] = useState(false);
    const [realValue, setRealValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Super admin için maskeleme yok
    const displayValue = isSuperAdmin
        ? (rawValue || maskedValue)
        : (revealed ? realValue : maskedValue);

    const isVisible = isSuperAdmin || revealed;

    async function handleReveal() {
        if (isSuperAdmin || loading) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/members/reveal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId, field }),
                credentials: "include",
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erişim reddedildi.");
                return;
            }

            setRealValue(data.value || "Belirtilmemiş");
            setRevealed(true);
            setCountdown(autoHideSeconds);

            // Otomatik gizleme timer
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setRevealed(false);
                setRealValue(null);
                setCountdown(0);
            }, autoHideSeconds * 1000);

            // Geri sayım
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch {
            setError("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    }

    function handleHide() {
        setRevealed(false);
        setRealValue(null);
        setCountdown(0);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
            {/* Label */}
            <div className="flex items-center gap-2 text-neutral-400 mb-2">
                {icon && <span className="text-white/40">{icon}</span>}
                <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
                {isSuperAdmin && (
                    <span className="ml-auto text-[8px] uppercase font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        SÜPERADMİN
                    </span>
                )}
            </div>

            {/* Değer + Buton */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {isVisible ? (
                        <span className="text-white font-medium text-sm font-mono break-all">
                            {displayValue || "Belirtilmemiş"}
                        </span>
                    ) : (
                        <span className="text-neutral-500 font-medium text-sm font-mono tracking-wider">
                            {maskedValue}
                        </span>
                    )}
                </div>

                {/* Butonlar — Super Admin için gösterme */}
                {!isSuperAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        {revealed ? (
                            <>
                                {countdown > 0 && (
                                    <span className="text-[9px] text-amber-500 font-mono">{countdown}s</span>
                                )}
                                <button
                                    onClick={handleHide}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
                                    title="Gizle"
                                >
                                    <EyeOff size={13} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleReveal}
                                disabled={loading}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                title="Görüntüle (audit log kaydedilir)"
                            >
                                {loading ? (
                                    <Loader2 size={11} className="animate-spin" />
                                ) : (
                                    <Eye size={11} />
                                )}
                                {loading ? "" : "Görüntüle"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Hata */}
            {error && (
                <div className="mt-2 flex items-center gap-1.5 text-red-400 text-[10px]">
                    <AlertCircle size={10} />
                    <span>{error}</span>
                </div>
            )}

            {/* Audit log uyarısı */}
            {!isSuperAdmin && !revealed && !loading && (
                <p className="mt-1.5 text-[9px] text-neutral-600">
                    👁 Görüntüleme denetim günlüğüne kaydedilir
                </p>
            )}
        </div>
    );
}
