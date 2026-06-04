"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Heart, ShieldAlert, Phone, FileText, ChevronLeft, Loader2, Download } from "lucide-react";
import Link from "next/link";

function MedicalProfileContent() {
    const searchParams = useSearchParams();
    
    // Parse query parameters (for zero-internet offline helmet scan fallback)
    const urlName = searchParams.get("n") || "";
    const urlBlood = searchParams.get("bg") || "";
    const urlAllergies = searchParams.get("al") || "";
    const urlStatus = searchParams.get("hs") || "";
    const urlEmergency = searchParams.get("ec") || "";
    
    const [profile, setProfile] = useState({
        name: "Bilinmeyen Personel",
        bloodType: "Belirtilmemiş",
        allergies: "Belirtilmemiş",
        healthStatus: "Belirtilmemiş",
        emergencyContactName: "Belirtilmemiş",
        emergencyContactPhone: "Belirtilmemiş"
    });

    useEffect(() => {
        if (urlName) {
            // Parse emergency contact (e.g. "Ali - 05321112233" or "Ali-0532...")
            let ecName = "Belirtilmemiş";
            let ecPhone = "Belirtilmemiş";
            if (urlEmergency) {
                const parts = urlEmergency.split("-");
                if (parts.length > 1) {
                    ecName = parts[0].trim();
                    ecPhone = parts.slice(1).join("-").trim();
                } else {
                    ecName = urlEmergency;
                }
            }

            setProfile({
                name: decodeURIComponent(urlName),
                bloodType: decodeURIComponent(urlBlood),
                allergies: decodeURIComponent(urlAllergies),
                healthStatus: decodeURIComponent(urlStatus),
                emergencyContactName: decodeURIComponent(ecName),
                emergencyContactPhone: decodeURIComponent(ecPhone)
            });
        }
    }, [urlName, urlBlood, urlAllergies, urlStatus, urlEmergency]);

    // vCard (vcf) downloader function
    const downloadVCard = () => {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
TEL;TYPE=CELL:${profile.emergencyContactPhone}
NOTE:SAR MEDIKAL PROFIL - KAN GRUBU: ${profile.bloodType} | ALERJILER: ${profile.allergies} | SAGLIK: ${profile.healthStatus} | ACIL DURUM: ${profile.emergencyContactName} (${profile.emergencyContactPhone})
END:VCARD`;

        const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `M1G_Medikal_${profile.name.replace(/\s+/g, "_")}.vcf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased selection:bg-red-600/50">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <Link href="/portal" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-all flex items-center justify-center border border-white/5">
                    <ChevronLeft size={20} />
                </Link>
                <div className="text-right">
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">M1G Tıbbi Yardım</span>
                    <h1 className="text-xs text-neutral-500 font-bold tracking-widest uppercase mt-1.5">Acil Durum Profil Ekranı</h1>
                </div>
            </header>

            {/* Main Medical Card Grid */}
            <main className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-6">
                
                {/* Person Name Card */}
                <div className="bg-gradient-to-r from-red-600/20 to-neutral-900 border-2 border-red-600/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl"></div>
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest block mb-1">Arama Kurtarma Personeli</span>
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase break-words">{profile.name}</h2>
                </div>

                {/* Blood Group (Large Warning Card) */}
                <div className="bg-[#0b0f19] border-2 border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Kan Grubu (Blood Type)</span>
                        <p className="text-4xl font-black text-white tracking-tighter uppercase">{profile.bloodType}</p>
                    </div>
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/25 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <Heart size={32} className="fill-red-500/10" />
                    </div>
                </div>

                {/* Allergies Card */}
                <div className={`border-2 rounded-3xl p-6 flex items-center justify-between shadow-xl transition-all ${
                    profile.allergies.toLowerCase() === "yok" || profile.allergies.toLowerCase() === "belirtilmemiş"
                        ? "bg-[#0b0f19] border-white/10"
                        : "bg-amber-950/20 border-amber-500/30 text-amber-200"
                }`}>
                    <div>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Alerjiler ve Hassasiyetler</span>
                        <p className="text-xl font-bold tracking-wide break-words mt-1">{profile.allergies}</p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
                        profile.allergies.toLowerCase() === "yok" || profile.allergies.toLowerCase() === "belirtilmemiş"
                            ? "bg-white/5 border-white/10 text-neutral-400"
                            : "bg-amber-500/10 border-amber-500/25 text-amber-500"
                    }`}>
                        <ShieldAlert size={28} />
                    </div>
                </div>

                {/* FTR / Health Status Card */}
                <div className="bg-[#0b0f19] border-2 border-white/10 rounded-3xl p-6 flex items-center justify-between shadow-xl hover:border-blue-500/30 transition-all">
                    <div>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Kronik Rahatsızlıklar / FTR / Durum</span>
                        <p className="text-xl font-bold tracking-wide mt-1">{profile.healthStatus}</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-500 border border-blue-500/25 rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText size={28} />
                    </div>
                </div>

                {/* Emergency Contact Card */}
                <div className="bg-[#0b0f19] border-2 border-white/10 rounded-3xl p-6 shadow-xl hover:border-emerald-500/30 transition-all">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Acil Durum Yakını İletişim</span>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-neutral-400 uppercase tracking-widest">İsim &amp; Derece</p>
                            <p className="text-lg font-bold text-white mt-0.5">{profile.emergencyContactName}</p>
                        </div>
                        {profile.emergencyContactPhone !== "Belirtilmemiş" ? (
                            <a
                                href={`tel:${profile.emergencyContactPhone}`}
                                className="flex items-center justify-center gap-3 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold tracking-wider transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                <Phone size={16} /> {profile.emergencyContactPhone}
                            </a>
                        ) : (
                            <span className="text-neutral-600 text-sm font-bold uppercase italic">İletişim numarası yok</span>
                        )}
                    </div>
                </div>

            </main>

            {/* Footer Downloader */}
            <footer className="mt-8 border-t border-white/10 pt-6 flex flex-col gap-4 max-w-lg mx-auto w-full">
                <button
                    onClick={downloadVCard}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                    <Download size={15} /> Kişi Listesine Ekle (vCard)
                </button>
                <p className="text-neutral-600 text-[9px] leading-relaxed text-center uppercase tracking-widest">
                    Bu bilgiler kask üzeri QR kodundan çevrimdışı (internetsiz) olarak yüklenmiştir.
                </p>
            </footer>
        </div>
    );
}

export default function MedicalProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
                <Loader2 className="animate-spin text-red-500 w-12 h-12" />
            </div>
        }>
            <MedicalProfileContent />
        </Suspense>
    );
}
