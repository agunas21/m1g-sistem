"use client";

import { motion } from "framer-motion";
import { Users, Shield, FileText, Award, Activity, Siren } from "lucide-react";
import { useState, useEffect } from "react";

type StatItem = {
    label: string;
    value: number;
    suffix: string;
    icon: React.ReactNode;
    color: string;
};

function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const step = target / (duration * 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [target, duration]);

    return <span>{count}</span>;
}

export default function StatsSection() {
    const [stats, setStats] = useState<StatItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Fetch real data from API/JSON
        async function loadStats() {
            try {
                const [membersRes, settingsRes] = await Promise.all([
                    fetch("/api/members").catch(() => null),
                    fetch("/api/settings/public").catch(() => null),
                ]);

                let memberCount = 45; // fallback
                let reportCount = 3;  // fallback
                let certCount = 12;   // fallback

                if (membersRes && membersRes.ok) {
                    const membersData = await membersRes.json();
                    const activeMembers = Array.isArray(membersData) 
                        ? membersData.filter((m: any) => m.status === "Aktif")
                        : [];
                    memberCount = activeMembers.length || 45;
                    
                    // Count certificates
                    let certs = 0;
                    if (Array.isArray(membersData)) {
                        membersData.forEach((m: any) => {
                            if (m.certificates && Array.isArray(m.certificates)) {
                                certs += m.certificates.length;
                            }
                        });
                    }
                    certCount = certs || 12;
                }

                if (settingsRes && settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    if (settingsData.activityReports && Array.isArray(settingsData.activityReports)) {
                        reportCount = settingsData.activityReports.length || 3;
                    }
                }

                setStats([
                    { label: "Aktif Üye", value: memberCount, suffix: "+", icon: <Users size={24} />, color: "text-red-500" },
                    { label: "Tamamlanan Operasyon", value: 8, suffix: "+", icon: <Siren size={24} />, color: "text-amber-500" },
                    { label: "Faaliyet Raporu", value: reportCount, suffix: "", icon: <FileText size={24} />, color: "text-blue-500" },
                    { label: "Kayıtlı Sertifika", value: certCount, suffix: "+", icon: <Award size={24} />, color: "text-emerald-500" },
                ]);
                setLoaded(true);
            } catch {
                // Fallback stats
                setStats([
                    { label: "Aktif Üye", value: 45, suffix: "+", icon: <Users size={24} />, color: "text-red-500" },
                    { label: "Tamamlanan Operasyon", value: 8, suffix: "+", icon: <Siren size={24} />, color: "text-amber-500" },
                    { label: "Faaliyet Raporu", value: 3, suffix: "", icon: <FileText size={24} />, color: "text-blue-500" },
                    { label: "Kayıtlı Sertifika", value: 12, suffix: "+", icon: <Award size={24} />, color: "text-emerald-500" },
                ]);
                setLoaded(true);
            }
        }
        loadStats();
    }, []);

    if (!loaded) return null;

    return (
        <section className="relative py-16 sm:py-24 bg-[#020617] overflow-hidden">
            {/* Decorative line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-red-600 font-bold tracking-[0.2em] mb-3 text-xs uppercase flex items-center justify-center gap-2">
                        <Activity size={14} /> Rakamlarla M1G
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                        Güçlü <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">Rakamlar</span>
                    </h3>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-all group"
                        >
                            <div className={`w-12 h-12 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">
                                <AnimatedCounter target={stat.value} />
                                <span className="text-lg text-neutral-500">{stat.suffix}</span>
                            </div>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Decorative line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/30 to-transparent"></div>
        </section>
    );
}
