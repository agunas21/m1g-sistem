"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, MapPin, Users, Calendar, Loader2, Target, Radio, ChevronRight } from "lucide-react";

interface Operation {
    id: string;
    title: string;
    date: string;
    location: string;
    type: "arama-kurtarma" | "insani-yardim" | "tatbikat" | "ekoloji";
    status: "tamamlandi" | "devam" | "planlandi";
    participants: number;
    description: string;
    image?: string;
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    "arama-kurtarma": { label: "Arama & Kurtarma", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: "🔍" },
    "insani-yardim": { label: "İnsani Yardım", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: "🤝" },
    "tatbikat": { label: "Tatbikat", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: "🎯" },
    "ekoloji": { label: "Ekoloji", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "🌿" },
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
    tamamlandi: { label: "Tamamlandı", color: "text-emerald-400" },
    devam: { label: "Devam Ediyor", color: "text-amber-400" },
    planlandi: { label: "Planlandı", color: "text-blue-400" },
};

// Demo operations data
const DEMO_OPERATIONS: Operation[] = [
    {
        id: "op1", title: "Kış Dönemi Arama Kurtarma Tatbikatı", date: "2026-01-18",
        location: "Bornova/İzmir", type: "tatbikat", status: "tamamlandi", participants: 22,
        description: "Kış koşullarında arama kurtarma becerilerinin geliştirilmesi amacıyla düzenlenen kapsamlı saha tatbikatı."
    },
    {
        id: "op2", title: "Deprem Sonrası İnsani Yardım Operasyonu", date: "2025-12-10",
        location: "Hatay", type: "insani-yardim", status: "tamamlandi", participants: 35,
        description: "Deprem bölgesinde acil insani yardım malzemelerinin dağıtımı ve lojistik destek operasyonu."
    },
    {
        id: "op3", title: "Dağ Arama Kurtarma Operasyonu", date: "2026-03-05",
        location: "Spil Dağı/Manisa", type: "arama-kurtarma", status: "tamamlandi", participants: 18,
        description: "Spil Dağı bölgesinde kaybolan dağcıların aranması ve kurtarılması operasyonu."
    },
    {
        id: "op4", title: "Ege Kıyı Temizliği", date: "2026-04-22",
        location: "Çeşme/İzmir", type: "ekoloji", status: "tamamlandi", participants: 45,
        description: "Dünya Doğa Günü kapsamında Ege kıyılarında çevre temizliği ve farkındalık etkinliği."
    },
    {
        id: "op5", title: "İleri Seviye İlk Yardım Eğitimi", date: "2026-05-20",
        location: "İzmir Merkez", type: "tatbikat", status: "planlandi", participants: 30,
        description: "Saha koşullarında ileri seviye ilk yardım ve travma müdahale eğitimi."
    },
];

export default function OperasyonlarPage() {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/settings/operations?t=" + Date.now());
                const data = await res.json();
                setOperations(data.operations?.length ? data.operations : DEMO_OPERATIONS);
            } catch {
                setOperations(DEMO_OPERATIONS);
            }
            setLoading(false);
        }
        load();
    }, []);

    const filtered = filter ? operations.filter(o => o.type === filter) : operations;

    const stats = {
        total: operations.length,
        completed: operations.filter(o => o.status === "tamamlandi").length,
        participants: operations.reduce((s, o) => s + o.participants, 0),
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] pt-32 flex items-center justify-center">
            <Loader2 className="animate-spin text-red-500 w-10 h-10" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] pt-32 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3 block">Saha Operasyonları</span>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        OPERASYON<span className="text-neutral-500">LAR</span>
                    </h1>
                    <div className="w-20 h-1 bg-red-600 mx-auto mb-6"></div>
                    <p className="text-neutral-400 max-w-2xl mx-auto">
                        M1G Arama Kurtarma ekibinin gerçekleştirdiği saha operasyonları ve tatbikatlar.
                    </p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    {[
                        { icon: <Target size={20} />, value: stats.total, label: "Toplam Operasyon" },
                        { icon: <Shield size={20} />, value: stats.completed, label: "Tamamlanan" },
                        { icon: <Users size={20} />, value: stats.participants, label: "Toplam Katılımcı" },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-[#050B14] border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-red-500 flex justify-center mb-2">{s.icon}</div>
                            <div className="text-2xl font-black text-white">{s.value}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    <button onClick={() => setFilter("")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!filter ? "bg-red-600 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}>
                        Tümü
                    </button>
                    {Object.entries(TYPE_STYLES).map(([key, val]) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === key ? "bg-red-600 text-white" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}>
                            {val.icon} {val.label}
                        </button>
                    ))}
                </div>

                {/* Operations List */}
                <div className="space-y-4">
                    {filtered.map((op, i) => (
                        <motion.div key={op.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-[#050B14] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                            <button onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
                                className="w-full p-5 flex items-center gap-4 text-left">
                                <div className={`p-3 rounded-xl ${TYPE_STYLES[op.type]?.bg || "bg-white/5"} border flex-shrink-0`}>
                                    <span className="text-xl">{TYPE_STYLES[op.type]?.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${TYPE_STYLES[op.type]?.color}`}>
                                            {TYPE_STYLES[op.type]?.label}
                                        </span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${STATUS_STYLES[op.status]?.color}`}>
                                            • {STATUS_STYLES[op.status]?.label}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm md:text-base truncate">{op.title}</h3>
                                    <div className="flex gap-4 mt-1 text-[10px] text-neutral-600">
                                        <span className="flex items-center gap-1"><Calendar size={10} /> {op.date}</span>
                                        <span className="flex items-center gap-1"><MapPin size={10} /> {op.location}</span>
                                        <span className="flex items-center gap-1"><Users size={10} /> {op.participants} kişi</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`text-neutral-600 transition-transform ${expandedId === op.id ? "rotate-90" : ""}`} />
                            </button>

                            {expandedId === op.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    className="px-5 pb-5 border-t border-white/5 pt-4">
                                    <p className="text-neutral-400 text-sm leading-relaxed">{op.description}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-20">
                        <Radio size={40} className="mx-auto text-neutral-700 mb-4" />
                        <p className="text-neutral-500">Bu kategoride operasyon bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
