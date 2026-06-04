"use client";

import { Award, ShieldCheck, CheckCircle } from "lucide-react";
import * as motion from "framer-motion/client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function UyeSertifikalar() {
    const { user } = useAuth();
    const [certificates, setCertificates] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetch('/api/members')
                .then(res => res.json())
                .then(membersData => {
                    if (!Array.isArray(membersData)) return;
                    const index = membersData.findIndex((m: any) => m.id === (user as any).uid || m.id === (user as any).username);
                    const memberRaw: any = index >= 0 ? membersData[index] : null;
            
            if (memberRaw && memberRaw.certificates) {
                // Sadece yetkili/onaylı gösterilecek formatta eşleme
                const formattedCerts = memberRaw.certificates.map((c: any) => ({
                    title: c.name,
                    authority: c.uploadedBy === "member" ? "Sistem Bekliyor" : "M1G Akademi",
                    date: new Date(c.uploadedAt).toLocaleDateString('tr-TR', { month: '2-digit', year: 'numeric' }),
                    tier: c.uploadedBy === "member" ? "bronze" : "silver",
                    desc: "Üye tarafından yüklenen veya yönetici tarafından atanan yetkinlik belgesi.",
                    file: c.file
                }));
                setCertificates(formattedCerts);
            }
        })
        .catch(console.error);
    }
}, [user]);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-2">
                    <ShieldCheck className="text-blue-500" size={28} /> Sertifikalar
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light">
                    M1G Yönetimi tarafından doğrulanmış operasyonel yetkinlik belgeleriniz.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="bg-[#050B14] border border-white/5 hover:border-blue-500/50 rounded-2xl p-6 relative overflow-hidden group shadow-xl transition-all"
                    >
                        {/* Arkaplan parlaması */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full transition-opacity group-hover:opacity-30 ${cert.tier === 'gold' ? 'bg-yellow-500' : cert.tier === 'silver' ? 'bg-neutral-300' : 'bg-orange-600'
                            }`}></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-5">
                                <div className={`p-2.5 rounded-xl border ${cert.tier === 'gold' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                        cert.tier === 'silver' ? 'bg-neutral-100/10 border-neutral-100/20 text-neutral-300' :
                                            'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                    }`}>
                                    <Award size={24} />
                                </div>
                                <span className="bg-[#020617] text-neutral-500 border border-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded">
                                    {cert.date}
                                </span>
                            </div>

                            <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider mb-2 leading-tight">
                                {cert.title}
                            </h3>

                            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 bg-blue-500/5 w-max px-2 py-1 rounded">
                                <CheckCircle size={10} /> {cert.authority}
                            </p>

                            <p className="text-neutral-500 text-xs md:text-sm font-light leading-relaxed mt-auto border-t border-white/5 pt-4">
                                {cert.desc}
                            </p>
                        </div>

                        {/* Su damgası - DOĞRULANMIŞTIR */}
                        <div className="absolute -bottom-4 right-0 translate-x-[10%] rotate-[-15deg] opacity-[0.03] pointer-events-none">
                            <h2 className="text-6xl font-black uppercase tracking-tighter">ONAYLI</h2>
                        </div>
                    </motion.div>
                ))}
            </div>

            {certificates.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-[#050B14]">
                    <Award className="mx-auto text-neutral-700 mb-4" size={48} />
                    <p className="text-neutral-500 font-bold uppercase tracking-widest">Sisteme kayıtlı resmi sertifikanız bulunmamaktadır.</p>
                </div>
            )}
        </div>
    );
}
