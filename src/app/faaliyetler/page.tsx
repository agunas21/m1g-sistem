"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, Calendar, MapPin, Users, ChevronDown, Filter,
    Loader2, FileText, Image as ImageIcon, X
} from "lucide-react";
import { ImageGallery } from "@/components/ui/image-gallery";

// Tür tanımları
interface ActivityReport {
    id: number;
    period: string;       // "Ocak-Mart 2026" gibi
    year: string;         // "2026"
    quarter: string;      // "Q1", "Q2", "Q3", "Q4"
    title: string;
    summary: string;
    date: string;         // "2026-01-15"
    location: string;
    participants: string;
    details: string;      // Detaylı açıklama
    category: string;     // "arama-kurtarma", "egitim", "insani-yardim", "ekoloji"
    photos: string[];     // Base64 fotoğraflar
}

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
    "arama-kurtarma": { label: "Arama & Kurtarma", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    "egitim":         { label: "Eğitim", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    "insani-yardim":  { label: "İnsani Yardım", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    "ekoloji":        { label: "Ekoloji", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    "sosyal":         { label: "Sosyal Faaliyet", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
};

const QUARTERS = [
    { value: "", label: "Tüm Dönemler" },
    { value: "Q1", label: "1. Çeyrek (Ocak–Mart)" },
    { value: "Q2", label: "2. Çeyrek (Nisan–Haziran)" },
    { value: "Q3", label: "3. Çeyrek (Temmuz–Eylül)" },
    { value: "Q4", label: "4. Çeyrek (Ekim–Aralık)" },
];

export default function FaaliyetlerPage() {
    const [activities, setActivities] = useState<ActivityReport[]>([]);
    const [activityGallery, setActivityGallery] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedQuarter, setSelectedQuarter] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/settings/activities?t=" + Date.now())
            .then(r => r.json())
            .then(data => {
                setActivities(data.activityReports || []);
                // Gallery items come with lazy markers — load actual photos individually
                const galleryItems = data.activityGallery || [];
                setActivityGallery(galleryItems);
                setLoading(false);

                // Lazy-load gallery photos one by one
                galleryItems.forEach((item: any, index: number) => {
                    if (item._hasPhoto) {
                        fetch(`/api/settings/gallery?type=gallery&index=${index}`)
                            .then(r => r.json())
                            .then(photoData => {
                                setActivityGallery(prev => {
                                    const updated = [...prev];
                                    updated[index] = {
                                        ...updated[index],
                                        photo: { url: photoData.photo },
                                        image: photoData.photo,
                                        common: photoData.text || updated[index].common,
                                    };
                                    return updated;
                                });
                            })
                            .catch(() => {});
                    }
                });
            })
            .catch(() => setLoading(false));
    }, []);

    // Yıl seçenekleri
    const years = [...new Set(activities.map(a => a.year))].sort((a, b) => b.localeCompare(a));

    // Filtreleme
    const filtered = activities.filter(a => {
        if (selectedYear && a.year !== selectedYear) return false;
        if (selectedQuarter && a.quarter !== selectedQuarter) return false;
        if (selectedCategory && a.category !== selectedCategory) return false;
        return true;
    });

    // İstatistikler
    const totalActivities = filtered.length;
    const totalCategories = new Set(filtered.map(a => a.category)).size;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-40 gap-4">
                <Loader2 className="animate-spin text-red-500 w-12 h-12" />
                <p className="text-neutral-500 text-sm uppercase tracking-widest">Faaliyet Raporları Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 md:pt-36 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* ═══ HERO HEADER ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <Activity size={14} />
                        Operasyonel Şeffaflık
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                        Faaliyet <span className="text-red-500">Raporları</span>
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        M1G Arama & Kurtarma ekibinin dönemsel operasyonel faaliyetleri, eğitim programları ve
                        insani yardım çalışmalarının şeffaf raporlaması.
                    </p>
                </motion.div>

                {/* ═══ İSTATİSTİK BAR ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
                >
                    {[
                        { label: "Toplam Faaliyet", value: totalActivities, icon: <Activity size={18} /> },
                        { label: "Dönem Sayısı", value: years.length, icon: <Calendar size={18} /> },
                        { label: "Kategori", value: totalCategories, icon: <Filter size={18} /> },
                        { label: "Raporlar", value: `${filtered.length}/${activities.length}`, icon: <FileText size={18} /> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#050B14] border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-red-500 flex justify-center mb-2">{stat.icon}</div>
                            <p className="text-white text-xl md:text-2xl font-black">{stat.value}</p>
                            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold mt-1">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* ═══ FİLTRELER ═══ */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col md:flex-row gap-3 mb-10"
                >
                    <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Yıl</label>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(e.target.value)}
                            className="w-full bg-[#050B14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                        >
                            <option value="">Tüm Yıllar</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Dönem</label>
                        <select
                            value={selectedQuarter}
                            onChange={e => setSelectedQuarter(e.target.value)}
                            className="w-full bg-[#050B14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                        >
                            {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5 block">Kategori</label>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full bg-[#050B14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500 transition-colors"
                        >
                            <option value="">Tüm Kategoriler</option>
                            {Object.entries(CATEGORIES).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* ═══ FAALİYET KARTLARI ═══ */}
                {filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 border border-dashed border-white/10 rounded-2xl"
                    >
                        <Activity size={40} className="mx-auto text-neutral-700 mb-4" />
                        <p className="text-neutral-500 text-sm">Bu filtrelere uygun faaliyet raporu bulunamadı.</p>
                        <button
                            onClick={() => { setSelectedYear(""); setSelectedQuarter(""); setSelectedCategory(""); }}
                            className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                        >
                            Filtreleri Temizle
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((act, index) => {
                            const catInfo = CATEGORIES[act.category] || CATEGORIES["sosyal"];
                            const isExpanded = expandedId === act.id;

                            return (
                                <motion.div
                                    key={act.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-[#050B14] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                                >
                                    {/* Kart Başlığı */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : act.id)}
                                        className="w-full flex items-start md:items-center gap-4 p-5 md:p-6 text-left group"
                                    >
                                        {/* Kategori Badge */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${catInfo.bg}`}>
                                            <Activity size={20} className={catInfo.color} />
                                        </div>

                                        {/* Bilgiler */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${catInfo.color}`}>
                                                    {catInfo.label}
                                                </span>
                                                <span className="text-neutral-700 text-[10px]">•</span>
                                                <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                                                    {act.period}
                                                </span>
                                            </div>
                                            <h3 className="text-white text-sm md:text-base font-bold group-hover:text-red-400 transition-colors truncate">
                                                {act.title}
                                            </h3>
                                            <p className="text-neutral-500 text-xs mt-1 line-clamp-1">{act.summary}</p>
                                        </div>

                                        {/* Meta */}
                                        <div className="hidden md:flex items-center gap-4 text-neutral-500 text-xs flex-shrink-0">
                                            {act.date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(act.date).toLocaleDateString("tr-TR")}
                                                </span>
                                            )}
                                            {act.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} /> {act.location}
                                                </span>
                                            )}
                                            {act.photos?.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <ImageIcon size={12} /> {act.photos.length} Fotoğraf
                                                </span>
                                            )}
                                        </div>

                                        {/* Genişlet */}
                                        <ChevronDown
                                            size={20}
                                            className={`text-neutral-600 flex-shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {/* Genişletilmiş Detay */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 md:px-6 pb-6 pt-0">
                                                    <div className="border-t border-white/5 pt-5">
                                                        {/* Mobil Meta */}
                                                        <div className="flex flex-wrap gap-3 mb-4 md:hidden">
                                                            {act.date && (
                                                                <span className="flex items-center gap-1 text-neutral-400 text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                                                                    <Calendar size={12} /> {new Date(act.date).toLocaleDateString("tr-TR")}
                                                                </span>
                                                            )}
                                                            {act.location && (
                                                                <span className="flex items-center gap-1 text-neutral-400 text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                                                                    <MapPin size={12} /> {act.location}
                                                                </span>
                                                            )}
                                                            {act.participants && (
                                                                <span className="flex items-center gap-1 text-neutral-400 text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                                                                    <Users size={12} /> {act.participants} Katılımcı
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Katılımcı (Desktop) */}
                                                        {act.participants && (
                                                            <div className="hidden md:flex items-center gap-2 mb-4">
                                                                <Users size={14} className="text-neutral-500" />
                                                                <span className="text-neutral-400 text-sm">{act.participants} Katılımcı</span>
                                                            </div>
                                                        )}

                                                        {/* Detay Metin */}
                                                        <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line mb-6">
                                                            {act.details || act.summary}
                                                        </div>

                                                        {/* Fotoğraf Galerisi */}
                                                        {act.photos && act.photos.length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
                                                                    Fotoğraf Galerisi ({act.photos.length})
                                                                </p>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                    {act.photos.map((photo, pi) => (
                                                                        <button
                                                                            key={pi}
                                                                            onClick={() => setLightboxImg(photo)}
                                                                            className="aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-red-500/30 transition-colors group"
                                                                        >
                                                                            <img
                                                                                src={photo}
                                                                                alt={`${act.title} - ${pi + 1}`}
                                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                            />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ═══ LIGHTBOX ═══ */}
                <AnimatePresence>
                    {lightboxImg && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setLightboxImg(null)}
                        >
                            <button
                                onClick={() => setLightboxImg(null)}
                                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <motion.img
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                src={lightboxImg}
                                alt="Fotoğraf"
                                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ FAALİYET GALERİSİ ═══ */}
                {activityGallery && activityGallery.filter((ag: any) => {
                    const url = ag.photo?.url || ag.image || "";
                    return url && !url.startsWith("__lazy");
                }).length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-20 pt-16 border-t border-white/5"
                    >
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
                                <ImageIcon size={14} />
                                Sahadan Kareler
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight">
                                Faaliyet <span className="text-red-500">Galerisi</span>
                            </h2>
                        </div>
                        <div className="w-full relative mx-auto pb-10">
                            <ImageGallery
                                items={activityGallery
                                    .filter((ag: any) => {
                                        const url = ag.photo?.url || ag.image || "";
                                        return url && !url.startsWith("__lazy");
                                    })
                                    .map((ag: any) => ({
                                        src: ag.photo?.url || ag.image || "",
                                        title: ag.common || ag.text || "Sahadan Kareler",
                                    }))}
                            />
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
