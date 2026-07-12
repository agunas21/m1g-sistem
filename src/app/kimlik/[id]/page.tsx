"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Download, FlipHorizontal, Loader2, ChevronLeft, Lock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/AuthContext";

const BOARD_PRESIDENT_PHONE = "0 532 703 79 73";
const ASSOCIATION_WEB       = "www.m1g.org.tr";

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
        name:             memberRaw.fullName   || "İsimsiz",
        serial:           memberRaw.serial || "M1G-0000",
        avatar:           memberRaw.avatar      || "",
        status:           memberRaw.status || "Aktif",
    };

    const role = (() => {
        if (['cgorgu', 'taksit', 'mtasli', 'mseyre', 'gakdor', 'agunas'].includes(memberRaw.id)) return "YÖNETİM KURULU ÜYESİ";
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
            const html2canvas = (await import("html2canvas")).default;
            const el = document.getElementById(`m1g-card-${side}`);
            if (!el) return;
            const canvas = await html2canvas(el, {
                scale: 5,
                useCORS: true,
                backgroundColor: null,
                logging: false,
            });
            const link = document.createElement("a");
            link.download = `M1G_Kimlik_${member.serial}_${side === "front" ? "On" : "Arka"}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch {
            alert("İndirme başarısız. Lütfen tekrar deneyin.");
        } finally {
            setDownloading(false);
        }
    };

    /* ─── Shared card width ─────────────────────────────── */
    // 54:86 portrait ratio, displayed at 320px wide
    const CARD_W = 320;
    const CARD_H = Math.round(CARD_W * 86 / 54); // ≈ 509px

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
                    BANT BİLEŞENİ (KART ETRAFI)
                ══════════════════════════════════════════ */}
                {(() => {
                    const bandText = "M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • ";
                    return (
                        <div id="m1g-border-band" style={{ display: 'none' }} />
                    );
                })()}

                {/* ══════════════════════════════════════════
                    ÖN YÜZ
                ══════════════════════════════════════════ */}
                {!flipped && (
                    <div
                        id="m1g-card-front"
                        className="overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                        style={{ 
                            width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, 
                            backgroundColor: "#ffffff", fontFamily: "'Inter', sans-serif",
                            boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.1), inset -4px -4px 10px rgba(255,255,255,0.5)"
                        }}
                    >
                        {/* BORDER BAND */}
                        <div style={{ position: 'absolute', inset: 0, border: '14px solid #cb2027', pointerEvents: 'none', zIndex: 20 }}>
                            {/* Top Text */}
                            <div style={{ position: 'absolute', top: -14, left: 0, right: 0, height: 14, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Bottom Text */}
                            <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, height: 14, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Left Text */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: -14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Right Text */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: -14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: 'vertical-rl', whiteSpace: 'nowrap' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                        </div>

                        {/* Top text */}
                        <div style={{ position: "absolute", top: 32, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>M1G ARAMA KURTARMA</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>DERNEĞİ</span>
                        </div>

                        {/* Huge Logo with Black Shadow Background */}
                        <div style={{ position: "absolute", top: 85, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5 }}>
                            <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: 4 }}></div>
                            <img src="/m1g-logo.png" alt="Logo" style={{ width: 130, height: 130, objectFit: "contain", zIndex: 5 }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                        </div>

                        {/* Photo Box */}
                        <div style={{ position: "absolute", top: 225, left: "50%", transform: "translateX(-50%)", width: 90, height: 110, borderRadius: 12, border: "3px solid #111111", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, zIndex: 10, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {member.avatar ? (
                                    <img src={member.avatar} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: 36, color: "#9ca3af", fontWeight: 800 }}>{member.name.charAt(0)}</span>
                                )}
                            </div>
                        </div>

                        {/* Member Name */}
                        <div style={{ position: "absolute", top: 345, left: 0, right: 0, textAlign: "center", padding: "0 15px", zIndex: 10 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "#111111", textTransform: "uppercase", letterSpacing: "0px", lineHeight: 1.1 }}>{member.name}</span>
                        </div>

                        {/* Role */}
                        {role !== "ÜYE" && role !== "GÖNÜLLÜ" && (
                            <div style={{ position: "absolute", top: 375, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                                <span style={{ backgroundColor: "#111111", color: "#ffffff", padding: "4px 16px", borderRadius: "100px", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>{role}</span>
                            </div>
                        )}

                        {/* Blood Type & Emergency Contact */}
                        <div style={{ position: "absolute", bottom: 25, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: "#555", letterSpacing: "1px" }}>KAN GRUBU</span>
                                <span style={{ fontSize: 16, fontWeight: 900, color: "#cb2027" }}>{bloodType}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: "#555", letterSpacing: "0.5px" }}>YAKIN İLETİŞİM (ACİL DURUM)</span>
                                <span style={{ fontSize: 12, fontWeight: 900, color: "#111111", marginTop: 2 }}>{emContactName} <span style={{ color: "#cb2027", margin: "0 4px" }}>•</span> {emContactPhone}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    ARKA YÜZ
                ══════════════════════════════════════════ */}
                {flipped && (
                    <div
                        id="m1g-card-back"
                        className="overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                        style={{ 
                            width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, 
                            backgroundColor: "#ffffff", fontFamily: "'Inter', sans-serif",
                            boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.1), inset -4px -4px 10px rgba(255,255,255,0.5)"
                        }}
                    >
                        {/* BORDER BAND */}
                        <div style={{ position: 'absolute', inset: 0, border: '14px solid #cb2027', pointerEvents: 'none', zIndex: 20 }}>
                            {/* Top Text */}
                            <div style={{ position: 'absolute', top: -14, left: 0, right: 0, height: 14, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Bottom Text */}
                            <div style={{ position: 'absolute', bottom: -14, left: 0, right: 0, height: 14, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Left Text */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: -14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                            {/* Right Text */}
                            <div style={{ position: 'absolute', top: 0, bottom: 0, right: -14, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <span style={{ color: 'white', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px', writingMode: 'vertical-rl', whiteSpace: 'nowrap' }}>M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • M1G ARAMA KURTARMA • </span>
                            </div>
                        </div>

                        {/* Top text */}
                        <div style={{ position: "absolute", top: 32, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>M1G ARAMA KURTARMA</span>
                            <span style={{ fontSize: 20, fontWeight: 900, color: "#111", letterSpacing: "0px", lineHeight: 1.1 }}>DERNEĞİ</span>
                        </div>

                        {/* Info Text */}
                        <div style={{ position: "absolute", top: 95, left: 24, right: 24, textAlign: "center" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#555", lineHeight: 1.6 }}>
                                Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez.
                            </p>
                        </div>

                        {/* QR Code in Center */}
                        <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ background: "white", padding: 10, borderRadius: 16, border: "2px solid #111111", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}>
                                <QRCodeSVG value={cardUrl} size={130} level="H" fgColor="#000000" />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 900, color: "#111111", marginTop: 12, letterSpacing: "1px" }}>DOĞRULAMA İÇİN TARA</span>
                        </div>

                        {/* Found/Lost Contact Info */}
                        <div style={{ position: "absolute", bottom: 30, left: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#f3f4f6", border: "2px solid #e5e7eb", padding: "16px", borderRadius: "16px", zIndex: 10 }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>KAYBOLDUĞUNDA ARANACAK NUMARA</span>
                            <span style={{ fontSize: 9, fontWeight: 900, color: "#cb2027", marginTop: 6, letterSpacing: "1px" }}>YÖNETİM KURULU BAŞKANI</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginTop: 2, letterSpacing: "1px" }}>{memberRaw?.presidentPhone || "0(544) 727-6075"}</span>
                        </div>
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
