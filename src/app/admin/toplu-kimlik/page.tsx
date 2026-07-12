"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from "lucide-react";

export default function TopluKimlik() {
    const [members, setMembers] = useState<any[]>([]);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://m1g.org.tr';

    useEffect(() => {
        fetch('/api/members')
            .then(res => res.json())
            .then(data => {
                setAllMembers(data);
                // Sadece aktif ve geçerli üyeleri al
                const activeMembers = data.filter((m: any) => {
                    const isPasif = (m.dir?.includes("PASİF") || m.dir?.includes("İPTAL")) || m.status === "Pasif" || m.status === "Banlı";
                    return !isPasif && m.fullName && m.memberType;
                });
                setMembers(activeMembers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getRole = (m: any) => {
        if (['cgorgu', 'taksit', 'mtasli', 'mseyre', 'gakdor', 'agunas'].includes(m.id)) return "YÖNETİM KURULU ÜYESİ";
        if (m.honorary === "Evet") return "ONUR ÜYESİ";
        if (m.memberType === "Üye" || m.memberType === "Asil Üye" || m.memberType === "ASİL ÜYE") return "ÜYE";
        if (m.memberType && m.memberType !== "Gönüllü") return m.memberType.toUpperCase();
        return "GÖNÜLLÜ";
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const selectAll = () => {
        setSelectedIds(members.map(m => m.id));
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const exportToZip = async () => {
        if (selectedIds.length === 0) {
            alert("Lütfen dışa aktarmak için en az bir kişi seçin.");
            return;
        }

        try {
            setExporting(true);
            setExportProgress({ current: 0, total: selectedIds.length });

            const JSZip = (await import('jszip')).default;
            const { saveAs } = await import('file-saver');
            const html2canvas = (await import('html2canvas')).default;

            const zip = new JSZip();

            for (let i = 0; i < selectedIds.length; i++) {
                const memberId = selectedIds[i];
                const member = members.find(m => m.id === memberId);
                if (!member) continue;

                setExportProgress(prev => ({ ...prev, current: i + 1 }));

                const frontElement = document.getElementById(`card-front-${member.id}`);
                const backElement = document.getElementById(`card-back-${member.id}`);

                if (frontElement && backElement) {
                    const canvasOptions = { scale: 4, useCORS: true, logging: false, backgroundColor: "#ffffff" };
                    
                    const frontCanvas = await html2canvas(frontElement, canvasOptions);
                    const backCanvas = await html2canvas(backElement, canvasOptions);

                    const frontData = frontCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
                    const backData = backCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");

                    const cleanName = member.fullName.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ ]/g, "").trim().replace(/\s+/g, "_");

                    zip.file(`${cleanName}_ON.png`, frontData, { base64: true });
                    zip.file(`${cleanName}_ARKA.png`, backData, { base64: true });
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "M1G_Secili_Kimlikler.zip");
        } catch (error) {
            console.error("Dışa aktarma hatası:", error);
            alert("Dışa aktarma sırasında bir hata oluştu.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 min-h-screen text-white p-8 print:p-0 print:bg-white">
            <div className="mb-8 flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Toplu Kimlik Yazdırma</h1>
                    <p className="text-neutral-400">Toplam {members.length} aktif personel. Dışa aktarmak istediklerinizi seçin.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    {exporting && (
                        <span className="text-red-400 font-bold animate-pulse text-sm">
                            İşleniyor... ({exportProgress.current} / {exportProgress.total})
                        </span>
                    )}
                    <button onClick={selectAll} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold uppercase rounded-xl transition-all text-sm border border-neutral-700">
                        Tümünü Seç
                    </button>
                    <button onClick={clearSelection} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold uppercase rounded-xl transition-all text-sm border border-neutral-700">
                        Temizle
                    </button>
                    <button onClick={exportToZip} disabled={exporting || selectedIds.length === 0} className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase rounded-xl transition-all text-sm flex items-center gap-2">
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Seçilileri İndir (ZIP)
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .page-break-after { page-break-after: always; }
                }
            `}} />

            <div className="flex flex-wrap gap-6 justify-center print:justify-start">
                {members.map((member, index) => {
                    const role = getRole(member);
                    
                    // Başkan'ın numarasını bul (Yönetim Kurulu Başkanı olan ve telefonu kayıtlı olan ilk kişi, veya cgorgu id'li kişi)
                    const baskan = allMembers.find(m => m.memberType === "Yönetim Kurulu Başkanı" && m.phone) || allMembers.find(m => m.id === "cgorgu");
                    const baskanPhone = baskan?.phone || "+90 544 727 60 75";
                    
                    let emName = "—";
                    let emPhone = "—";
                    if (member.emergencyContact) {
                        const parts = member.emergencyContact.split('-');
                        if (parts.length > 1) {
                            emName = parts[0].trim();
                            emPhone = parts.slice(1).join('-').trim();
                        } else {
                            emName = member.emergencyContact;
                        }
                    }

                    let maskedTc = "Belirtilmemiş";
                    if (member.tcNo) {
                        const cleanTc = member.tcNo.replace(/\*/g, '');
                        if (cleanTc.length >= 4) {
                            maskedTc = "*******" + cleanTc.slice(-4);
                        } else if (member.tcNo.includes('*')) {
                            maskedTc = member.tcNo; // already heavily masked
                        } else {
                            maskedTc = "*".repeat(Math.max(0, cleanTc.length - 4)) + cleanTc.slice(-4);
                        }
                    }

                    return (
                        <div key={index} className="flex flex-col gap-2 mb-4 print:mb-0">
                            <div className="flex items-center gap-2 print:hidden bg-neutral-800 p-3 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors border border-neutral-700" onClick={() => toggleSelection(member.id)}>
                                <input type="checkbox" className="w-5 h-5 accent-red-600 pointer-events-none" checked={selectedIds.includes(member.id)} readOnly />
                                <span className="font-bold">{member.fullName}</span>
                                <span className="text-neutral-400 text-sm ml-auto">{role}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4" style={{ pageBreakInside: 'avoid' }}>
                                {/* ÖN YÜZ */}
                                <div id={`card-front-${member.id}`} className="relative shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", fontFamily: "'Inter', sans-serif", boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.05), inset -4px -4px 10px rgba(255,255,255,0.5)", overflow: "hidden" }}>
                                <div style={{ width: 320, height: 509, transform: "scale(0.6375)", transformOrigin: "top left", position: "relative" }}>
                                    {/* BORDER BAND */}
                                    <div style={{ position: 'absolute', inset: 0, border: '14px solid #cb2027', borderRadius: '24px', pointerEvents: 'none', zIndex: 20 }}>
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
                                    <div style={{ position: "absolute", top: 35, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                                        <span style={{ fontSize: 16, fontWeight: 900, color: "#111", letterSpacing: "0px", whiteSpace: "nowrap" }}>M1G ARAMA KURTARMA DERNEĞİ</span>
                                    </div>

                                    {/* Huge Logo with Black Shadow Background */}
                                    <div style={{ position: "absolute", top: 90, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5 }}>
                                        <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)", zIndex: 4 }}></div>
                                        <img src="/m1g-logo.png" alt="Logo" style={{ width: 110, height: 110, objectFit: "contain", zIndex: 5 }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                                    </div>

                                    {/* Photo Box */}
                                    <div style={{ position: "absolute", top: 215, left: "50%", transform: "translateX(-50%)", width: 90, height: 110, borderRadius: 12, border: "3px solid #111111", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, zIndex: 10, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
                                        <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {member.avatar ? (
                                                <img src={member.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                <span style={{ fontSize: 36, color: "#9ca3af", fontWeight: 800 }}>{member.fullName.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Member Name */}
                                    <div style={{ position: "absolute", top: 340, left: 0, right: 0, textAlign: "center", padding: "0 15px", zIndex: 10 }}>
                                        <span style={{ fontSize: 24, fontWeight: 900, color: "#111111", textTransform: "uppercase", letterSpacing: "0px", lineHeight: 1.1 }}>{member.fullName}</span>
                                    </div>

                                    {/* Role */}
                                    {role !== "ÜYE" && role !== "GÖNÜLLÜ" && (
                                        <div style={{ position: "absolute", top: 385, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                                            <span style={{ backgroundColor: "#111111", color: "#ffffff", padding: "4px 16px", borderRadius: "100px", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>{role}</span>
                                        </div>
                                    )}

                                    {/* Blood Type & Emergency Contact */}
                                    <div style={{ position: "absolute", bottom: 25, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, color: "#555", letterSpacing: "1px" }}>KAN GRUBU</span>
                                            <span style={{ fontSize: 16, fontWeight: 900, color: "#cb2027" }}>{member.bloodType || 'Belirtilmemiş'}</span>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontSize: 9, fontWeight: 900, color: "#555", letterSpacing: "0.5px" }}>YAKIN İLETİŞİM (ACİL DURUM)</span>
                                            <span style={{ fontSize: 12, fontWeight: 900, color: "#111111", marginTop: 2 }}>{emName} <span style={{ color: "#cb2027", margin: "0 4px" }}>•</span> {emPhone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* ARKA YÜZ */}
                            <div id={`card-back-${member.id}`} className="relative shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", fontFamily: "'Inter', sans-serif", boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.05), inset -4px -4px 10px rgba(255,255,255,0.5)", overflow: "hidden" }}>
                                <div style={{ width: 320, height: 509, transform: "scale(0.6375)", transformOrigin: "top left", position: "relative" }}>
                                    {/* BORDER BAND */}
                                    <div style={{ position: 'absolute', inset: 0, border: '14px solid #cb2027', borderRadius: '24px', pointerEvents: 'none', zIndex: 20 }}>
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
                                    <div style={{ position: "absolute", top: 35, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
                                        <span style={{ fontSize: 16, fontWeight: 900, color: "#111", letterSpacing: "0px", whiteSpace: "nowrap" }}>M1G ARAMA KURTARMA DERNEĞİ</span>
                                    </div>

                                    {/* Info Text */}
                                    <div style={{ position: "absolute", top: 90, left: 24, right: 24, textAlign: "center" }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: "#555", lineHeight: 1.6 }}>
                                            Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez.
                                        </p>
                                    </div>

                                    {/* QR Code in Center */}
                                    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ background: "white", padding: 10, borderRadius: 16, border: "2px solid #111111", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}>
                                            <QRCodeSVG value={`${origin}/kimlik/${member.kimlikToken}`} size={130} level="H" fgColor="#000000" />
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 900, color: "#111111", marginTop: 12, letterSpacing: "1px" }}>DOĞRULAMA İÇİN TARA</span>
                                    </div>

                                    {/* Found/Lost Contact Info */}
                                    <div style={{ position: "absolute", bottom: 30, left: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", backgroundColor: "#f3f4f6", border: "2px solid #e5e7eb", padding: "16px", borderRadius: "16px", zIndex: 10 }}>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>KAYBOLDUĞUNDA ARANACAK NUMARA</span>
                                        <span style={{ fontSize: 9, fontWeight: 900, color: "#cb2027", marginTop: 6, letterSpacing: "1px" }}>YÖNETİM KURULU BAŞKANI</span>
                                        <span style={{ fontSize: 18, fontWeight: 900, color: "#111111", marginTop: 2, letterSpacing: "1px" }}>{baskanPhone}</span>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
