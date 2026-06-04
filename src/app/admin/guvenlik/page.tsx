"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Shield, AlertTriangle, Lock, Zap, Bot, Globe,
    RefreshCw, Activity, TrendingUp, Clock, ChevronRight,
    Eye, EyeOff, Server, Wifi, Database, CheckCircle2
} from "lucide-react";

interface WafStats {
    totalRequests: number;
    blockedRequests: number;
    blockRate: string;
    ddosBlocks: number;
    sqlInjectionBlocks: number;
    xssBlocks: number;
    pathTraversalBlocks: number;
    botBlocks: number;
    rateLimitBlocks: number;
    upSince: string;
}

interface BlockedIP {
    key: string;
    blockedUntil: string;
    remainingMs: number;
    strikes: number;
}

interface SecurityData {
    waf: WafStats;
    rateLimit: { totalTracked: number; totalBlocked: number; storeSize: number };
    blockedIPs: BlockedIP[];
    recentSecurityEvents: any[];
    generatedAt: string;
}

function StatCard({ icon, label, value, sub, color = "red", pulse = false }: any) {
    const colors: Record<string, string> = {
        red:    "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400",
        orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400",
        amber:  "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
        green:  "from-green-500/20 to-green-600/5 border-green-500/30 text-green-400",
        blue:   "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
        purple: "from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400",
    };
    return (
        <div className={`relative bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 overflow-hidden`}>
            {pulse && <div className="absolute top-3 right-3 w-2 h-2 bg-current rounded-full animate-ping opacity-60" />}
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-xl bg-current/10">{icon}</div>
            </div>
            <div className="text-2xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</div>
            {sub && <div className="text-[11px] opacity-50 mt-1">{sub}</div>}
        </div>
    );
}

function ms(ms: number) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m > 0 ? `${m}dk ${s}sn` : `${s}sn`;
}

