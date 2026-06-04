"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Clock, MapPin, Users, Box, RefreshCw, Radio, AlertTriangle, ShieldCheck, Heart, Flame, Compass } from "lucide-react";
import { motion } from "framer-motion";

// Helper for team working hours calculation
const calculateTeamWorkingHours = (deployments: any[]) => {
    let totalMs = 0;
    deployments.forEach(d => {
        const start = Date.parse(d.deployTime.replace(' ', 'T'));
        if (!isNaN(start)) {
            const end = d.returnTime ? Date.parse(d.returnTime.replace(' ', 'T')) : Date.now();
            totalMs += Math.max(0, end - start);
        }
    });
    return (totalMs / (1000 * 60 * 60)).toFixed(1);
};

export default function OperasyonPano() {
    const [operations, setOperations] = useState<any[]>([]);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    // Audio synthesizer context refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    const startSirenNode = () => {
        if (typeof window === "undefined") return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                ctx.resume();
            }
            
            if (oscillatorRef.current) return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            
            let high = true;
            const interval = setInterval(() => {
                if (!oscillatorRef.current) {
                    clearInterval(interval);
                    return;
                }
                const now = ctx.currentTime;
                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(high ? 900 : 500, now);
                osc.frequency.linearRampToValueAtTime(high ? 500 : 900, now + 0.4);
                high = !high;
            }, 450);
            
            oscillatorRef.current = osc;
            gainRef.current = gain;
        } catch (e) {
            console.error("Pano Audio error", e);
        }
    };

    const stopSirenNode = () => {
        try {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
            if (gainRef.current) {
                gainRef.current.disconnect();
                gainRef.current = null;
            }
        } catch (e) {
            console.error("Pano Audio stop error", e);
        }
    };

    const fetchData = async () => {
        try {
            const [opsRes, memRes, invRes] = await Promise.all([
                fetch("/api/settings/operations/active?t=" + Date.now()),
                fetch("/api/members?t=" + Date.now()),
                fetch("/api/inventory?t=" + Date.now())
            ]);
            const opsData = await opsRes.json();
            const mem = await memRes.json();
            const inv = await invRes.json();

            const operationsList = (Array.isArray(opsData) ? opsData : []).map((op: any) => ({
                ...op,
                teams: op.teams || [],
                baseCamp: op.baseCamp || { members: [], equipment: [] },
                supplies: op.supplies || { 
                    tentCount: 0, 
                    waterLiters: 0, 
                    mealsCount: 0, 
                    blanketCount: 0, 
                    rakeCount: 0, 
                    pumpCount: 0, 
                    electrolyteLiters: 0,
                    flashlightCount: 0,
                    gpsCount: 0
                },
                logs: op.logs || [],
                radioFrequency: op.radioFrequency || '',
                temperature: op.temperature || ''
            }));
            setOperations(operationsList);
            setMembersData(Array.isArray(mem) ? mem : []);
            setInventoryData(Array.isArray(inv) ? inv : []);
        } catch (e) {
            console.error("Pano data fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const refreshInterval = setInterval(fetchData, 5000);
        const tickInterval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(tickInterval);
            stopSirenNode();
        };
    }, []);

    // Check if any active operation has evacuation active
    const activeOps = operations.filter(o => o.status === "Aktif");
    const isGlobalEvac = activeOps.some(o => o.isEvacuationActive);

    // Audio trigger control
    useEffect(() => {
        if (isGlobalEvac) {
            startSirenNode();
        } else {
            stopSirenNode();
        }
    }, [isGlobalEvac]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6">
                <Activity size={48} className="text-red-500 animate-pulse mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Canlı Takip Panosu Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen text-white p-6 md:p-10 space-y-8 select-none transition-colors duration-500 ${
            isGlobalEvac ? 'bg-red-950 animate-pulse' : 'bg-[#020617]'
        }`}>
            
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Radio size={24} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">M1G Canlı Sevk & Komuta Ekranı</h1>
                        <p className="text-neutral-500 text-xs mt-0.5">Operasyon merkezi canlı takip panosu (5sn otomatik güncelleme).</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block font-sans">Aktif Görev Sayısı</span>
                        <span className="text-2xl font-black text-red-500 font-mono">{activeOps.length}</span>
                    </div>
                    <button 
                        onClick={fetchData}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors"
                        title="Manuel Yenile"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* EVACUATION EMERGENCY FLASH STATE BANNER */}
            {isGlobalEvac && (
                <div className="bg-red-600 text-white px-6 py-4 rounded-3xl flex items-center justify-center gap-4 border border-red-400/30 animate-bounce text-sm font-black tracking-widest uppercase shadow-[0_0_40px_rgba(239,68,68,0.6)]">
                    <AlertTriangle size={24} className="animate-ping" />
                    <span>🚨 SAHA TAHLİYE SİRENİ AKTİF! DERHAL GÜVENLİ BÖLGEYE ÇEKİLİN 🚨</span>
                </div>
            )}

            {/* MAIN CONTENT */}
            {activeOps.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {activeOps.map(op => {
                        const allBaseMembers = op.baseCamp?.members || [];
                        const allBaseEq = op.baseCamp?.equipment || [];
                        const allTeams = op.teams || [];
                        
                        return (
                            <motion.div 
                                key={op.id} 
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between space-y-6"
                            >
                                <div className="space-y-5">
                                    
                                    {/* Operation title, type, location & temperature */}
                                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                        <div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase ${
                                                op.type === 'Deprem' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                                op.type === 'Yangın' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                                'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {op.type}
                                            </span>
                                            <h2 className="text-xl font-bold text-white mt-2 leading-snug">{op.name}</h2>
                                            <span className="text-[10px] text-neutral-500 font-mono block mt-1">Başlangıç: {op.startTime}</span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">Telsiz Frekansı</span>
                                            <span className="text-sm font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10 block mt-1">{op.radioFrequency || "Yok"} MHz</span>
                                        </div>
                                    </div>

                                    {/* Weather conditions & Location info */}
                                    {(op.type === "Eğitim" || op.type === "Kamp") && (
                                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-blue-400" />
                                                <span className="text-neutral-300 font-bold">Kamp Konumu: {op.location}</span>
                                            </div>
                                            <div className="font-mono bg-blue-500/10 border border-blue-500/10 text-blue-400 px-2.5 py-1 rounded font-bold">
                                                🌡️ {op.temperature || "Çevrimdışı / Veri Yok"}
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Deployed Teams List */}
                                    <div className="space-y-3">
                                        <span className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest block bg-red-500/5 px-2.5 py-1 rounded border border-red-500/10">Sahada Çalışan Kurtarma Timleri ({allTeams.filter((t: any) => t.status === "Sahada").length})</span>
                                        <div className="grid grid-cols-1 gap-3">
                                            {allTeams.map((team: any) => {
                                                const isSahada = team.status === "Sahada";
                                                const hours = calculateTeamWorkingHours(team.deployments || []);
                                                
                                                const leader = team.members.find((m: any) => m.role === "Lider");
                                                const membersCount = team.members.filter((m: any) => m.role !== "Lider").length;

                                                const lastDep = team.deployments?.[team.deployments.length - 1];
                                                const lastPulse = lastDep?.pulse || null;

                                                return (
                                                    <div 
                                                        key={team.id}
                                                        className={`p-4 rounded-2xl border transition-all ${
                                                            isSahada 
                                                            ? 'bg-red-500/5 border-red-500/20' 
                                                            : 'bg-white/5 border-white/5 opacity-60'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                            <div>
                                                                <span className="text-xs font-bold text-white block">{team.name} ({team.status})</span>
                                                                <span className="text-[9px] text-neutral-500 font-mono">Çalışma Süresi: {hours} saat</span>
                                                            </div>
                                                            {lastPulse && (
                                                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${
                                                                    lastPulse === 'Yeşil' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    lastPulse === 'Sarı' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                    'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                                                }`}>
                                                                    Debrief: {lastPulse}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mt-2.5 text-[10px] text-neutral-400">
                                                            <div>
                                                                <span className="font-bold text-neutral-500 uppercase block tracking-wider text-[8px]">Personel Hiyerarşisi</span>
                                                                <span>👑 Lider: {leader ? (membersData.find(m => m.id === leader.id)?.fullName || leader.id) : "Yok"}</span>
                                                                <span className="block mt-0.5">👥 Üyeler: {membersCount} kişi</span>
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-neutral-500 uppercase block tracking-wider text-[8px]">Ekipman Zimmeti</span>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {team.equipment?.map((eqId: string) => (
                                                                        <span key={eqId} className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-[8px] font-mono text-neutral-300">
                                                                            {inventoryData.find(i => i.id === eqId)?.name || eqId}
                                                                        </span>
                                                                    ))}
                                                                    {(!team.equipment || team.equipment.length === 0) && <span className="italic text-neutral-600">Ekipman yok</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {allTeams.length === 0 && (
                                                <p className="text-[10px] text-neutral-600 italic py-2">Kayıtlı tim bulunmuyor.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Base Camp Pool Columns */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#020617] border border-white/5 p-3 rounded-2xl space-y-2">
                                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest block">Üs Çadırında Dinlenenler ({allBaseMembers.length})</span>
                                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                {allBaseMembers.map((mId: string) => {
                                                    const m = membersData.find(mem => mem.id === mId);
                                                    return (
                                                        <div key={mId} className="text-[10px] bg-white/5 border border-white/5 p-1.5 rounded text-neutral-300">
                                                            {m?.fullName || mId}
                                                        </div>
                                                    );
                                                })}
                                                {allBaseMembers.length === 0 && (
                                                    <span className="text-[9px] text-neutral-600 italic block">Boşta personel yok</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-[#020617] border border-white/5 p-3 rounded-2xl space-y-2">
                                            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest block">Boşta/Hazır Malzemeler ({allBaseEq.length})</span>
                                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                                {allBaseEq.map((eqId: string) => {
                                                    const item = inventoryData.find(i => i.id === eqId);
                                                    return (
                                                        <div key={eqId} className="text-[9px] bg-white/5 border border-white/5 p-1.5 rounded text-neutral-300 font-mono">
                                                            {item?.name || eqId}
                                                        </div>
                                                    );
                                                })}
                                                {allBaseEq.length === 0 && (
                                                    <span className="text-[9px] text-neutral-600 italic block">Boşta malzeme yok</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Lojistik Supplies Slip */}
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-2">
                                        <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-widest block flex items-center gap-1"><Box size={10}/> Lojistik Sarfiyat İkmal Deposu</span>
                                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                                            <div className="bg-white/5 p-2 rounded-xl">
                                                <span className="text-neutral-500 block">Çadır</span>
                                                <span className="text-xs font-bold text-white">{op.supplies?.tentCount || 0}</span>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-xl">
                                                <span className="text-neutral-500 block">Su (L)</span>
                                                <span className="text-xs font-bold text-white">{op.supplies?.waterLiters || 0}</span>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-xl">
                                                <span className="text-neutral-500 block">Kumanya</span>
                                                <span className="text-xs font-bold text-white">{op.supplies?.mealsCount || 0}</span>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-xl">
                                                <span className="text-neutral-500 block">Ayran (L)</span>
                                                <span className="text-xs font-bold text-white">{op.supplies?.electrolyteLiters || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Last log entry message */}
                                {op.logs && op.logs.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-white/5 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block">Telsiz Logbook Son Durum</span>
                                        <p className="text-xs text-neutral-300 italic mt-1 leading-snug">
                                            <span className="text-neutral-500 font-mono font-bold mr-1.5">{op.logs[op.logs.length - 1].time}:</span>
                                            {op.logs[op.logs.length - 1].message}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center bg-[#050B14] border border-white/5 rounded-3xl p-6">
                    <Activity size={64} className="text-neutral-700 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold">Aktif Faaliyet Bulunmuyor</h2>
                    <p className="text-neutral-500 text-sm mt-1">Şu an aktif olarak komuta edilen saha veya eğitim faaliyeti bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
}
