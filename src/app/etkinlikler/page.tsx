"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Plus, ChevronLeft, ChevronRight, Bell, Loader2 } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;        // "2026-05-15"
    time: string;        // "14:00"
    location: string;
    description: string;
    category: "egitim" | "operasyon" | "toplanti" | "sosyal" | "tatbikat";
    status: "yaklasan" | "devam" | "tamamlandi";
}

const CATEGORY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
    egitim:    { label: "Eğitim",     color: "text-blue-400",    bg: "bg-blue-500/10" },
    operasyon: { label: "Operasyon",  color: "text-red-400",     bg: "bg-red-500/10" },
    toplanti:  { label: "Toplantı",   color: "text-amber-400",   bg: "bg-amber-500/10" },
    sosyal:    { label: "Sosyal",     color: "text-purple-400",  bg: "bg-purple-500/10" },
    tatbikat:  { label: "Tatbikat",   color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const MONTHS_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS_TR = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday=0
}

export default function EtkinlikTakvimiPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/settings/events?t=" + Date.now());
                const data = await res.json();
                setEvents(data.calendarEvents || []);
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const dateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const eventsOnDate = (day: number) => events.filter(e => e.date === dateStr(day));
    const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

    const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

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
                    <span className="text-red-500 font-bold tracking-[0.3em] uppercase text-xs mb-3 block">Planlanan Etkinlikler</span>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        ETKİNLİK <span className="text-neutral-500">TAKVİMİ</span>
                    </h1>
                    <div className="w-20 h-1 bg-red-600 mx-auto"></div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl overflow-hidden">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between p-4 border-b border-white/5">
                                <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-400 hover:text-white">
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                                    {MONTHS_TR[month]} {year}
                                </h2>
                                <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-neutral-400 hover:text-white">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b border-white/5">
                                {DAYS_TR.map(d => (
                                    <div key={d} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-neutral-500">{d}</div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7">
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square border-r border-b border-white/5 bg-black/20" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const ds = dateStr(day);
                                    const dayEvents = eventsOnDate(day);
                                    const isToday = ds === new Date().toISOString().split("T")[0];
                                    const isSelected = ds === selectedDate;

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                                            className={`aspect-square border-r border-b border-white/5 p-1 relative hover:bg-white/5 transition-colors
                                                ${isToday ? "bg-red-500/10" : ""}
                                                ${isSelected ? "bg-white/10 ring-1 ring-red-500" : ""}
                                            `}
                                        >
                                            <span className={`text-xs font-bold ${isToday ? "text-red-400" : "text-neutral-400"}`}>{day}</span>
                                            {dayEvents.length > 0 && (
                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                    {dayEvents.slice(0, 3).map((e, j) => (
                                                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_STYLES[e.category]?.bg || "bg-white/20"}`}
                                                            style={{ backgroundColor: CATEGORY_STYLES[e.category]?.color.replace("text-", "").includes("red") ? "#f87171" :
                                                                CATEGORY_STYLES[e.category]?.color.includes("blue") ? "#60a5fa" :
                                                                CATEGORY_STYLES[e.category]?.color.includes("amber") ? "#fbbf24" :
                                                                CATEGORY_STYLES[e.category]?.color.includes("purple") ? "#a78bfa" : "#34d399" }} />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Date Events */}
                        <AnimatePresence>
                            {selectedDate && selectedEvents.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 space-y-3">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                        {selectedDate} Tarihli Etkinlikler
                                    </h3>
                                    {selectedEvents.map(ev => (
                                        <div key={ev.id} className="bg-[#050B14] border border-white/10 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${CATEGORY_STYLES[ev.category]?.bg || "bg-white/5"}`}>
                                                    <Calendar size={16} className={CATEGORY_STYLES[ev.category]?.color || "text-white"} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${CATEGORY_STYLES[ev.category]?.color}`}>
                                                            {CATEGORY_STYLES[ev.category]?.label}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm">{ev.title}</h4>
                                                    <p className="text-neutral-500 text-xs mt-1">{ev.description}</p>
                                                    <div className="flex gap-4 mt-2 text-[10px] text-neutral-600">
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {ev.time}</span>
                                                        <span className="flex items-center gap-1"><MapPin size={10} /> {ev.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar — Upcoming Events */}
                    <div className="space-y-4">
                        <div className="bg-[#050B14] border border-white/10 rounded-2xl p-5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Bell size={14} className="text-red-500" /> Yaklaşan Etkinlikler
                            </h3>
                            {upcomingEvents.length === 0 && (
                                <p className="text-neutral-600 text-xs text-center py-8">Planlanmış etkinlik bulunmuyor.</p>
                            )}
                            {upcomingEvents.map(ev => (
                                <div key={ev.id} className="py-3 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${CATEGORY_STYLES[ev.category]?.bg} ${CATEGORY_STYLES[ev.category]?.color}`}>
                                            {CATEGORY_STYLES[ev.category]?.label}
                                        </span>
                                        <span className="text-neutral-600 text-[10px]">{ev.date}</span>
                                    </div>
                                    <h4 className="text-white text-sm font-bold">{ev.title}</h4>
                                    <div className="flex gap-3 mt-1 text-[10px] text-neutral-600">
                                        <span className="flex items-center gap-0.5"><Clock size={9} /> {ev.time}</span>
                                        <span className="flex items-center gap-0.5"><MapPin size={9} /> {ev.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Category Legend */}
                        <div className="bg-[#050B14] border border-white/10 rounded-xl p-5">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Kategori Renkleri</h3>
                            <div className="space-y-2">
                                {Object.entries(CATEGORY_STYLES).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${val.bg}`}
                                            style={{ backgroundColor: val.color.includes("red") ? "#f87171" :
                                                val.color.includes("blue") ? "#60a5fa" :
                                                val.color.includes("amber") ? "#fbbf24" :
                                                val.color.includes("purple") ? "#a78bfa" : "#34d399" }} />
                                        <span className="text-neutral-400 text-xs">{val.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
