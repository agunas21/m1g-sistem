"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
    Activity, MapPin, Clock, Radio, Users, ShieldAlert, ArrowLeft,
    Heart, ShieldCheck, AlertTriangle, MessageSquare, Compass, Play
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const OfflineMap = dynamic(() => import("@/components/map/OfflineMap"), { 
    ssr: false,
    loading: () => <div className="w-full h-48 bg-[#050B14] rounded-3xl animate-pulse flex items-center justify-center border border-white/5"><Compass className="animate-spin text-neutral-500" size={32} /></div>
});

export default function OperasyonDetayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [operation, setOperation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOp = async () => {
            try {
                const res = await fetch("/api/settings/operations/active");
                if (res.ok) {
                    const data = await res.json();
                    const activeOps = Array.isArray(data) ? data : [];
                    const found = activeOps.find(o => o.id === id);
                    if (found) {
                        setOperation(found);
                    } else {
                        // Not found or not active
                        router.push("/portal/operasyonlar");
                    }
                }
            } catch (error) {
                console.error("Operasyon detayı alınamadı", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOp();
        const interval = setInterval(fetchOp, 15000); // 15 saniyede bir daha sık güncelle
        return () => clearInterval(interval);
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!operation) return null;

    return (
        <div className="space-y-6 pb-20 max-w-5xl mx-auto">
            
            {/* Header & Back */}
            <div className="flex items-center gap-4 mb-8">
                <Link 
                    href="/portal/operasyonlar"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center gap-2 bg-red-500/20 px-2.5 py-1 rounded-md border border-red-500/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">CANLI İZLEME</span>
                        </div>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                            {operation.type}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                        {operation.name}
                    </h1>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#050B14] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <MapPin className="text-neutral-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Konum</span>
                    <span className="text-sm font-bold text-white truncate w-full">{operation.location || "-"}</span>
                </div>
                <div className="bg-[#050B14] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <Clock className="text-neutral-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Başlangıç</span>
                    <span className="text-sm font-bold text-white">{operation.startTime?.split(" ")[1] || "-"}</span>
                </div>
                <div className="bg-[#050B14] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <Radio className="text-neutral-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Telsiz Frekansı</span>
                    <span className="text-sm font-bold text-white font-mono">{operation.radioFrequency || "-"}</span>
                </div>
                <div className="bg-[#050B14] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <Users className="text-neutral-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Saha Timi</span>
                    <span className="text-sm font-bold text-white">{operation.teams?.length || 0} Tim</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* HARİTA BÖLÜMÜ (YENİ EKLENDİ) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="text-red-500" size={20} />
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Saha Haritası</h2>
                    </div>
                    <div className="bg-[#050B14] border border-white/5 rounded-3xl p-2 relative shadow-2xl h-64 md:h-96 w-full overflow-hidden">
                        <OfflineMap 
                            teams={operation.teams?.map((t: any) => ({
                                id: t.id,
                                name: t.name,
                                status: t.status,
                                location: t.location ? [t.location.lat, t.location.lng] : undefined
                            })) || []} 
                            pins={operation.pins || []}
                            onMapClick={async (lat, lng) => {
                                // Only allow clicking if user is admin or a team leader
                                const isLeader = operation.teams?.some((t: any) => t.personnel?.some((p: any) => (p.email === user?.email || p.id === user?.uid) && p.role === 'Lider'));
                                if (isAdmin || isLeader) {
                                    if(confirm("Tıkladığınız noktayı 'kendi konumunuz' olarak sisteme kaydetmek istiyor musunuz? (Manuel Konum Güncellemesi)")) {
                                        try {
                                            await fetch('/api/settings/operations/active/location', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    memberId: user?.uid || user?.email,
                                                    lat: lat,
                                                    lng: lng
                                                })
                                            });
                                            alert("Konumunuz başarıyla manuel olarak güncellendi.");
                                        } catch (e) {
                                            alert("Konum güncellenemedi.");
                                        }
                                    }
                                } else {
                                    // If not leader, just show coordinates
                                    alert(`Tıkladığınız Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Sol Taraf: Canlı Log Akışı */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Canlı Log Akışı</h2>
                        <div className="ml-auto flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Senkronize</span>
                        </div>
                    </div>
                    
                    <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5 h-[500px] overflow-y-auto custom-scrollbar flex flex-col-reverse gap-4">
                        {operation.logs?.length > 0 ? (
                            operation.logs.map((log: any, i: number) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-black/50 p-4 rounded-xl border border-white/5 relative pl-12"
                                >
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#050B14] bg-blue-500 ring-2 ring-white/5" />
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded">{log.time}</span>
                                    </div>
                                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                                        {log.message}
                                    </p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center text-neutral-600 py-10 my-auto">
                                <Activity size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Henüz log girilmedi</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sağ Taraf: Sahadaki Timler */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Compass className="text-amber-500" size={20} />
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">Saha Timleri</h2>
                    </div>

                    <div className="space-y-4">
                        {operation.teams?.map((team: any) => {
                            const lastDeployment = team.deployments?.[team.deployments.length - 1];
                            const isDeployed = team.status === "Sahada";
                            const pulseColor = lastDeployment?.pulse === "Yeşil" ? "text-emerald-500" : 
                                               lastDeployment?.pulse === "Sarı" ? "text-amber-500" : 
                                               lastDeployment?.pulse === "Kırmızı" ? "text-red-500" : "text-neutral-500";

                            return (
                                <div key={team.id} className="bg-[#050B14] border border-white/5 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                                        <h3 className="font-black text-white uppercase text-sm">{team.name}</h3>
                                        {isDeployed ? (
                                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1.5">
                                                <Play size={10} /> İNTİKALDE
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black bg-white/5 text-neutral-400 border border-white/10 px-2 py-1 rounded">
                                                KAMPTA
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        {team.members?.map((m: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
                                                <span className="text-xs text-neutral-300 truncate pr-2">{m.id.substring(0, 15)}...</span>
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${m.role === 'Lider' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-neutral-500'}`}>
                                                    {m.role}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {isDeployed && (
                                        <div className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Heart className={pulseColor} size={14} />
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase">Nabız:</span>
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-widest ${pulseColor}`}>
                                                {lastDeployment?.pulse || "BİLİNMİYOR"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(!operation.teams || operation.teams.length === 0) && (
                            <div className="text-center p-6 bg-[#050B14] border border-white/5 rounded-2xl">
                                <Users size={24} className="mx-auto text-neutral-600 mb-2 opacity-50" />
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Sahada Tim Yok</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
