"use client";

import { useEffect, useState } from "react";
import { Radio, AlertTriangle, Globe, MapPin, Activity } from "lucide-react";

export default function GlobalDisasterIntel() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // 1. Fetch GDACS RSS using rss2json
                const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://www.gdacs.org/xml/rss.xml");
                if (res.ok) {
                    const data = await res.json();
                    if (data.items && data.items.length > 0) {
                        const formatted = data.items.slice(0, 4).map((item: any) => ({
                            title: item.title?.split("(")[0]?.trim() || "Küresel Afet Uyarı Bildirimi",
                            desc: item.description?.replace(/<[^>]+>/g, '').substring(0, 120) + "...",
                            link: item.link || "https://www.gdacs.org",
                            date: item.pubDate,
                            type: item.title?.toLowerCase().includes("earthquake") ? "DEPREM" :
                                  item.title?.toLowerCase().includes("flood") ? "SEL" :
                                  item.title?.toLowerCase().includes("cyclone") ? "KASIRGA" : "ALARM"
                        }));
                        setNews(formatted);
                    }
                }
            } catch (error) {
                console.error("GDACS fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) {
        return (
            <section className="py-20 relative bg-transparent border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <Radio size={40} className="text-red-500 animate-ping mx-auto mb-4" />
                    <p className="text-neutral-400 font-bold tracking-widest uppercase text-sm">Uluslararası Uyarı Sistemine Bağlanılıyor...</p>
                </div>
            </section>
        );
    }

    if (news.length === 0) return null; // If completely failed, don't show empty block.

    return (
        <section className="py-16 sm:py-24 relative bg-transparent border-b border-white/5 overflow-hidden">
            {/* Arka Plan Efekti */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg inline-flex items-center gap-3 mb-6 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                            <Globe size={16} className="text-red-500 animate-pulse" />
                            <span className="text-red-400 font-bold tracking-[0.25em] uppercase text-xs">
                                Global Disaster Alert System
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Küresel <span className="text-neutral-600">İstihbarat</span> Radarı
                        </h2>
                        <p className="text-neutral-400 mt-4 max-w-xl text-sm md:text-base leading-relaxed">
                            Birleşmiş Milletler (BM) ve AB GDACS uyarı sistemlerinden alınan milisaniyelik otonom küresel kriz raporları.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {news.map((item, idx) => (
                        <a 
                            key={idx} 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group block bg-[#020617] border border-white/10 hover:border-red-500/50 rounded-2xl overflow-hidden shadow-2xl hover:-translate-y-2 transition-all duration-500 relative"
                        >
                            {/* Card Header */}
                            <div className="bg-neutral-900 px-5 py-4 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                                    item.type === "DEPREM" ? "bg-orange-500/20 text-orange-400" :
                                    item.type === "SEL" ? "bg-blue-500/20 text-blue-400" :
                                    "bg-red-500/20 text-red-400"
                                }`}>
                                    {item.type}
                                </span>
                                <Activity size={14} className="text-neutral-500 group-hover:text-red-500 transition-colors" />
                            </div>

                            {/* Card Body */}
                            <div className="p-6 relative">
                                <h3 className="text-white font-bold text-base md:text-lg uppercase tracking-wide leading-tight mb-4 group-hover:text-red-400 transition-colors line-clamp-3">
                                    {item.title}
                                </h3>
                                <p className="text-neutral-400 text-xs md:text-sm font-light leading-relaxed mb-6 line-clamp-4">
                                    {item.desc}
                                </p>
                                
                                {/* Footer Meta */}
                                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-auto pt-4 border-t border-white/5">
                                    <MapPin size={12} className="text-red-500" />
                                    <span>{new Date(item.date).toLocaleDateString("tr-TR")} • BM GDACS</span>
                                </div>
                            </div>

                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
