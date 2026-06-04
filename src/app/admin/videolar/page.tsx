"use client";

import { useState } from "react";
import { Video, Plus, Trash2, Link as LinkIcon, RefreshCcw, ShieldCheck } from "lucide-react";
import { collection, addDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type VideoData = {
    id: string;
    title: string;
    description: string;
    url: string;
};

export default function VideoYonetimi() {
    const [videos, setVideos] = useState<VideoData[]>([
        { id: "mock1", title: "İlkyardım Temel Eğitimi - Modül 1", description: "Olay Yeri Güvenliği, Hasta değerlendirme ve temel Triage süreçleri.", url: "https://youtube.com/watch?v=mock1" },
        { id: "mock2", title: "Dağcılık: İp ve Düğüm Teknikleri", description: "Sekizli düğümü, pursik ve emniyet alma pratikleri.", url: "https://vimeo.com/mock2" }
    ]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newUrl) return;

        setLoading(true);
        try {
            // Firebase Gerçek Entegrasyonu (Simüle ediliyor ama kod gerçektir)
            // const docRef = await addDoc(collection(db, "videos"), {
            //     title: newTitle,
            //     description: newDesc,
            //     url: newUrl,
            //     createdAt: new Date()
            // });

            setVideos([...videos, {
                id: Math.random().toString(), // docRef.id
                title: newTitle,
                description: newDesc,
                url: newUrl
            }]);

            setNewTitle("");
            setNewDesc("");
            setNewUrl("");
            // alert("Eğitim videosu başarıyla sisteme eklendi. Üyeler portalda görebilir.");
        } catch (error) {
            console.error("Video eklenemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Video eğitim portalından kalıcı olarak silinecektir. Onaylıyor musunuz?")) return;

        try {
            // await deleteDoc(doc(db, "videos", id));
            setVideos(videos.filter(v => v.id !== id));
        } catch (error) {
            console.error("Silme hatası:", error);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* BAŞLIK */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <Video className="text-red-500" size={28} /> Video Yönetimi
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic truncate pr-4">Akademi eğitim içeriklerini yönetin.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SOL: YENİ VİDEO EKLEME FORMU */}
                <div className="lg:col-span-1 border border-white/5 bg-[#050B14] rounded-3xl p-5 md:p-6 shadow-2xl h-max relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Plus size={100} /></div>
                    <div className="relative z-10">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-2 border-b border-white/5 pb-4">
                            <Plus className="text-blue-500" size={18} /> Yeni Eğitim Ekle
                        </h2>

                        <form onSubmit={handleAddVideo} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Video Başlığı (Örn: Çığ Kurtarma V2)</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <LinkIcon size={12} /> Video Linki (YouTube / Vimeo)
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Açıklama (Ne anlatılıyor?)</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-red-600 hover:bg-neutral-800 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(234,29,44,0.3)] disabled:opacity-50 mt-4"
                            >
                                {loading ? 'SİSTEME KAYDEDİLİYOR...' : 'VİDEOYU ÜYELERE YAYINLA'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* SAĞ: MEVCUT VİDEOLAR (KONTROL PANELİ) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 px-1">
                        <h2 className="text-lg md:text-xl font-bold text-white uppercase flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={20} /> Aktif Eğitimler
                        </h2>
                        <span className="text-[10px] font-black text-neutral-500 uppercase flex items-center gap-1.5 border border-white/5 px-3 py-1.5 rounded-full bg-white/5">
                            <RefreshCcw size={10} className="animate-spin-slow" /> Senkron
                        </span>
                    </div>

                    {videos.map(video => (
                        <div key={video.id} className="bg-[#020617] border border-white/5 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 md:gap-6 group hover:border-red-500/30 transition-all shadow-lg">
                            <div className="bg-[#050B14] p-3 md:p-4 rounded-xl border border-white/5 flex-shrink-0">
                                <Video className="text-red-600 w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <h3 className="text-white font-bold text-base md:text-lg leading-tight mb-1 truncate">{video.title}</h3>
                                <p className="text-neutral-500 text-xs md:text-sm line-clamp-1">{video.description}</p>
                                <div className="text-[9px] md:text-[10px] bg-white/5 px-2 py-1 flex items-center w-max gap-1 rounded mt-2 mx-auto sm:mx-0 text-neutral-500 font-mono">
                                    <LinkIcon size={10} /> {video.url.substring(0, 25)}...
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(video.id)}
                                className="w-full sm:w-auto p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/10 flex items-center justify-center"
                                title="Videoyu Kaldır"
                            >
                                <Trash2 size={18} />
                                <span className="sm:hidden ml-2 text-xs font-bold uppercase tracking-widest">Videoyu Sil</span>
                            </button>
                        </div>
                    ))}

                    {videos.length === 0 && (
                        <div className="text-center py-20 bg-[#050B14] border border-white/5 rounded-2xl">
                            <Video className="mx-auto block text-neutral-600 mb-4 opacity-50" size={48} />
                            <p className="text-neutral-500 font-bold uppercase tracking-widest">Sistemde Hiç Video Yok</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
