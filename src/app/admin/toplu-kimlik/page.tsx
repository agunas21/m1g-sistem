"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from "lucide-react";

export default function TopluKimlik() {
    const [members, setMembers] = useState<any[]>([]);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        if (m.memberType && m.memberType !== "Üye" && m.memberType !== "Gönüllü") {
            return m.memberType;
        }
        if (['cgorgu', 'taksit', 'mtasli', 'mseyre', 'gakdor', 'agunas'].includes(m.id)) return "Yönetim Kurulu Üyesi";
        if (m.honorary === "Evet") return "Onur Üyesi";
        if (m.memberType === "Üye") return "Asil Üye";
        return "Gönüllü";
    };

    const handlePrint = () => {
        window.print();
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
                    <p className="text-neutral-400">Toplam {members.length} aktif personelin kimlik kartı yükleniyor.</p>
                </div>
                <button onClick={handlePrint} className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold uppercase rounded-xl transition-all text-sm">
                    Yazdır (A4)
                </button>
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
                        <div key={index} className="flex gap-4 mb-4" style={{ pageBreakInside: 'avoid' }}>
                            {/* ÖN YÜZ */}
                            <div className="relative overflow-hidden shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#181818", border: "1px solid #333", fontFamily: "'Inter', sans-serif" }}>
                                <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
                                
                                {/* Üst Yazı - Tam Ortada */}
                                <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.1 }}>M1G ARAMA</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.1 }}>VE KURTARMA</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.1 }}>DERNEĞİ</span>
                                    <span style={{ fontSize: 7, fontWeight: 500, color: "#a3a3a3", marginTop: 2 }}>(Search & Rescue Association)</span>
                                </div>
                                
                                {/* Daha Büyük Logo */}
                                <div style={{ position: "absolute", top: 65, left: "50%", transform: "translateX(-50%)" }}>
                                    <img src="/m1g-logo.png" alt="Logo" style={{ width: 65, height: 65, objectFit: "contain" }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                                </div>
                                
                                {/* Profil Fotoğrafı */}
                                <div style={{ position: "absolute", top: 135, left: "50%", transform: "translateX(-50%)", width: 80, height: 100, background: "#e5e7eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: 3 }}>
                                    <div style={{ width: "100%", height: "100%", borderRadius: 6, overflow: "hidden", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {member.avatar ? (
                                            <img src={member.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <span style={{ fontSize: 30, fontWeight: 800, color: "#9ca3af" }}>{member.fullName.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Kişi Bilgileri */}
                                <div style={{ position: "absolute", top: 245, left: 0, right: 0, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: "white", textTransform: "uppercase", paddingLeft: 10, paddingRight: 10 }}>{member.fullName}</span>
                                    <span style={{ color: "#ef4444", fontSize: 10, marginTop: 4, fontWeight: 900, textTransform: "uppercase" }}>{role}</span>
                                    <span style={{ fontSize: 9, fontWeight: 500, color: "#d1d5db", marginTop: 4 }}>TC No: {maskedTc}</span>
                                    <span style={{ fontSize: 9, fontWeight: 500, color: "#d1d5db", marginTop: 2 }}>Kan Grubu: {member.bloodType || 'Belirtilmemiş'}</span>
                                </div>

                                <div style={{ position: "absolute", bottom: 0, right: 0, left: "30%", height: 65, backgroundColor: "#cb2027", borderTopLeftRadius: 16 }} />
                                
                                {/* Sol Alt: Acil Durum Kişisi */}
                                <div style={{ position: "absolute", bottom: 15, left: 10, right: 10, display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: 10 }}>
                                    <span style={{ fontSize: 8, fontWeight: 900, color: "white", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>ACİL DURUMDA ARANACAK KİŞİ</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                        <span style={{ fontSize: 7, color: "#a3a3a3", fontWeight: 700 }}>İSİM:</span>
                                        <span style={{ fontSize: 8, color: "#ffffff", fontWeight: 700 }}>{emName}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ fontSize: 7, color: "#a3a3a3", fontWeight: 700 }}>TEL:</span>
                                        <span style={{ fontSize: 8, color: "#ffffff", fontWeight: 700 }}>{emPhone}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* ARKA YÜZ */}
                            <div className="relative overflow-hidden shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#181818", border: "1px solid #333", fontFamily: "'Inter', sans-serif" }}>
                                <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
                                
                                {/* Arka Yüz Üst Kısım */}
                                <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.1 }}>M1G ARAMA</span>
                                    <span style={{ fontSize: 13, fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1.1 }}>VE KURTARMA</span>
                                </div>
                                
                                <div style={{ position: "absolute", top: 50, left: 16, right: 16, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                                    <span style={{ fontSize: 11, fontWeight: 900, color: "white", letterSpacing: "0.5px" }}>ÜYELİK ŞARTLARI</span>
                                    
                                    <p style={{ fontSize: 9, fontWeight: 500, color: "#d1d5db", lineHeight: 1.4, marginTop: 10 }}>
                                        Bu kimlik kartı, M1G Arama ve Kurtarma Derneği'ne aittir ve başkasına devredilemez. 
                                        Bulunması durumunda derhal derneğimizi bilgilendiriniz veya 
                                        kolluk kuvvetine teslim ediniz.<br/><br/>
                                        Anlayışınız için teşekkür ederiz.
                                    </p>
                                    
                                    <span style={{ fontSize: 11, fontWeight: 900, color: "white", letterSpacing: "0.5px", marginTop: 16 }}>KAYIP DURUMUNDA İLETİŞİM</span>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginTop: 6 }}>BAŞKAN: {baskanPhone}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, color: "white", marginTop: 4 }}>E-posta: info@m1g.org.tr</span>
                                </div>
                                
                                <div style={{ position: "absolute", bottom: 0, right: 0, left: "30%", height: 65, backgroundColor: "#cb2027", borderTopLeftRadius: 16 }} />
                                
                                {/* QR Kod (Arkada) */}
                                <div style={{ position: "absolute", bottom: 15, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                                    <div style={{ background: "white", padding: 6, borderRadius: 8 }}>
                                        <QRCodeSVG value={`${origin}/kimlik/${member.kimlikToken}`} size={70} level="H" fgColor="#000000" />
                                    </div>
                                    <span style={{ fontSize: 8, fontWeight: 800, marginTop: 4, color: "white", letterSpacing: "0.5px" }}>DOĞRULAMA İÇİN TARA</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
