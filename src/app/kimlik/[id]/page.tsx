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

    let role = memberRaw.role || "Gönüllü Üye";
    if (memberRaw.honorary === "Evet") role = "Onur Üyesi";

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
    let maskedTc = "";
    if (tcNo && tcNo.length === 11) {
        maskedTc = "********" + tcNo.slice(-3);
    } else if (tcNo) {
        maskedTc = "*".repeat(Math.max(0, tcNo.length - 3)) + tcNo.slice(-3);
    } else {
        maskedTc = "Belirtilmemiş";
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
                    ÖN YÜZ
                ══════════════════════════════════════════ */}
                {!flipped && (
                    <div
                        id="m1g-card-front"
                        className="rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                        style={{ width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, backgroundColor: "#181818", fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Background subtle pattern */}
                        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />

                        {/* Top Left Texts */}
                        <div style={{ position: "absolute", top: 24, left: 20, display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>M1G ARAMA</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>VE KURTARMA</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>DERNEĞİ</span>
                            <span style={{ fontSize: 9, fontWeight: 500, color: "#a3a3a3", marginTop: 4 }}>(Search & Rescue Association)</span>
                        </div>

                        {/* Top Right Logo */}
                        <div style={{ position: "absolute", top: 20, right: 20 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/m1g-logo.png" alt="Logo" style={{ width: 60, height: 60, objectFit: "contain" }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                        </div>

                        {/* Center Photo */}
                        <div style={{ position: "absolute", top: 115, left: "50%", transform: "translateX(-50%)", width: 110, height: 135, background: "#e5e7eb", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: 8, overflow: "hidden", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {member.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={member.avatar} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: 40, color: "#9ca3af", fontWeight: 800 }}>{member.name.charAt(0)}</span>
                                )}
                            </div>
                        </div>

                        {/* Below Photo Info */}
                        <div style={{ position: "absolute", top: 270, left: 0, right: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "white", textTransform: "uppercase", paddingLeft: 10, paddingRight: 10 }}>{member.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginTop: 6, textTransform: "uppercase" }}>Kan Grubu: {bloodType}</span>
                            <span style={{ fontSize: 10, fontWeight: 500, color: "#d1d5db", marginTop: 2 }}>TC No: {maskedTc}</span>
                        </div>

                        {/* Red Shape on the right bottom */}
                        <div style={{ position: "absolute", bottom: 0, right: 0, left: "30%", height: 85, backgroundColor: "#cb2027", borderTopLeftRadius: 16 }} />

                        {/* Center Bottom: QR Code */}
                        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                            <div style={{ background: "white", padding: 6, borderRadius: 8 }}>
                                <QRCodeSVG value={cardUrl} size={90} level="H" fgColor="#000000" />
                            </div>
                            <span style={{ fontSize: 9, fontWeight: 800, color: "white", marginTop: 6, letterSpacing: "0.5px" }}>DOĞRULAMA İÇİN TARA</span>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    ARKA YÜZ
                ══════════════════════════════════════════ */}
                {flipped && (
                    <div
                        id="m1g-card-back"
                        className="rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                        style={{ width: CARD_W, height: CARD_H, position: "relative", flexShrink: 0, backgroundColor: "#181818", fontFamily: "'Inter', sans-serif" }}
                    >
                        {/* Background subtle pattern */}
                        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />

                        {/* Top Left Texts */}
                        <div style={{ position: "absolute", top: 24, left: 20, display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>M1G ARAMA</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>VE KURTARMA</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.2 }}>DERNEĞİ</span>
                            <span style={{ fontSize: 9, fontWeight: 500, color: "#a3a3a3", marginTop: 4 }}>(Search & Rescue Association)</span>
                        </div>

                        {/* Top Right Logo */}
                        <div style={{ position: "absolute", top: 20, right: 20 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/m1g-logo.png" alt="Logo" style={{ width: 60, height: 60, objectFit: "contain" }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                        </div>

                        {/* Middle Content */}
                        <div style={{ position: "absolute", top: 120, left: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px" }}>ÜYELİK ŞARTLARI VE İLETİŞİM BİLGİLERİ</span>
                            
                            <p style={{ fontSize: 10.5, fontWeight: 500, color: "#d1d5db", lineHeight: 1.5, marginTop: 14 }}>
                                Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez. 
                                Kartın kaybolması veya bulunması durumunda lütfen aşağıdaki iletişim kanalları 
                                aracılığıyla derneğimizi derhal bilgilendiriniz veya en yakın kolluk kuvvetine 
                                (Polis/Jandarma) teslim ediniz.<br/><br/>Anlayışınız için teşekkür ederiz.
                            </p>
                            
                            <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", marginTop: 24 }}>İLETİŞİM BİLGİLERİ</span>
                            {/* Chairman's phone number exactly as requested */}
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "white", marginTop: 8 }}>Telefon: +90 {BOARD_PRESIDENT_PHONE.substring(2)}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "white", marginTop: 5 }}>E-posta: info@m1g.org.tr</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "white", marginTop: 5 }}>Web Sitesi: {ASSOCIATION_WEB}</span>
                        </div>

                        {/* Red Shape on the right bottom */}
                        <div style={{ position: "absolute", bottom: 0, right: 0, left: "30%", height: 85, backgroundColor: "#cb2027", borderTopLeftRadius: 16 }} />

                        {/* Left Bottom: Emergency Contact */}
                        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: "white", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>ACİL DURUMDA ARANACAK KİŞİ</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 9, color: "#a3a3a3", fontWeight: 700 }}>İSİM:</span>
                                <span style={{ fontSize: 10, color: "#ffffff", fontWeight: 700 }}>{emContactName}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 9, color: "#a3a3a3", fontWeight: 700 }}>TEL:</span>
                                <span style={{ fontSize: 10, color: "#ffffff", fontWeight: 700 }}>{emContactPhone}</span>
                            </div>
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
