"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Download, FlipHorizontal, Loader2, ChevronLeft, Lock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";
import KimlikCard, { CARD_W, CARD_H } from "@/components/KimlikCard";

const BOARD_PRESIDENT_PHONE = "0 532 703 79 73";
const ASSOCIATION_WEB       = "www.m1g.org.tr";

const borderText = "M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA";
const leftBorderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg width="14" height="510" xmlns="http://www.w3.org/2000/svg"><rect width="14" height="510" fill="#cb2027" /><text x="-255" y="7" transform="rotate(-90)" fill="white" font-size="8" font-weight="900" font-family="Inter, Arial, sans-serif" letter-spacing="2" text-anchor="middle" dominant-baseline="middle">${borderText}</text></svg>`)}`;
const rightBorderSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg width="14" height="510" xmlns="http://www.w3.org/2000/svg"><rect width="14" height="510" fill="#cb2027" /><text x="255" y="-7" transform="rotate(90)" fill="white" font-size="8" font-weight="900" font-family="Inter, Arial, sans-serif" letter-spacing="2" text-anchor="middle" dominant-baseline="middle">${borderText}</text></svg>`)}`;

export default function KimlikPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [flipped, setFlipped]       = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [memberRaw, setMemberRaw] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoadingData(true);
        fetch(`/api/kimlik/${id}`)
            .then(res => {
                if (res.status === 404) {
                    setNotFound(true);
                    return null;
                }
                if (res.status === 403) {
                    setAccessDenied(true);
                    return null;
                }
                if (!res.ok) {
                    throw new Error("API error");
                }
                return res.json();
            })
            .then(data => {
                if (data) {
                    setMemberRaw(data);
                    setAccessDenied(false);
                    setNotFound(false);
                }
            })
            .catch(err => {
                console.error(err);
                setNotFound(true);
            })
            .finally(() => {
                setLoadingData(false);
            });
    }, [id]);

    if (loading || loadingData) {
        return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-red-500" /></div>;
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="text-center bg-white/5 border border-white/10 p-10 rounded-3xl shadow-2xl backdrop-blur-sm">
                    <Lock size={64} className="mx-auto mb-6 text-red-600 opacity-80" />
                    <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Erişim Engellendi</h1>
                    <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                        Bu kimlik kartını görüntüleme yetkiniz bulunmuyor. Yalnızca kart sahibi ve yöneticiler erişebilir.
                    </p>
                    <a href="/login" className="inline-flex items-center justify-center px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                        Sisteme Giriş Yap
                    </a>
                </div>
            </div>
        );
    }

    if (notFound || !memberRaw) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="text-center">
                    <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
                    <h1 className="text-xl font-bold text-white">Kayıt Bulunamadı</h1>
                    <p className="text-neutral-500 mt-2 text-sm">Kimlik ID: {id}</p>
                    <a href="/portal" className="inline-block mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest">
                        Geri Dön
                    </a>
                </div>
            </div>
        );
    }

    const member = {
        ...memberRaw,
        id: memberRaw.id || id,
        name: memberRaw.fullName || "İsimsiz",
        serial: memberRaw.serial || "M1G-0000",
    };

    const role = (() => {
        if (memberRaw.role && memberRaw.role !== "Üye" && memberRaw.role !== "Gönüllü") return memberRaw.role.toUpperCase();
        if (memberRaw.honorary === "Evet") return "ONUR ÜYESİ";
        if (memberRaw.memberType === "Üye" || memberRaw.memberType === "Asil Üye" || memberRaw.memberType === "ASİL ÜYE") return "ÜYE";
        if (memberRaw.memberType && memberRaw.memberType !== "Gönüllü") return memberRaw.memberType.toUpperCase();
        return "GÖNÜLLÜ";
    })();

    let emContactName = "—";
    let emContactPhone = "—";
    if (memberRaw.emergencyContact) {
        const parts = memberRaw.emergencyContact.split('-');
        if(parts.length > 1) {
            emContactName = parts[0].trim();
            emContactPhone = parts.slice(1).join('-').trim();
        } else {
            emContactName = memberRaw.emergencyContact;
        }
    }

    const bloodType = memberRaw.bloodType || "Belirtilmemiş";
    const tcNo = memberRaw.tcNo || "";
    let maskedTc = "Belirtilmemiş";
    if (tcNo) {
        if (tcNo.length === 11) {
            maskedTc = "*******" + tcNo.slice(-4);
        } else {
            maskedTc = "*".repeat(Math.max(0, tcNo.length - 4)) + tcNo.slice(-4);
        }
    }

    const cardUrl = typeof window !== "undefined"
        ? window.location.href
        : `https://m1g.org.tr/kimlik/${id}`;

    const handleDownload = async (side: "front" | "back") => {
        setDownloading(true);
        try {
            const { captureCard } = await import("@/lib/cardCapture");
            const canvas = await captureCard(`m1g-card-${side}`);
            const link = document.createElement("a");
            link.download = `M1G_Kimlik_${member.serial}_${side === "front" ? "On" : "Arka"}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (error: any) {
            alert(`İndirme başarısız. Hata: ${error?.message || "Bilinmeyen hata"}`);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050a14] flex flex-col items-center py-10 px-4">
            <div className="relative z-10 flex flex-col items-center w-full max-w-xs">

                {/* ── Header ── */}
                <div className="flex items-center gap-3 w-full mb-8">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                router.back();
                            } else {
                                router.push(isAdmin ? "/admin/uyeler" : "/portal/profil");
                            }
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Dijital Kimlik</p>
                        <p className="text-neutral-600 text-[10px] uppercase tracking-widest">Fiziki baskı uyumlu tasarım</p>
                    </div>
                </div>

                {/* ── Flip toggle ── */}
                <div className="flex w-full gap-2 mb-6">
                    {["Ön Yüz", "Arka Yüz"].map((label, i) => (
                        <button key={i}
                            onClick={() => setFlipped(i === 1)}
                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                flipped === (i === 1)
                                    ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                                    : "bg-white/5 text-neutral-500 hover:bg-white/10"
                            }`}>
                            {label}
                        </button>
                    ))}
                    <button onClick={() => setFlipped(v => !v)}
                        className="px-3 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-500 hover:text-white transition-colors">
                        <FlipHorizontal size={16} />
                    </button>
                </div>

                {/* ══════════════════════════════════════════
                    ÖN YÜZ
                ══════════════════════════════════════════ */}
                {!flipped && (
                    <div className="shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ borderRadius: 0, overflow: "hidden", flexShrink: 0, width: CARD_W, height: CARD_H }}>
                        <KimlikCard
                            member={member}
                            origin={origin}
                            isFront={true}
                            htmlId="m1g-card-front"
                            scale={1}
                        />
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    ARKA YÜZ
                ══════════════════════════════════════════ */}
                {flipped && (
                    <div className="shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ borderRadius: 0, overflow: "hidden", flexShrink: 0, width: CARD_W, height: CARD_H }}>
                        <KimlikCard
                            member={{ ...member, presidentPhone: memberRaw?.presidentPhone }}
                            origin={origin}
                            isFront={false}
                            htmlId="m1g-card-back"
                            scale={1}
                        />
                    </div>
                )}

                {/* ── Download buttons ── */}
                <div className="grid grid-cols-2 gap-3 w-full mt-5">
                    <button onClick={() => handleDownload("front")} disabled={downloading}
                        className="flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_24px_rgba(220,38,38,0.4)] disabled:opacity-50">
                        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Ön İndir
                    </button>
                    <button onClick={() => handleDownload("back")} disabled={downloading}
                        className="flex items-center justify-center gap-2 py-3.5 bg-white/8 hover:bg-white/15 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                        {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        Arka İndir
                    </button>
                </div>

                {/* ── Info ── */}
                <div className="mt-4 w-full bg-white/3 border border-white/8 rounded-xl p-4">
                    <p className="text-neutral-500 text-[10px] leading-relaxed text-center uppercase tracking-widest">
                        5× ölçek · Baskıya hazır PNG · 54 × 86 mm dikey format
                    </p>
                </div>

            </div>
        </div>
    );
}
