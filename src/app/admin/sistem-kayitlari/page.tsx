"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Activity, Filter, Clock, Search, User, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function SistemKayitlari() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/logs").then(r => r.json()).then(d => {
            if(d.logs) setLogs(d.logs);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = logs.filter(l => 
        (l.action + l.user + l.target).toLowerCase().includes(search.toLowerCase())
    );

    const getLevelColor = (level: string) => {
        switch(level) {
            case "SUCCESS": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "WARN": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "ERROR": return "text-red-500 bg-red-500/10 border-red-500/20";
            default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                        <Activity className="text-red-500" size={28} /> Sistem & Güvenlik Logları
                    </h1>
                    <p className="text-neutral-500 text-sm md:text-lg font-light italic">Yapılan tüm ekleme, silme ve güncelleme işlemleri kayıt altındadır.</p>
                </div>
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/5 bg-black/40 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="İşlem, kullanıcı veya hedef ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-red-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400 min-w-[800px]">
                        <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5 font-bold">Zaman</th>
                                <th className="px-6 py-5 font-bold">Kullanıcı</th>
                                <th className="px-6 py-5 font-bold">Aksiyon</th>
                                <th className="px-6 py-5 font-bold">Hedef</th>
                                <th className="px-6 py-5 font-bold">Detay (JSON)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10"><Activity className="animate-spin mx-auto text-red-500 mb-2"/> Yükleniyor...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-neutral-500">Kayıt bulunamadı.</td></tr>
                            ) : filtered.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-neutral-600" />
                                            {new Date(log.timestamp).toLocaleString("tr-TR")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-blue-500" />
                                            {log.user}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${getLevelColor(log.level)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-neutral-300">
                                        <div className="flex items-center gap-2">
                                            <Target size={14} className="text-red-400" />
                                            {log.target}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-neutral-500 truncate max-w-[200px]">
                                        {log.details ? JSON.stringify(log.details) : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
