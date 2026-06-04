"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ChevronLeft, ChevronRight, Calendar, Tag, ArrowRight } from "lucide-react";

type Announcement = {
    id: string;
    title: string;
    summary: string;
    category: string;
    date: string;
    image?: string;
};

export default function AnnouncementSlider() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/settings/public");
                if (res.ok) {
                    const data = await res.json();
                    if (data.announcements && data.announcements.length > 0) {
                        setAnnouncements(data.announcements);
                    } else {
                        // Fallback demo data
                        setAnnouncements(getDemoAnnouncements());
                    }
                } else {
                    setAnnouncements(getDemoAnnouncements());
                }
            } catch {
                setAnnouncements(getDemoAnnouncements());
            }
            setLoaded(true);
        }
        load();
    }, []);

    useEffect(() => {
        if (announcements.length > 1) {
            timerRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % announcements.length);
            }, 6000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [announcements.length]);

    if (!loaded || announcements.length === 0) return null;

    const prev = () => setCurrentIndex(i => (i - 1 + announcements.length) % announcements.length);
    const next = () => setCurrentIndex(i => (i + 1) % announcements.length);

    const current = announcements[currentIndex];

    const categoryColors: Record<string, string> = {
        "Duyuru": "bg-blue-600/20 text-blue-400 border-blue-500/30",
        "Eğitim": "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
        "Operasyon": "bg-red-600/20 text-red-400 border-red-500/30",
        "Etkinlik": "bg-amber-600/20 text-amber-400 border-amber-500/30",
        "Haber": "bg-purple-600/20 text-purple-400 border-purple-500/30",
    };

    return (
        <section className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between mb-10"
                >
                    <div>
                        <h2 className="text-red-600 font-bold tracking-[0.2em] mb-2 text-xs uppercase flex items-center gap-2">
                            <Newspaper size={14} /> Güncel
                        </h2>
                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                            Son <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 to-neutral-700">Haberler</span>
                        </h3>
                    </div>
                    {announcements.length > 1 && (
                        <div className="flex gap-2">
                            <button onClick={prev} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={next} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Slider */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Image */}
                        {current.image && (
                            <div className="w-full md:w-2/5 aspect-video md:aspect-auto relative">
                                <div
                                    className="w-full h-full min-h-[200px] bg-cover bg-center"
                                    style={{ backgroundImage: `url(${current.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#020617]/90 hidden md:block"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent md:hidden"></div>
                            </div>
                        )}

                        {/* Content */}
                        <div className={`flex-1 p-6 sm:p-8 flex flex-col justify-center ${!current.image ? "md:p-12" : ""}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${categoryColors[current.category] || "bg-white/10 text-neutral-300 border-white/10"}`}>
                                    <Tag size={10} className="inline mr-1" />{current.category}
                                </span>
                                <span className="text-neutral-500 text-xs flex items-center gap-1">
                                    <Calendar size={12} />{current.date}
                                </span>
                            </div>
                            <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-3 leading-tight">
                                {current.title}
                            </h4>
                            <p className="text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-3">
                                {current.summary}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Dots */}
                {announcements.length > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {announcements.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-red-600 w-6" : "bg-white/20 hover:bg-white/40"}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function getDemoAnnouncements(): Announcement[] {
    return [
        {
            id: "1",
            title: "2026 Yılı Eğitim Takvimi Açıklandı",
            summary: "M1G Arama Kurtarma ekibi 2026 yılı eğitim programını açıkladı. Temel AFAD eğitimi, ileri düzey arama kurtarma teknikleri ve su altı kurtarma eğitimleri planlanmaktadır.",
            category: "Eğitim",
            date: "08 Mayıs 2026",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
        },
        {
            id: "2",
            title: "Ocak-Mart 2026 Faaliyet Raporu Yayınlandı",
            summary: "M1G Arama Kurtarma Derneği'nin 2026 yılı ilk çeyrek faaliyet raporu yayınlanmıştır. Detaylar için Faaliyetler sayfamızı ziyaret edin.",
            category: "Duyuru",
            date: "01 Mayıs 2026",
        },
        {
            id: "3",
            title: "Yeni Gönüllü Başvuruları Başladı",
            summary: "M1G ekibine katılmak isteyen gönüllüler için yeni dönem başvuruları açılmıştır. Gönüllü Ol sayfasından başvurunuzu yapabilirsiniz.",
            category: "Duyuru",
            date: "15 Nisan 2026",
        },
    ];
}
