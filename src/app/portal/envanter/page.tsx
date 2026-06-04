"use client";

import React from "react";
import { Box, Wrench, ShieldAlert, UserCircle, Car, PackageOpen, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const conditionColor: Record<string, string> = {
    "Yeni":      "bg-emerald-500/10 text-emerald-400",
    "İyi":       "bg-emerald-500/10 text-emerald-400",
    "Yıpranmış": "bg-amber-500/10 text-amber-400",
    "Arızalı":   "bg-red-500/10 text-red-400",
};

const statusIcon: Record<string, React.ReactNode> = {
    "Zimmetli": <CheckCircle2 size={14} className="text-blue-400" />,
    "Bakımda":  <Wrench size={14} className="text-amber-400" />,
};

export default function MalzemeArsivi() {
    const { user } = useAuth();

    const [inventoryData, setInventoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/api/inventory')
            .then(res => res.json())
            .then(data => {
                setInventoryData(data);
            })
            .catch(err => console.error("Envanter çekilemedi:", err))
            .finally(() => setLoading(false));
    }, []);

    // Giriş yapan kullanıcının gerçek zimmetleri
    const myInventory = useMemo(() => {
        if (!user || !inventoryData.length) return [];
        return inventoryData.filter(item =>
            item.assignedTo === (user as any).username || item.assignedTo === (user as any).name || item.assignedTo === (user as any).displayName
        );
    }, [user, inventoryData]);

    // Genel envanter özeti (filo + havuz)
    const fleetItems = useMemo(() => {
        return inventoryData.filter(i =>
            ["Araç", "Hava Gözlem"].includes(i.category)
        );
    }, [inventoryData]);

    const depodaCount  = inventoryData.filter(i => i.status === "Depoda").length;
    const bakimdaCount = inventoryData.filter(i => i.status === "Bakımda").length;

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-500" size={32} /></div>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 pt-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-1 uppercase tracking-tight flex items-center gap-3">
                    <Box className="text-red-500" size={30} /> Malzeme Arşivi
                </h1>
                <p className="text-neutral-500 font-light text-sm md:text-lg italic">Zimmetli ekipman ve genel filo takibi.</p>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Zimmetlerim", value: myInventory.length, color: "border-blue-500/20 text-blue-400" },
                    { label: "Depoda Hazır", value: depodaCount,       color: "border-emerald-500/20 text-emerald-400" },
                    { label: "Bakımda",      value: bakimdaCount,      color: "border-amber-500/20 text-amber-400" },
                ].map((s, i) => (
                    <div key={i} className={`bg-[#050B14] border rounded-2xl p-4 text-center ${s.color}`}>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">{s.label}</p>
                        <p className="text-3xl font-black">{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ─── ŞAHSİ ZİMMETLER ─── */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <UserCircle className="text-blue-500" size={20} /> Şahsi Zimmetlerim
                        </h2>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md font-black">
                            {myInventory.length} ADET
                        </span>
                    </div>

                    {myInventory.length > 0 ? (
                        <ul className="space-y-3">
                            {myInventory.map((item: any) => (
                                <li key={item.id} className="bg-[#020617] border border-white/5 p-4 rounded-xl flex items-start gap-4 hover:border-white/15 transition-colors">
                                    <div className="bg-black p-3 rounded-lg border border-white/5 flex-shrink-0">
                                        <PackageOpen size={18} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-white font-bold text-sm">{item.name}</h3>
                                                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-0.5">{item.category} · ID: {item.id}</p>
                                            </div>
                                            {statusIcon[item.status]}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${conditionColor[item.condition] || "bg-neutral-800 text-neutral-400"}`}>
                                                {item.condition}
                                            </span>
                                            {item.lastMaintenance && item.lastMaintenance !== "-" && (
                                                <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                                    <Clock size={9} /> Son Bakım: {item.lastMaintenance}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12">
                            <ShieldAlert className="mx-auto text-neutral-700 mb-3" size={36} />
                            <p className="text-neutral-500 text-sm">Üzerinize zimmetlenmiş ekipman bulunmuyor.</p>
                            <p className="text-neutral-600 text-xs mt-1">Zimmetleme işlemi admin tarafından yapılmaktadır.</p>
                        </div>
                    )}
                </div>

                {/* ─── GENEL FİLO / ARAÇ & DRONE ─── */}
                <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Car className="text-neutral-500" size={20} /> Filo & Araç Havuzu
                        </h2>
                        <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">YALNIZCA İZLEME</span>
                    </div>

                    {fleetItems.length > 0 ? (
                        <ul className="divide-y divide-white/5">
                            {fleetItems.map((item: any) => (
                                <li key={item.id} className="py-3.5 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-black border border-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Car size={14} className="text-neutral-500 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-neutral-200 font-semibold text-sm">{item.name}</p>
                                            <p className="text-[10px] text-neutral-600 uppercase tracking-widest">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            item.status === "Zimmetli" ? "bg-blue-500/10 text-blue-400" :
                                            item.status === "Bakımda"  ? "bg-amber-500/10 text-amber-400" :
                                                                          "bg-emerald-500/10 text-emerald-400"
                                        }`}>{item.status}</span>
                                        {item.assignedTo && (
                                            <span className="text-[9px] text-neutral-600">→ {item.assignedTo}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-neutral-600 text-sm text-center py-8">Araç/drone kaydı bulunamadı.</p>
                    )}

                    <div className="mt-6 bg-amber-500/5 p-4 border border-amber-500/10 rounded-xl">
                        <p className="text-xs text-amber-400/70 text-center">
                            <AlertTriangle size={11} className="inline mr-1" />
                            Arızalı ekipmanlarınızı Şube Sorumlusuna teslim ediniz. Tüm zimmet işlemleri yönetim tarafından yapılmaktadır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
