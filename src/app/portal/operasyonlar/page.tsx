"use client";

import { useState, useEffect } from "react";
import { Activity, MapPin, Clock, Radio, Users, ShieldAlert, Navigation } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OperasyonlarPage() {
    const [operations, setOperations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOps = async () => {
            try {
                const res = await fetch("/api/settings/operations/active");
                if (res.ok) {
                    const data = await res.json();
                    // Sadece aktif operasyonları göster
                    const activeOps = (Array.isArray(data) ? data : []).filter(op => op.status === "Aktif");
                    setOperations(activeOps);
                }
            } catch (error) {
                console.error("Operasyonlar alınamadı", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOps();
        const interval = setInterval(fetchOps, 30000); // 30 saniyede bir güncelle
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <Activity className="text-red-500" size={28} /> Canlı Operasyonlar
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">
                    Devam eden operasyonları ve durum güncellemelerini anlık olarak takip edin.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full" />
                </div>
            ) : operations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#050B14] border border-white/5 rounded-2xl">
                    <ShieldAlert size={48} className="text-neutral-600 mb-4 opacity-50" />
                    <h3 className="text-white font-bold uppercase tracking-widest text-lg mb-2">Aktif Operasyon Yok</h3>
                    <p className="text-neutral-500 text-sm text-center max-w-md">
                        Şu anda devam eden herhangi bir operasyon veya intikal bulunmamaktadır.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {operations.map((op, idx) => (
                        <motion.div 
                            key={op.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link href={`/portal/operasyonlar/${op.id}`}>
                                <div className="bg-[#050B14] border border-red-500/20 hover:border-red-500/50 rounded-2xl p-5 hover:bg-[#0a1220] transition-all cursor-pointer shadow-[0_0_30px_rgba(234,29,44,0.05)] hover:shadow-[0_0_30px_rgba(234,29,44,0.15)] group flex flex-col h-full">
                                    
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-red-500/10 text-red-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                            <Activity size={24} />
                                        </div>
                                        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">AKTİF</span>
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-2 leading-tight uppercase line-clamp-2">
                                        {op.name}
                                    </h2>
                                    
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-2 py-1 rounded uppercase tracking-wider border border-white/5">
                                            {op.type}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mt-auto">
                                        <div className="flex items-center gap-3 text-neutral-400 text-sm">
                                            <MapPin size={16} className="text-neutral-500 flex-shrink-0" />
                                            <span className="truncate">{op.location || "Konum Belirtilmedi"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-neutral-400 text-sm">
                                            <Clock size={16} className="text-neutral-500 flex-shrink-0" />
                                            <span>{op.startTime}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-neutral-400 text-sm">
                                            <Radio size={16} className="text-neutral-500 flex-shrink-0" />
                                            <span>{op.radioFrequency || "Frekans Bilinmiyor"}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                            <Users size={14} />
                                            {op.teams?.length || 0} TİM SAHADA
                                        </div>
                                        <div className="text-red-500 flex items-center gap-1 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                            İzle <Navigation size={12} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