export default function GuvenlikPage() {
    const [data, setData] = useState<SecurityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/security");
            if (!res.ok) throw new Error("Yetki hatası");
            const json = await res.json();
            setData(json);
            setLastUpdate(new Date());
            setError("");
        } catch (e: any) {
            setError(e.message || "Veri alınamadı");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const t = setInterval(fetchData, 15000); // 15sn'de bir güncelle
        return () => clearInterval(t);
    }, [autoRefresh, fetchData]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="relative">
                <Shield className="w-16 h-16 text-red-500/30" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-neutral-500 text-sm">Güvenlik verileri yükleniyor...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-red-400">{error}</p>
        </div>
    );

    const w = data!.waf;
    const allowed = w.totalRequests - w.blockedRequests;

    const threatBreakdown = [
        { label: "DDoS / Flood", value: w.ddosBlocks,          icon: <Zap size={14} />,     color: "#ef4444" },
        { label: "Rate Limit",   value: w.rateLimitBlocks,      icon: <Clock size={14} />,   color: "#f97316" },
        { label: "Bot / Scanner", value: w.botBlocks,           icon: <Bot size={14} />,     color: "#eab308" },
        { label: "SQL Injection", value: w.sqlInjectionBlocks,  icon: <Database size={14} />, color: "#a855f7" },
        { label: "XSS",          value: w.xssBlocks,            icon: <Globe size={14} />,   color: "#3b82f6" },
        { label: "Path Traversal", value: w.pathTraversalBlocks, icon: <ChevronRight size={14} />, color: "#06b6d4" },
    ];
    const totalThreats = threatBreakdown.reduce((a, b) => a + b.value, 0) || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <Shield className="w-5 h-5 text-red-400" />
                        </div>
                        <h1 className="text-xl font-black text-white uppercase tracking-widest">Siber Güvenlik</h1>
                    </div>
                    <p className="text-neutral-500 text-sm ml-12">
                        WAF • DDoS Koruması • Spam Filtresi • Veri Şifreleme
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {lastUpdate && (
                        <span className="text-[11px] text-neutral-600 hidden sm:block">
                            Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
                        </span>
                    )}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        className={`p-2 rounded-xl border text-xs transition-all ${
                            autoRefresh
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-white/5 border-white/10 text-neutral-500"
                        }`}
                        title={autoRefresh ? "Otomatik yenileme açık" : "Otomatik yenileme kapalı"}
                    >
                        <Activity size={16} className={autoRefresh ? "animate-pulse" : ""} />
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition-all"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Koruma Durumu Banner */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-green-500/15 border border-green-500/30">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-green-400 mb-0.5">🛡️ WAF Aktif — Sistem Korumalı</div>
                    <div className="text-xs text-neutral-500">
                        DDoS Koruması • SQL Injection Filtresi • XSS Engeli • Bot Koruması • AES-256-GCM Şifreleme • CSP Header'ları
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-xs text-neutral-500">Aktif Olduğundan Beri</div>
                    <div className="text-sm font-bold text-white">
                        {new Date(w.upSince).toLocaleDateString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                </div>
            </div>

            {/* Ana İstatistikler */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Toplam İstek"
                    value={w.totalRequests.toLocaleString('tr-TR')}
                    sub="Oturum boyunca"
                    color="blue"
                />
                <StatCard
                    icon={<CheckCircle2 size={20} />}
                    label="İzin Verilen"
                    value={allowed.toLocaleString('tr-TR')}
                    sub={`%${((allowed / Math.max(w.totalRequests, 1)) * 100).toFixed(1)}`}
                    color="green"
                />
                <StatCard
                    icon={<Shield size={20} />}
                    label="Engellenen"
                    value={w.blockedRequests.toLocaleString('tr-TR')}
                    sub={`Engel oranı: ${w.blockRate}`}
                    color="red"
                    pulse={w.blockedRequests > 0}
                />
                <StatCard
                    icon={<Lock size={20} />}
                    label="Bloklu IP"
                    value={data!.blockedIPs.length}
                    sub={`${data!.rateLimit.totalTracked} IP takipte`}
                    color="orange"
                    pulse={data!.blockedIPs.length > 0}
                />
            </div>

            {/* Tehdit Dağılımı + Bloklu IP'ler */}
            <div className="grid lg:grid-cols-2 gap-4">
                {/* Tehdit Dağılımı */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> Tehdit Türleri
                    </h3>
                    <div className="space-y-3">
                        {threatBreakdown.map(t => {
                            const pct = Math.round((t.value / totalThreats) * 100);
                            return (
                                <div key={t.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 text-xs text-neutral-400" style={{ color: t.color }}>
                                            {t.icon} {t.label}
                                        </div>
                                        <span className="text-xs font-bold text-white">{t.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: t.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bloklu IP'ler */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Wifi size={16} className="text-red-500" /> Bloklu IP'ler
                        {data!.blockedIPs.length > 0 && (
                            <span className="ml-auto text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-black">
                                {data!.blockedIPs.length}
                            </span>
                        )}
                    </h3>
                    {data!.blockedIPs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500/40 mb-2" />
                            <p className="text-neutral-600 text-sm">Aktif blok yok</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[240px] overflow-y-auto">
                            {data!.blockedIPs.map((ip, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <div>
                                        <div className="text-xs font-mono text-red-300">{ip.key.replace('ddos:', '').replace('api:', '').replace('login:', '')}</div>
                                        <div className="text-[10px] text-neutral-600 mt-0.5">
                                            {ip.strikes} ihlal • {ms(ip.remainingMs)} sonra açılır
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Güvenlik Özellikleri */}
            <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Server size={16} className="text-blue-500" /> Aktif Güvenlik Katmanları
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { label: "WAF Middleware",        desc: "Tüm istekler taranıyor",              icon: <Shield size={16} />,   active: true },
                        { label: "DDoS Koruması",         desc: "200 req/dk sliding window",          icon: <Zap size={16} />,      active: true },
                        { label: "Brute-Force",           desc: "5 deneme / 10 dk — 15 dk blok",     icon: <Lock size={16} />,     active: true },
                        { label: "SQL Injection Filtresi", desc: "14 farklı pattern taranıyor",        icon: <Database size={16} />, active: true },
                        { label: "XSS Koruması",          desc: "10 XSS vektörü engelleniyor",        icon: <Globe size={16} />,    active: true },
                        { label: "Bot Tespiti",           desc: "20+ zararlı UA bloklı",              icon: <Bot size={16} />,      active: true },
                        { label: "Spam Filtresi",         desc: "Honeypot + içerik analizi",          icon: <Eye size={16} />,      active: true },
                        { label: "AES-256-GCM",           desc: "TC kimlik numaraları şifreli",       icon: <Lock size={16} />,     active: true },
                        { label: "CSP Header'ları",       desc: "Content-Security-Policy aktif",      icon: <Shield size={16} />,   active: true },
                        { label: "HSTS",                  desc: "2 yıl, subdomain + preload",         icon: <Activity size={16} />, active: true },
                        { label: "Şifre Hash (scrypt)",   desc: "scrypt + timing-safe karşılaştırma", icon: <Lock size={16} />,     active: true },
                        { label: "JWT (HS256)",           desc: "HttpOnly cookie, sameSite=lax",      icon: <CheckCircle2 size={16} />, active: true },
                    ].map((f, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all">
                            <div className={`mt-0.5 p-1.5 rounded-lg ${f.active ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-neutral-600'}`}>
                                {f.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">{f.label}</div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">{f.desc}</div>
                            </div>
                            <div className={`ml-auto w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${f.active ? 'bg-green-500' : 'bg-neutral-700'}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Son Güvenlik Olayları */}
            {data!.recentSecurityEvents.length > 0 && (
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> Son Güvenlik Olayları
                        <span className="ml-auto text-[10px] text-neutral-600">(son 50 kayıt)</span>
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {data!.recentSecurityEvents.map((ev: any, i: number) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${
                                ev.level === 'ERROR'
                                    ? 'bg-red-500/5 border-red-500/10'
                                    : 'bg-amber-500/5 border-amber-500/10'
                            }`}>
                                <AlertTriangle size={12} className={ev.level === 'ERROR' ? 'text-red-400 flex-shrink-0' : 'text-amber-400 flex-shrink-0'} />
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-white">{ev.action}</span>
                                    <span className="text-neutral-500 ml-2">{ev.target}</span>
                                </div>
                                <div className="text-neutral-600 flex-shrink-0 hidden sm:block">
                                    {new Date(ev.timestamp).toLocaleString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
