"use client";

import { useState } from "react";
import { Download, Upload, Mail, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function SistemYedekleme() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    const handleBackupDownload = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/backup");
            if (!res.ok) throw new Error("Yedek alınamadı. Sadece süper adminler yedek alabilir.");
            
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `m1g-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            setMessage("Yedek başarıyla indirildi.");
        } catch (error: any) {
            setMessage(error.message || "Bir hata oluştu.");
        }
        setLoading(false);
    };

    const handleBackupEmail = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/backup?sendEmail=true");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "E-posta gönderilemedi. Lütfen sunucu SMTP ayarlarını kontrol edin.");
            setMessage(data.message || "Yedek e-posta adresinize gönderildi.");
        } catch (error: any) {
            setMessage(error.message || "Bir hata oluştu.");
        }
        setLoading(false);
    };

    const handleRestore = async () => {
        if (!restoreFile) return;
        if (!confirm("DİKKAT: Sistemdeki mevcut tüm veriler (Üyeler, Operasyonlar, Demirbaşlar) SİLİNECEK ve yedeğin üzerine yazılacaktır. Bu işlem GERİ ALINAMAZ. Onaylıyor musunuz?")) return;

        setLoading(true);
        try {
            const fileText = await restoreFile.text();
            const payload = JSON.parse(fileText);

            const res = await fetch("/api/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Geri yükleme başarısız.");
            setMessage("Geri yükleme başarıyla tamamlandı. Sayfayı yenileyebilirsiniz.");
            setRestoreFile(null);
        } catch (error: any) {
            setMessage(error.message || "Geri yükleme sırasında hata oluştu. Dosyanın doğru formatta (.json) olduğundan emin olun.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wider">Sistem Yedekleme ve Kurtarma</h1>
                    <p className="text-neutral-400 mt-1">Veritabanının tam yedeğini alın veya eski bir yedeği sisteme yükleyin.</p>
                </div>
                <ShieldAlert className="text-red-500" size={40} />
            </div>

            {message && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded-xl">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BACKUP SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center space-y-6"
                >
                    <div className="p-4 bg-emerald-500/10 rounded-full">
                        <Download size={32} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Sistem Yedeği Al</h2>
                        <p className="text-sm text-neutral-400 mt-2">Sistemdeki tüm üyeleri, operasyonları ve envanteri tek bir JSON dosyası olarak indirir.</p>
                    </div>
                    <div className="w-full flex flex-col gap-3">
                        <button 
                            onClick={handleBackupDownload}
                            disabled={loading}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={18} /> Cihazıma İndir (.json)
                        </button>

                        <button 
                            onClick={handleBackupEmail}
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail size={18} /> Yedekle ve Mail At
                        </button>
                    </div>
                </motion.div>

                {/* RESTORE SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-white/5 border border-red-500/30 rounded-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                    
                    <div className="p-4 bg-red-500/10 rounded-full">
                        <Upload size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-400">Yedek Yükle (Sıfırla)</h2>
                        <p className="text-sm text-neutral-400 mt-2">Daha önce alınmış bir yedeği sisteme yükler. <span className="text-red-400 font-bold">DİKKAT: Mevcut veriler tamamen silinir!</span></p>
                    </div>
                    
                    <div className="w-full flex flex-col gap-3">
                        <input 
                            type="file" 
                            accept=".json"
                            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500/10 file:text-red-400 hover:file:bg-red-500/20 outline-none"
                        />
                        <button 
                            onClick={handleRestore}
                            disabled={loading || !restoreFile}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold tracking-wider transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        >
                            <ShieldAlert size={18} /> Yedeği Sisteme Kur
                        </button>
                    </div>
                </motion.div>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl mt-6 text-sm text-neutral-400">
                <p><strong>Not:</strong> Mail atma özelliğinin çalışabilmesi için `.env` dosyasında `SMTP_USER` ve `SMTP_PASS` ayarlarının tanımlı olması gerekir.</p>
            </div>
        </div>
    );
}
