"use client";

import { useState, useEffect } from "react";
import { CreditCard, UploadCloud, CheckCircle2, Clock, Info, ShieldCheck, Camera, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function AidatBagisPage() {
    const { user } = useAuth();
    const [yil, setYil] = useState(new Date().getFullYear().toString());
    const [tutar, setTutar] = useState("");
    const [dekontUrl, setDekontUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [pastApprovals, setPastApprovals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/approvals");
            const data = await res.json();
            setPastApprovals(data.filter((a: any) => a.type === "aidat_dekont" && a.memberId === ((user as any)?.uid || (user as any)?.id)));
        } catch {
            console.error("Geçmiş aidat bilgileri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMyApprovals();
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setDekontUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dekontUrl || !selectedFile) {
            alert("Lütfen bir dekont fotoğrafı yükleyin.");
            return;
        }

        setIsUploading(true);
        try {
            // Harici Sunucuya Yükleme
            const fd = new FormData();
            fd.append('file', selectedFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
            const uploadData = await uploadRes.json();

            if (!uploadData.success || !uploadData.url) {
                alert("Dosya yüklenirken bir hata oluştu: " + (uploadData.error || "Bilinmeyen hata"));
                setIsUploading(false);
                return;
            }

            const res = await fetch("/api/approvals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "aidat_dekont",
                    memberId: (user as any)?.uid || (user as any)?.id,
                    memberName: user?.displayName || user?.email,
                    changes: {
                        yil,
                        tutar: tutar + " ₺",
                        dekont_url: uploadData.url
                    }
                })
            });

            if (res.ok) {
                setSuccessMsg("Dekontunuz yönetime iletildi. Onaylandıktan sonra profilinize yansıyacaktır.");
                setDekontUrl(null);
                setSelectedFile(null);
                setTutar("");
                fetchMyApprovals();
                setTimeout(() => setSuccessMsg(""), 5000);
            } else {
                alert("Yükleme sırasında bir hata oluştu.");
            }
        } catch (err) {
            alert("Sunucuya bağlanılamadı.");
        } finally {
            setIsUploading(false);
        }
    };

    const STATUS_STYLE: Record<string, string> = {
        pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
        approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    const STATUS_LABEL: Record<string, string> = {
        pending: "Yönetim Onayı Bekliyor", 
        approved: "Onaylandı", 
        rejected: "Reddedildi",
    };

    return (
        <div className="space-y-6 pb-20 max-w-4xl">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <CreditCard className="text-red-500" size={26} /> Aidat & Bağış Yönetimi
                </h1>
                <p className="text-neutral-500 text-sm mt-1">Yıllık aidat ödemelerinizi ve dekontlarınızı buradan yönetebilirsiniz.</p>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div className="text-[11px] text-blue-400/80">
                    <p className="mb-1"><strong>Dernek Hesap Bilgileri:</strong> TR12 3456 7890 1234 5678 9012 34 (X Bankası - M1G Derneği)</p>
                    <p>Ödemenizi yaptıktan sonra lütfen dekont görselini veya ekran görüntüsünü aşağıdan yükleyerek bildirimde bulununuz.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DEKONT YÜKLEME FORMU */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-red-600/10 rounded-bl-2xl">
                        <UploadCloud size={20} className="text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest">Dekont Bildirimi</h2>

                    <AnimatePresence>
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                <CheckCircle2 size={16} className="inline mr-2" /> {successMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Aidat Yılı</label>
                                <select 
                                    value={yil} 
                                    onChange={(e) => setYil(e.target.value)} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none appearance-none"
                                >
                                    <option value="2026">2026 Yılı</option>
                                    <option value="2025">2025 Yılı</option>
                                    <option value="2024">2024 Yılı</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Ödenen Tutar</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        required 
                                        value={tutar} 
                                        onChange={(e) => setTutar(e.target.value)} 
                                        placeholder="Örn: 1200" 
                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-4 pr-8 py-2.5 text-white text-sm focus:border-red-500 outline-none" 
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">₺</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Dekont / Ekran Görüntüsü</label>
                            {dekontUrl ? (
                                <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/50 aspect-video flex items-center justify-center group">
                                    <img src={dekontUrl} alt="Dekont Önizleme" className="max-w-full max-h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button type="button" onClick={() => setDekontUrl(null)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase tracking-widest">
                                            Kaldır
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-black/20 hover:bg-black/40 hover:border-red-500/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Camera className="w-8 h-8 mb-2 text-neutral-500" />
                                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Görsel Seç veya Çek</p>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isUploading || !dekontUrl}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isUploading ? "Gönderiliyor..." : "Dekontu Yönetime Gönder"}
                        </button>
                    </form>
                </div>

                {/* GEÇMİŞ BİLDİRİMLER */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col h-full max-h-[500px]">
                    <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} /> Bildirim Geçmişim
                    </h2>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {loading ? (
                            <div className="text-center py-10"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto" /></div>
                        ) : pastApprovals.length === 0 ? (
                            <div className="text-center py-10 border border-white/5 border-dashed rounded-xl">
                                <Clock size={24} className="mx-auto text-neutral-600 mb-2" />
                                <p className="text-xs text-neutral-500">Henüz bir dekont bildirimi yapmadınız.</p>
                            </div>
                        ) : (
                            pastApprovals.map((a: any) => (
                                <div key={a.id} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <p className="text-white font-bold text-sm">{a.changes?.yil} Yılı Aidatı</p>
                                            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{new Date(a.createdAt).toLocaleString("tr-TR")}</p>
                                        </div>
                                        <p className="text-white font-black text-sm">{a.changes?.tutar}</p>
                                    </div>
                                    <span className={`inline-block px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border mt-1 ${STATUS_STYLE[a.status]}`}>
                                        {STATUS_LABEL[a.status]}
                                    </span>
                                    {a.status === "approved" && a.resolvedBy && (
                                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[9px] text-emerald-500/70">
                                            <ShieldCheck size={12} /> <span className="uppercase tracking-widest">Onaylayan: {a.resolvedBy}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
