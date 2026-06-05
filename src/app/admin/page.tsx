"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Box, Activity, CheckCircle, AlertTriangle, UserCheck, PackageOpen, Clock, ShieldCheck, Wifi, Mail, Gift, Send, RefreshCw } from "lucide-react";
import Link from "next/link";


export default function AdminDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [smtpStatus, setSmtpStatus] = useState<null | { ok: boolean; msg: string }>(null);
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [bdLoading, setBdLoading] = useState(false);
    const [bdSending, setBdSending] = useState(false);
    const [bdResult, setBdResult] = useState<null | string>(null);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/members').then(res => res.json()),
            fetch('/api/inventory').then(res => res.json())
        ]).then(([members, inventory]) => {
            setMembersData(Array.isArray(members) ? members : []);
            setInventoryData(Array.isArray(inventory) ? inventory : []);
        }).catch(console.error);
    }, []);

    // Saat sürekli senkron güncelle
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Doğum günlerini yükle
    useEffect(() => {
        fetchBirthdays();
    }, []);

    const fetchBirthdays = async () => {
        setBdLoading(true);
        try {
            const res = await fetch('/api/birthdays?days=30');
            const data = await res.json();
            setBirthdays(Array.isArray(data) ? data : []);
        } catch { setBirthdays([]); }
        finally { setBdLoading(false); }
    };

    const testSmtp = async () => {
        setSmtpLoading(true);
        setSmtpStatus(null);
        try {
            const res = await fetch('/api/test-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testEmail: '' })
            });
            const data = await res.json();
            setSmtpStatus({ ok: res.ok, msg: data.message || data.error || 'Bilinmeyen yanıt' });
        } catch (e: any) {
            setSmtpStatus({ ok: false, msg: e.message });
        } finally {
            setSmtpLoading(false);
        }
    };

    const sendBirthdayMails = async (withinDays: number) => {
        setBdSending(true);
        setBdResult(null);
        try {
            const res = await fetch('/api/birthdays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ withinDays, sendMails: true })
            });
            const data = await res.json();
            setBdResult(data.sent !== undefined ? `✅ ${data.sent} kişiye doğum günü maili gönderildi.` : `❌ ${data.error}`);
        } catch (e: any) {
            setBdResult(`❌ ${e.message}`);
        } finally {
            setBdSending(false);
        }
    };

    // ─── GERÇEK ZAMANLI HESAPLAMALAR ───
    const stats = useMemo(() => {
        const allMembers = membersData;
        const allInventory = inventoryData;

        const activeCount    = allMembers.filter(m => m.status === "ACTIVE" || m.status === "Aktif").length;
        const passiveCount   = allMembers.filter(m => m.status === "PASSIVE" || m.status === "Pasif" || m.status === "BANNED").length;
        const adminCount     = allMembers.filter(m => m.role === "ADMIN" || m.role === "SUPER_ADMIN" || m.isAdmin).length;
        const volunteerCount = allMembers.filter(m => m.memberType === "Gönüllü").length;
        const honoraryCount  = allMembers.filter(m => m.honorary === "Evet").length;

        const totalEquipment  = allInventory.length;
        const depodaCount     = allInventory.filter(i => i.status === "Depoda").length;
        const zimmetliCount   = allInventory.filter(i => i.status === "Zimmetli").length;
        const bakimdaCount    = allInventory.filter(i => i.status === "Bakımda" || i.status === "Kayıp/Hurda").length;

        return {
            activeCount, passiveCount, adminCount, volunteerCount, honoraryCount,
            totalEquipment, depodaCount, zimmetliCount, bakimdaCount,
            totalMembers: allMembers.length
        };
    }, [membersData, inventoryData]);

    // ─── GERÇEK ZAMANLI SON ÜYELER ───
    const recentMembers = useMemo(() => {
        return membersData
            .filter(m => m.status === "ACTIVE" || m.status === "Aktif")
            .slice(-8)
            .reverse()
            .map((m, idx) => ({
                name: m.fullName || "İsimsiz",
                id: m.id || `m1g-${idx}`,
                status: m.status || "Aktif"
            }));
    }, [membersData]);

    // ─── CANLI SISTEM OLAY GÜNLÜĞÜ (gerçek hesaplara dayalı) ───
    const systemLogs = useMemo(() => {
        const allMembers = membersData;
        const allInventory = inventoryData;

        const logs: { time: string; text: string; type: string }[] = [];

        logs.push({
            type: "user",
            text: `Sistemde ${stats.activeCount} aktif, ${stats.passiveCount} pasif toplam ${stats.totalMembers} personel kayıtlı.`,
            time: "Şimdi"
        });

        const today = new Date();
        const upcomingBirthdays = allMembers.filter(m => {
            if (!m.birthDate) return false;
            const parts = m.birthDate.split(".");
            if (parts.length !== 3) return false;
            const bDate = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const diffTime = bDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Eğer geçmişse seneye hesapla
            if (diffDays < 0) {
                bDate.setFullYear(today.getFullYear() + 1);
                const nextDiff = Math.ceil((bDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return nextDiff <= 3 && nextDiff >= 0;
            }
            return diffDays <= 3 && diffDays >= 0;
        });

        upcomingBirthdays.forEach(m => {
            const parts = m.birthDate.split(".");
            const bDate = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (bDate < today) bDate.setFullYear(today.getFullYear() + 1);
            const diffDays = Math.ceil((bDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let dayText = diffDays === 0 ? "Bugün!" : `${diffDays} gün kaldı`;
            logs.unshift({
                type: "birthday",
                text: `🎂 ${m.fullName || m.id} personelinin doğum günü! (${dayText})`,
                time: "Önemli"
            });
        });

        const assignedItems = allInventory.filter(i => i.status === "Zimmetli");
        if (assignedItems.length > 0) {
            const item = assignedItems[0];
            const member = allMembers.find(m => m.id === item.assignedTo);
            logs.push({
                type: "inventory",
                text: `"${item.name}" ekipmanı ${member?.fullName || item.assignedTo} üzerine kayıtlı.`,
                time: "Canlı"
            });
        }

        const brokenItems = allInventory.filter(i => i.status === "Bakımda" || i.condition === "Arızalı");
        if (brokenItems.length > 0) {
            logs.push({
                type: "warning",
                text: `${brokenItems.length} adet ekipman bakımda / arızalı durumda. Depo kontrolü gerekiyor.`,
                time: "Canlı"
            });
        }

        const admins = allMembers.filter(m => m.role === "ADMIN" || m.role === "SUPER_ADMIN" || m.isAdmin);
        if (admins.length > 0) {
            logs.push({
                type: "cert",
                text: `Yönetim Kurulu: ${admins.map(a => a.fullName || a.id).join(", ")}.`,
                time: "Kayıtlı"
            });
        }

        logs.push({
            type: "api",
            text: "Kandilli deprem verisi ve deprem otonom izleme sistemi aktif.",
            time: "Sistem"
        });

        logs.push({
            type: "api",
            text: `Toplam ${inventoryData.length} demirbaş Depo & Lojistik sisteminde izleniyor.`,
            time: "Canlı"
        });

        return logs;
    }, [stats, membersData, inventoryData]);

    const logTypeStyle: Record<string, string> = {
        cert:      "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        user:      "bg-blue-500/10 text-blue-500 border-blue-500/20",
        api:       "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        inventory: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        warning:   "bg-red-500/10 text-red-500 border-red-500/20",
        birthday:  "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };

    return (
        <div className="space-y-6 pb-10">

            {/* HEADER */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-1 uppercase tracking-tight">Sistem Özeti</h1>
                    <p className="text-neutral-500 text-sm flex items-center gap-2">
                        <Wifi size={12} className="text-emerald-500 animate-pulse" />
                        Canlı — Son güncelleme: {currentTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Sistem Aktif</span>
                </div>
            </div>

            {/* ─── ÜYELIK İSTATİSTİKLERİ ─── */}
            <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                    <Users size={12} /> Personel Durumu
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { label: "Toplam Üye",    value: stats.totalMembers,   color: "bg-neutral-800 border-white/5 text-white" },
                        { label: "Aktif",          value: stats.activeCount,    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                        { label: "Pasif",          value: stats.passiveCount,   color: "bg-neutral-700/50 border-white/5 text-neutral-400" },
                        { label: "Gönüllü",        value: stats.volunteerCount, color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                        { label: "Onur Üyesi",     value: stats.honoraryCount,  color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={`border p-4 rounded-2xl flex flex-col gap-1 ${s.color}`}
                        >
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
                            <h3 className="text-3xl font-black tracking-tighter">{s.value}</h3>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ─── ENVANTER İSTATİSTİKLERİ ─── */}
            <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                    <Box size={12} /> Depo & Lojistik Durumu
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Toplam Demirbaş", value: stats.totalEquipment, icon: <Box size={18} />,         color: "bg-neutral-800 border-white/5 text-white" },
                        { label: "Depoda Hazır",     value: stats.depodaCount,    icon: <PackageOpen size={18} />, color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                        { label: "Sahada (Zimmetli)",value: stats.zimmetliCount,  icon: <UserCheck size={18} />,   color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                        { label: "Bakımda / Arızalı",value: stats.bakimdaCount,   icon: <AlertTriangle size={18}/>, color: "bg-red-500/10 border-red-500/20 text-red-400" },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.06 }}
                            className={`border p-4 rounded-2xl flex items-center justify-between ${s.color}`}
                        >
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">{s.label}</p>
                                <h3 className="text-3xl font-black tracking-tighter">{s.value}</h3>
                            </div>
                            <div className="opacity-40">{s.icon}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ─── OLAY GÜNLÜĞÜ + SON ÜYELER ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

                {/* OLAY GÜNLÜĞÜ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#050B14] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col"
                >
                    <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                        <Activity className="text-red-500" size={16} /> Canlı Sistem Günlüğü
                    </h3>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {systemLogs.map((log, i) => (
                            <div key={i} className="flex gap-3 items-start pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                <div className={`mt-0.5 flex-shrink-0 rounded p-1.5 border ${logTypeStyle[log.type]}`}>
                                    {log.type === "api" ? <CheckCircle size={10} /> : log.type === "warning" ? <AlertTriangle size={10} /> : <ShieldCheck size={10} />}
                                </div>
                                <div className="leading-tight">
                                    <p className="text-[12px] text-neutral-300 font-medium">{log.text}</p>
                                    <p className="text-[9px] uppercase tracking-widest font-mono text-neutral-600 mt-1 flex items-center gap-1">
                                        <Clock size={8} /> {log.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* SON EKLENEN ÜYELER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-[#050B14] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col"
                >
                    <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                        <Users className="text-blue-500" size={16} /> Sistemdeki Son Üyeler
                    </h3>
                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {recentMembers.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {m.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-200 font-medium leading-tight">{m.name}</p>
                                        <p className="text-[9px] text-neutral-600 font-mono mt-0.5 uppercase">ID: {m.id}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-widest border ${
                                    m.status === "Pasif"
                                    ? "bg-neutral-800 text-neutral-500 border-white/5"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                }`}>
                                    {m.status || "Aktif"}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link href="/admin/uyeler" className="mt-4 text-center text-[10px] text-neutral-500 hover:text-red-400 uppercase tracking-widest font-bold transition-colors block pt-3 border-t border-white/5">
                        Tüm Personel Listesi →
                    </Link>
                </motion.div>
            </div>

            {/* ─── SMTP TEST + DOĞUM GÜNÜ BİLDİRİMLERİ ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

                {/* SMTP TEST */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-[#050B14] border border-white/5 p-6 rounded-2xl shadow-xl"
                >
                    <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                        <Mail className="text-blue-500" size={16} /> E-Posta Sistemi (SMTP)
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-neutral-400 space-y-1">
                            <p className="flex justify-between"><span className="text-neutral-600 uppercase tracking-widest font-bold">Sunucu</span><span className="text-white font-mono">{process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.hostinger.com'}</span></p>
                            <p className="flex justify-between"><span className="text-neutral-600 uppercase tracking-widest font-bold">Gönderen</span><span className="text-white font-mono">info@m1g.org.tr</span></p>
                            <p className="flex justify-between"><span className="text-neutral-600 uppercase tracking-widest font-bold">Port</span><span className="text-white font-mono">465 (SSL)</span></p>
                        </div>

                        {smtpStatus && (
                            <div className={`px-4 py-3 rounded-xl text-xs font-medium border ${
                                smtpStatus.ok
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                {smtpStatus.msg}
                            </div>
                        )}

                        <button
                            onClick={testSmtp}
                            disabled={smtpLoading}
                            className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {smtpLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                            {smtpLoading ? 'Test Gönderiliyor...' : 'Test Maili Gönder → info@m1g.org.tr'}
                        </button>
                    </div>
                </motion.div>

                {/* DOĞUM GÜNÜ BİLDİRİMLERİ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-[#050B14] border border-white/5 p-6 rounded-2xl shadow-xl"
                >
                    <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                        <Gift className="text-pink-500" size={16} /> Doğum Günü Bildirimleri
                        <button onClick={fetchBirthdays} className="ml-auto text-neutral-600 hover:text-white transition-colors">
                            <RefreshCw size={12} className={bdLoading ? 'animate-spin' : ''} />
                        </button>
                    </h3>

                    {bdLoading ? (
                        <div className="text-center py-6 text-neutral-600 text-xs">Yükleniyor...</div>
                    ) : birthdays.length === 0 ? (
                        <div className="text-center py-6 text-neutral-600 text-xs">Önümüzdeki 30 gün içinde doğum günü yaklaşan kimse yok.</div>
                    ) : (
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                            {birthdays.map((m: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold">
                                            {m.fullName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-white font-medium">{m.fullName}</p>
                                            <p className="text-[10px] text-neutral-500 mt-0.5">{m.birthDate}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${
                                        m.daysUntilBirthday === 0 ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                                        m.daysUntilBirthday <= 7 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                        'bg-white/5 text-neutral-400 border-white/10'
                                    }`}>
                                        {m.daysUntilBirthday === 0 ? '🎂 Bugün!' : `${m.daysUntilBirthday} gün`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {bdResult && (
                        <div className={`px-4 py-3 rounded-xl text-xs font-medium border mb-3 ${
                            bdResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>{bdResult}</div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => sendBirthdayMails(1)}
                            disabled={bdSending}
                            className="py-2.5 bg-pink-600/10 hover:bg-pink-600/20 text-pink-400 border border-pink-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {bdSending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                            Bugün Doğanlara
                        </button>
                        <button
                            onClick={() => sendBirthdayMails(7)}
                            disabled={bdSending}
                            className="py-2.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {bdSending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                            7 Gün İçindekilere
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
