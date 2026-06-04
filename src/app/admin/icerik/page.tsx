"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Newspaper, Megaphone, GlobeLock, Send, ImagePlus, ShieldAlert } from "lucide-react";

export default function IcerikYonetimi() {
    const [redCodeActive, setRedCodeActive] = useState(false);
    const [newsTitle, setNewsTitle] = useState("");
    const [newsContent, setNewsContent] = useState("");
    
    const [iban, setIban] = useState("TR99 0001 0000 0000 0000 0000 00");
    const [bankName, setBankName] = useState("Ziraat Bankası");
    const [savingSettings, setSavingSettings] = useState(false);

    // Ayarları yükle — useEffect ile doğru side-effect pattern
    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.redCodeActive !== undefined) setRedCodeActive(data.redCodeActive);
                if (data.iban) setIban(data.iban);
                if (data.bankName) setBankName(data.bankName);
            })
            .catch(console.error);
    }, []);

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await fetch("/api/settings", {
                method: "POST",
                body: JSON.stringify({ iban, bankName, redCodeActive })
            });
            alert("Sistem ayarları başarıyla güncellendi.");
        } catch (error) {
            alert("Ayarlar kaydedilirken hata oluştu.");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleRedCodeToggle = async () => {
        const confirmMsg = redCodeActive
            ? "KIRMIZI KOD iptal edilecek. Sistem olağan durumuna dönecek. Emin misiniz?"
            : "DİKKAT: KIRMIZI KOD devreye giriyor! Tüm web sitesinde acil durum bandı yayınlanacak ve otonom sistemler alarm durumuna geçecek. Onaylıyor musunuz?";

        if (confirm(confirmMsg)) {
            const newState = !redCodeActive;
            setRedCodeActive(newState);
            // API'ye kaydet
            try {
                await fetch("/api/settings", {
                    method: "POST",
                    body: JSON.stringify({ redCodeActive: newState })
                });
            } catch (error) {
                console.error("Red code update failed", error);
            }
        }
    };

    const handlePublishNews = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`" ${newsTitle} " başlıklı sahadan haberiniz başarıyla yayınlandı ve M1G Dünyası modülüne eklendi!`);
        setNewsTitle("");
        setNewsContent("");
    };

    return (
        <div className="space-y-8 pb-20">
            {/* HAREKAT YÖNETİM HEADER */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <GlobeLock className="text-red-500" size={28} /> İçerik Üssü
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Acil durum ve yayın yönetimi.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* SOL KOLON: KIRMIZI KOD OVERRIDE */}
                <div className="space-y-8">
                    <motion.div
                        animate={{
                            boxShadow: redCodeActive ? ["0px 0px 0px rgba(234,29,44,0)", "0px 0px 50px rgba(234,29,44,0.6)", "0px 0px 0px rgba(234,29,44,0)"] : "none",
                            borderColor: redCodeActive ? "rgba(234,29,44,1)" : "rgba(255,255,255,0.05)"
                        }}
                        transition={{ repeat: redCodeActive ? Infinity : 0, duration: 2 }}
                        className="bg-[#050B14] border border-white/5 rounded-2xl p-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <ShieldAlert size={150} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-5 md:mb-6">
                                <div className="p-2.5 md:p-3 bg-red-600/20 rounded-xl text-red-500">
                                    <AlertTriangle size={20} className={redCodeActive ? "animate-pulse" : ""} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">Acil Durum Paneli</h2>
                                    <p className="text-[10px] text-neutral-500 font-black tracking-widest uppercase">Kırmızı Kod</p>
                                </div>
                            </div>

                            <p className="text-neutral-400 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed font-light">
                                <strong className="text-white">Kandilli 4.0+</strong> depremlerde sistem otomatik alarm verir. Diğer afetler için bu butonu kullanın.
                            </p>

                            <div className="bg-black/50 border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <h3 className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Şu Anki Durum:</h3>
                                    <span className={`text-xl md:text-2xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-2 ${redCodeActive ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {redCodeActive ? (
                                            <><span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span> KIRMIZI KOD AKTİF</>
                                        ) : (
                                            <><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> DURUM NORMAL</>
                                        )}
                                    </span>
                                </div>
                                <button
                                    onClick={handleRedCodeToggle}
                                    className={`w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${redCodeActive
                                            ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10'
                                            : 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(234,29,44,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {redCodeActive ? 'ALARM DURUMUNU KALDIR' : 'KIRMIZI KOD BAŞLAT'}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* BANKA BİLGİLERİ (IBAN) */}
                    <div className="bg-[#050B14] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-500">
                                <Send size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Bağış & Banka Bilgileri</h2>
                                <p className="text-[10px] text-neutral-500 font-black tracking-widest uppercase">CMS / IBAN Yönetimi</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Banka Adı</label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="Ziraat Bankası, İş Bankası vb."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">IBAN Numarası</label>
                                <input
                                    type="text"
                                    value={iban}
                                    onChange={(e) => setIban(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="TRXX XXXX XXXX XXXX XXXX XXXX XX"
                                />
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={savingSettings}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                            >
                                {savingSettings ? "Kaydediliyor..." : "Banka Bilgilerini Güncelle"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SAĞ KOLON: SAHADAN HABER (DISPATCH) */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Newspaper size={150} />
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-5 md:mb-6 border-b border-white/5 pb-5">
                            <div className="p-2.5 md:p-3 bg-blue-600/10 rounded-xl text-blue-500">
                                <Newspaper size={20} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">Sahadan Haber / Dispatch</h2>
                                <p className="text-[10px] text-neutral-500 font-black tracking-widest uppercase truncate max-w-[200px]">Medya Karuseli</p>
                            </div>
                        </div>

                        <form onSubmit={handlePublishNews} className="space-y-5 flex-1 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Haber Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    value={newsTitle}
                                    onChange={(e) => setNewsTitle(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Örn: Erzincan Operasyonumuz Başarı ile Tamamlandı"
                                />
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Operasyon Detayı</label>
                                <textarea
                                    required
                                    value={newsContent}
                                    onChange={(e) => setNewsContent(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none flex-1"
                                    placeholder="Sahadan gerçekleşen operasyon detaylarını kronolojik olarak aktarın..."
                                ></textarea>
                            </div>

                            <div className="pt-2">
                                <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all mb-6">
                                    <ImagePlus className="mx-auto block text-neutral-500 mb-2" size={24} />
                                    <span className="text-sm font-bold text-neutral-400">Operasyon Fotoğrafı Yükle</span>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                                >
                                    <Send size={18} /> Haberi Anasayfada Paylaş
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

            </div>
        </div>
    );
}
