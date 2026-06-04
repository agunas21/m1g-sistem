"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, Clock, MapPin, Users, Box, RefreshCw, Radio, Heart, Compass, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

// Helper for calculating total team working hours in decimal format
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

// Helper for formatting duration to HH:MM:SS
const formatDuration = (startTimeStr: string, endTimeStr: string | null = null) => {
    if (!startTimeStr) return "00:00:00";
    
    let parsedTime = Date.parse(startTimeStr);
    if (isNaN(parsedTime)) {
        parsedTime = Date.parse(startTimeStr.replace(' ', 'T'));
    }
    if (isNaN(parsedTime)) return "00:00:00";

    const end = endTimeStr ? Date.parse(endTimeStr.replace(' ', 'T')) : Date.now();
    const diffMs = Math.max(0, end - parsedTime);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// Helper for active team's current deployment real-time duration
const getTeamCurrentDeploymentDuration = (team: any) => {
    if (team.status !== "Sahada" || !team.deployments || team.deployments.length === 0) return "00:00:00";
    const lastDep = team.deployments[team.deployments.length - 1];
    if (lastDep.returnTime) return "00:00:00";
    return formatDuration(lastDep.deployTime);
};

export default function ArkaCephePano() {
    const [operations, setOperations] = useState<any[]>([]);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    // Audio synthesizer for alert
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
            
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            
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
            console.error("Audio error", e);
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
            console.error("Audio stop error", e);
        }
    };

    const fetchData = async () => {
        try {
            const [opsRes, memRes, invRes] = await Promise.all([
                fetch("/api/settings/operations/active?t=" + Date.now()),
                fetch("/api/members?t=" + Date.now()),
                fetch("/api/inventory?t=" + Date.now())
            ]);
            const ops = await opsRes.json();
            const mem = await memRes.json();
            const inv = await invRes.json();

            const operationsList = (Array.isArray(ops) ? ops : []).map((op: any) => ({
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
            console.error("Arka Cephe Pano data error", e);
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

    const activeOps = operations.filter(o => o.status === "Aktif");
    const isGlobalEvac = activeOps.some(o => o.isEvacuationActive);

    // Alert siren toggle
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
                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Arka Cephe İzleme Panosu Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen text-white p-6 md:p-10 space-y-8 select-none transition-colors duration-500 ${
            isGlobalEvac ? 'bg-red-950/70 animate-pulse' : 'bg-[#020617]'
        }`}>
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
                        <Radio size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">M1G Arka Cephe Canlı İzleme Panosu</h1>
                        <p className="text-neutral-500 text-xs mt-0.5">Saha dışı destekçiler için salt okunur komuta özet ekranı (5sn otomatik yenilenir).</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Aktif Operasyon</span>
                        <span className="text-2xl font-black text-red-500 font-mono">{activeOps.length}</span>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400">
                        <RefreshCw size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                </div>
            </div>

            {/* EVAC STATE BANNER */}
            {isGlobalEvac && (
                <div className="bg-red-600 text-white px-6 py-4 rounded-3xl flex items-center justify-center gap-4 border border-red-400/30 animate-pulse text-sm font-black tracking-widest uppercase shadow-[0_0_45px_rgba(239,68,68,0.6)]">
                    <ShieldAlert size={22} className="animate-bounce" />
                    <span>🚨 SAHA TAHLİYE SİRENİ AKTİF! TÜM SAHA BOŞALTILIYOR 🚨</span>
                </div>
            )}

            {/* ACTIVE OPERATIONS GRID */}
            {activeOps.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {activeOps.map(op => {
                        const globalDuration = formatDuration(op.startTime, op.endTime);
                        const baseMembers = op.baseCamp?.members || [];
                        const baseEq = op.baseCamp?.equipment || [];
                        const teams = op.teams || [];

                        return (
                            <motion.div 
                                key={op.id} 
                                initial={{ opacity: 0, scale: 0.98 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6"
                            >
                                {/* Header Info */}
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
                                        <span className="text-[10px] text-neutral-500 font-mono block mt-1">Saha Konumu: {op.location || "Saha Koordinasyonu"}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">Geçen Toplam Süre</span>
                                        <span className="text-lg font-black font-mono text-red-500 tracking-wider block mt-1">{globalDuration}</span>
                                    </div>
                                </div>

                                {/* Weather Condition details for Eğitim/Kamp */}
                                {(op.type === "Eğitim" || op.type === "Kamp") && (
                                    <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between text-xs font-sans">
                                        <span className="text-neutral-300">Lokasyon: <span className="text-white font-bold">{op.location}</span></span>
                                        <span className="text-blue-400 font-mono font-bold">🌡️ Sıcaklık: {op.temperature || "Yükleniyor..."}</span>
                                    </div>
                                )}

                                {/* Roster of Deployed Active Teams (Real-time tracking stopwatch ticking) */}
                                <div className="space-y-3">
                                    <span className="text-[9px] text-red-400 font-extrabold uppercase tracking-widest block bg-red-500/5 px-2.5 py-1 rounded border border-red-500/10">Saha İntikalindeki Timler ({teams.filter((t: any) => t.status === "Sahada").length})</span>
                                    <div className="space-y-3">
                                        {teams.map((team: any) => {
                                            const isSahada = team.status === "Sahada";
                                            const totalWorkingHrs = calculateTeamWorkingHours(team.deployments || []);
                                            
                                            // Real-time ticking for currently active deployment
                                            const currentFieldDuration = getTeamCurrentDeploymentDuration(team);
                                            const leader = team.members.find((m: any) => m.role === "Lider");
                                            const membersCount = team.members.filter((m: any) => m.role !== "Lider").length;

                                            const lastDep = team.deployments?.[team.deployments.length - 1];
                                            const targetLoc = lastDep?.targetLocation || "Genel Saha";

                                            return (
                                                <div 
                                                    key={team.id}
                                                    className={`p-4 rounded-2xl border transition-all ${
                                                        isSahada 
                                                        ? 'bg-red-500/5 border-red-500/20' 
                                                        : 'bg-white/5 border-white/5 opacity-50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                        <div>
                                                            <span className="text-xs font-bold text-white block">{team.name}</span>
                                                            <span className="text-[9px] text-neutral-400 block mt-0.5">Hedef Bölge: <span className="text-red-400 font-bold font-mono">{targetLoc}</span></span>
                                                        </div>
                                                        <div className="text-right">
                                                            {isSahada ? (
                                                                <>
                                                                    <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block">Sahadaki Anlık Süre</span>
                                                                    <span className="text-xs font-black font-mono text-red-400 tracking-wider animate-pulse">{currentFieldDuration}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest block">Kamptaki Anlık Süre</span>
                                                                    <span className="text-xs font-black font-mono text-blue-400 tracking-wider">
                                                                        {formatDuration((lastDep && lastDep.returnTime) ? lastDep.returnTime : op.startTime)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-2 text-[10px] text-neutral-400">
                                                        <div>
                                                            <span className="text-[8px] text-neutral-500 uppercase font-black tracking-wider block">Tim Lideri</span>
                                                            <span className="text-white font-bold">{leader ? (membersData.find(m => m.id === leader.id)?.fullName || leader.id) : "Belirlenmedi"}</span>
                                                            <span className="block mt-0.5">Üyeler: {membersCount} Personel</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] text-neutral-500 uppercase font-black tracking-wider block">Zimmetli Ekipman</span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {team.equipment?.map((eqId: string) => (
                                                                    <span key={eqId} className="bg-white/5 border border-white/10 px-1 py-0.5 rounded text-[8px] font-mono text-neutral-300">
                                                                        {inventoryData.find(i => i.id === eqId)?.name || eqId}
                                                                    </span>
                                                                ))}
                                                                {(!team.equipment || team.equipment.length === 0) && <span className="italic text-neutral-600">Yok</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {teams.length === 0 && (
                                            <p className="text-[10px] text-neutral-500 italic py-2 text-center border border-dashed border-white/5 rounded-2xl">Operasyonda kayıtlı tim bulunmuyor.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Base Camp pools (Dinlenenler / Boştaki Malzemeler) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#020617] border border-white/5 p-4 rounded-2xl space-y-2">
                                        <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest block">Base Kampta Dinlenenler ({baseMembers.length})</span>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {baseMembers.map((mId: string) => {
                                                const m = membersData.find(mem => mem.id === mId);
                                                return (
                                                    <div key={mId} className="text-[10px] bg-white/5 border border-white/5 p-1.5 rounded text-neutral-300">
                                                        👤 {m?.fullName || mId}
                                                    </div>
                                                );
                                            })}
                                            {baseMembers.length === 0 && <span className="text-[9px] text-neutral-600 italic block">Yok</span>}
                                        </div>
                                    </div>

                                    <div className="bg-[#020617] border border-white/5 p-4 rounded-2xl space-y-2">
                                        <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block">Boştaki Envanterler ({baseEq.length})</span>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {baseEq.map((eqId: string) => {
                                                const item = inventoryData.find(i => i.id === eqId);
                                                return (
                                                    <div key={eqId} className="text-[9px] bg-white/5 border border-white/5 p-1.5 rounded text-neutral-300 font-mono">
                                                        📦 {item?.name || eqId}
                                                    </div>
                                                );
                                            })}
                                            {baseEq.length === 0 && <span className="text-[9px] text-neutral-600 italic block">Yok</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Supplies Slip & Frequency */}
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center gap-4 text-xs font-mono">
                                    <div>
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Telsiz Frekansı</span>
                                        <span className="text-white font-bold">{op.radioFrequency || "Belirlenmedi"} MHz</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Kritik Lojistik Sevk</span>
                                        <span className="text-neutral-300">Çadır: {op.supplies?.tentCount || 0} • Su: {op.supplies?.waterLiters || 0}L • Kumanya: {op.supplies?.mealsCount || 0}Ö</span>
                                    </div>
                                </div>

                                {/* Last log entry message */}
                                {op.logs && op.logs.length > 0 && (
                                    <div className="pt-4 border-t border-white/5 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block">Son Telsiz Raporu</span>
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
                    <h2 className="text-xl font-bold">Aktif Sevk Bulunmuyor</h2>
                    <p className="text-neutral-500 text-sm mt-1">Şu an komuta edilen veya takipte olan aktif faaliyet bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
}
