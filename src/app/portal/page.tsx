"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import ReactPlayer from "react-player";
import { Loader2, PlayCircle, BookOpen, User, Signal, Video, ShieldCheck, Mail, Radio } from "lucide-react";

type VideoData = {
    id: string;
    title: string;
    description: string;
    url: string;
};

type LiveSessionData = {
    title: string;
    url: string;
    isActive: boolean;
};

export default function PortalDashboard() {
    const { user, isAdmin, isTestMode } = useAuth();
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [liveSession, setLiveSession] = useState<LiveSessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isTestMode) {
            const mockVideos = [
                { id: "v1", title: "İlkyardım Temel Eğitimi - Modül 1", description: "Olay Yeri Güvenliği, Hasta değerlendirme ve temel Triage süreçleri.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                { id: "v2", title: "Dağcılık: İp ve Düğüm Teknikleri", description: "Sekizli düğümü, pursik ve emniyet alma pratikleri.", url: "https://vimeo.com/76979871" }
            ];
            setVideos(mockVideos);
            setActiveVideo(mockVideos[0]);

            // Also fetch from API in test mode so CMS changes reflect immediately
            fetch("/api/settings/public").then(res => res.json()).then(data => {
                if(data.liveSession) setLiveSession(data.liveSession);
            });

            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch videos
                const snapshot = await getDocs(collection(db, "videos"));
                const vids: VideoData[] = [];
                snapshot.forEach(doc => vids.push({ id: doc.id, ...doc.data() } as VideoData));
                setVideos(vids);
                if (vids.length > 0) setActiveVideo(vids[0]);

                // Fetch Global Live Session from Local API
                const settingsRes = await fetch("/api/settings/public");
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    if (settingsData.liveSession) {
                        setLiveSession(settingsData.liveSession);
                    }
                }
            } catch (error) {
                console.error("Error fetching portal data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isTestMode]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col pb-20">
            {/* HAREKAT MERKEZİ HEADER */}
            <div className="mb-2">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter flex items-center gap-3">
                    <ShieldCheck className="text-red-500 w-8 h-8 md:w-12 md:h-12" />
                    M1G Akademi
                </h1>
                <p className="text-neutral-400 text-sm md:text-lg font-light">Eğitimlerinizi takip edin ve canlı kriz masasına bağlanın.</p>
            </div>

            {/* TOP DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* PROFILE SUMMARY */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><User size={150} /></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,29,44,0.3)]">
                                <span className="text-2xl font-bold text-white uppercase">{user?.email?.charAt(0) || "U"}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{user?.displayName || user?.email?.split('@')[0]}</h2>
                                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-white/10 text-neutral-300'}`}>
                                    {isAdmin ? 'YÖNETİCİ PERSONEL' : 'GÖNÜLLÜ ÜYE'}
                                </span>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500 font-medium flex items-center gap-2"><Mail size={16} /> Sistem İletişim</span>
                                <span className="text-neutral-300 truncate max-w-[150px]" title={user?.email || "Yok"}>{user?.email}</span>
                            </li>
                            <li className="flex justify-between items-center text-sm">
                                <span className="text-neutral-500 font-medium flex items-center gap-2"><BookOpen size={16} /> Tamamlanan</span>
                                <span className="text-white font-bold">Kayıtlı Profil</span>
                            </li>
                        </ul>

                        {/* Dijital Kimlik Linki */}
                        {(user as any)?.kimlikToken && (
                            <div className="mt-5 pt-5 border-t border-white/10">
                                <a 
                                    href={`/kimlik/${(user as any).kimlikToken}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600 border border-red-500/25 hover:border-red-650 text-red-400 hover:text-white font-bold rounded-xl text-xs transition-all uppercase tracking-widest"
                                >
                                    <ShieldCheck size={14} /> Dijital Kimliğimi Gör
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* CANLI BRİFİNG ODASI (LIVE SESSION) */}
                <div className="col-span-1 lg:col-span-2 bg-[#020617] border border-red-500/10 rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent z-0"></div>
                    {liveSession?.isActive ? (
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                    <div className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                    </div>
                                    <span className="text-red-500 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">CANLI YAYIN AKTİF</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{liveSession.title}</h3>
                                <p className="text-neutral-500 text-xs md:text-sm">Acilen katılım sağlayınız.</p>
                            </div>
                            <div className="w-full md:w-auto">
                                <a
                                    href={liveSession.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full md:px-8 py-4 bg-red-600 hover:bg-neutral-100 hover:text-red-600 text-white font-black tracking-widest uppercase rounded-xl transition-all shadow-[0_0_30px_rgba(234,29,44,0.3)] flex items-center justify-center gap-3 text-sm"
                                >
                                    <Video size={18} className="animate-pulse" /> Katıl
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex flex-col items-center justify-center text-center py-8 h-full bg-black/40 border border-white/5 rounded-xl border-dashed">
                            <Radio size={32} className="text-neutral-800 mb-3" />
                            <h3 className="text-lg font-black text-neutral-600 uppercase tracking-widest mb-1">BRİFİNG: OFF-LINE</h3>
                            <p className="text-[10px] text-neutral-700 uppercase font-bold">Beklemede</p>
                        </div>
                    )}
                </div>
            </div>

            {/* EĞİTİM KÜTÜPHANESİ */}
            <div className="mt-8 mb-4">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3 border-b border-white/5 pb-4">
                    <BookOpen size={20} className="text-neutral-500" /> Video Kütüphanesi
                </h2>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                </div>
            ) : videos.length === 0 ? (
                <div className="flex items-center justify-center flex-col text-neutral-600 py-20 bg-black/20 rounded-2xl border border-white/5">
                    <PlayCircle className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Sisteme atanmış eğitim modülü bulunamadı.</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Main Video Player */}
                    <div className="lg:w-2/3 flex flex-col">
                        <div className="bg-black border border-white/10 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] aspect-video relative">
                            {isClient && activeVideo ? (
                                <iframe
                                    src={activeVideo.url.includes("youtube") || activeVideo.url.includes("youtu.be")
                                        ? `https://www.youtube.com/embed/${activeVideo.url.split("v=")[1]?.split("&")[0] || activeVideo.url.split("/").pop()}`
                                        : activeVideo.url}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                                    <Loader2 className="animate-spin text-red-600" />
                                </div>
                            )}
                        </div>
                        {activeVideo && (
                            <div className="mt-4 p-5 bg-[#050B14] border border-white/5 rounded-xl shadow-lg">
                                <span className="text-[10px] font-bold text-neutral-500 tracking-[0.2em] uppercase mb-1 block">Ders Modülü</span>
                                <h2 className="text-xl font-bold text-white mb-3 leading-tight">{activeVideo.title}</h2>
                                <p className="text-neutral-400 text-sm font-light leading-relaxed">{activeVideo.description || "Açıklama eklenmemiş."}</p>
                            </div>
                        )}
                    </div>

                    {/* Video Selection List */}
                    <div className="lg:w-1/3 flex flex-col max-h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {videos.map((vid) => {
                            const isActive = activeVideo?.id === vid.id;
                            return (
                                <div
                                    key={vid.id}
                                    onClick={() => setActiveVideo(vid)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${isActive
                                        ? "bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(234,29,44,0.1)]"
                                        : "bg-[#050B14] border-white/5 hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-0.5 rounded-full p-2 flex-shrink-0 ${isActive ? "bg-red-500 text-white" : "bg-neutral-800 text-neutral-400"}`}>
                                            <PlayCircle size={16} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-xs md:text-sm mb-1 leading-tight ${isActive ? "text-white" : "text-neutral-300"}`}>{vid.title}</h4>
                                            <p className="text-[10px] md:text-xs font-light text-neutral-500 line-clamp-1 md:line-clamp-2 leading-relaxed">{vid.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            )}
        </div>
    );
}
