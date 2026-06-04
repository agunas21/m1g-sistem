"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCircle2, XCircle, Clock, User, RefreshCw, ShieldCheck, UserPlus, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    profile_update:       { label: "Profil Güncelleme",     color: "bg-blue-500/10 text-blue-400 border-blue-500/20",   icon: <User size={12} /> },
    volunteer_application:{ label: "Gönüllü Başvurusu",    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <UserPlus size={12} /> },
    aidat_dekont:         { label: "Aidat Dekont Onayı",    color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: <FileText size={12} /> },
};

const STATUS_STYLE: Record<string, string> = {
    pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};
const STATUS_LABEL: Record<string, string> = {
    pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi",
};

import { useAuth } from "@/context/AuthContext";

export default function AdminOnaylar() {
    const { user } = useAuth();
    const [approvals, setApprovals]   = useState<any[]>([]);
    const [loading, setLoading]       = useState(true);
    const [filter, setFilter]         = useState<"all"|"pending"|"approved"|"rejected">("pending");
    const [expanded, setExpanded]     = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/approvals');
            setApprovals(await res.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApprovals(); }, []);

    const handleAction = async (approval: any, action: "approved" | "rejected") => {
        setActionLoading(approval.id);
        try {
            // Profil güncelleme talebi
            if (approval.type === "profile_update" || approval.type === "aidat_dekont") {
                await fetch('/api/approvals', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: approval.id, 
                        status: action,
                        resolvedBy: user?.displayName || user?.email || "Yönetici"
                    })
                });
                setSuccessMsg(action === "approved" ? "✅ İşlem onaylandı." : "❌ Talep reddedildi.");
            }

            // Gönüllü başvurusu
            if (approval.type === "volunteer_application") {
                const res = await fetch('/api/applications', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: approval.applicationId,
                        status: action,
                        approvalId: approval.id
                    })
                });
                const data = await res.json();
                if (action === "approved" && data.newMemberId) {
                    setSuccessMsg(`✅ Başvuru onaylandı! Yeni üye sisteme eklendi: ${data.newMemberId}`);
                } else {
                    setSuccessMsg("❌ Başvuru reddedildi.");
                }
            }

            setTimeout(() => setSuccessMsg(""), 5000);
            fetchApprovals();
        } finally {
            setActionLoading(null);
        }
    };

    const filtered    = approvals.filter(a => filter === "all" ? true : a.status === filter);
    const pendingCount = approvals.filter(a => a.status === "pending").length;

    const FIELD_LABELS: Record<string, string> = {
        isim: "Ad", soyisim: "Soyad", email: "E-posta", telefon: "Telefon",
        kan_grubu: "Kan Grubu", sehir: "Şehir", deneyim_notu: "Deneyim / Motivasyon",
        afad_cert: "AFAD Sertifikası", name: "Ad Soyad", phone: "Telefon",
        bloodType: "Kan Grubu", city: "Şehir", address: "Adres",
        yil: "Aidat Yılı", tutar: "Ödenen Tutar",
    };

    return (
        <div className="space-y-6 pb-20 max-w-4xl">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Bell className="text-red-500" size={26} /> Onay Merkezi
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">Gönüllü başvuruları ve profil güncelleme talepleri.</p>
                </div>
                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <span className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest rounded-xl">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            {pendingCount} Bekleyen
                        </span>
                    )}
                    <button onClick={fetchApprovals} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white rounded-xl transition-colors">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* BAŞARI MESAJI */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl border text-sm font-medium ${successMsg.startsWith("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                    >
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TİP FİLTRE + DURUM FİLTRE */}
            <div className="flex gap-2 border-b border-white/5">
                {(["pending", "approved", "rejected", "all"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${filter === f ? "border-red-500 text-red-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                    >
                        {f === "pending"  ? `Bekleyen${pendingCount > 0 ? ` (${pendingCount})` : ""}` :
                         f === "approved" ? "Onaylanan" : f === "rejected" ? "Reddedilen" : "Tümü"}
                    </button>
                ))}
            </div>

            {/* LİSTE */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={32} className="animate-spin text-neutral-700" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <ShieldCheck size={48} className="mx-auto text-emerald-500/20 mb-4" />
                    <p className="text-neutral-500 text-sm">
                        {filter === "pending" ? "Bekleyen talep yok. Sistem güncel." : "Bu kategoride kayıt bulunmuyor."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((a) => {
                        const meta = TYPE_META[a.type] || { label: a.type, color: "bg-neutral-800 text-neutral-400 border-white/5", icon: <FileText size={12} /> };
                        const isOpen = expanded === a.id;

                        return (
                            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-[#050B14] border border-white/5 rounded-2xl overflow-hidden"
                            >
                                {/* KART BAŞLIĞI */}
                                <button
                                    onClick={() => setExpanded(isOpen ? null : a.id)}
                                    className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-neutral-800 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <User size={16} className="text-neutral-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-white font-bold text-sm">{a.memberName || a.memberId || "Başvuran"}</p>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border flex items-center gap-1 ${meta.color}`}>
                                                    {meta.icon} {meta.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-neutral-600 flex items-center gap-1">
                                                    <Clock size={9} /> {new Date(a.createdAt).toLocaleString("tr-TR")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border ${STATUS_STYLE[a.status]}`}>
                                            {STATUS_LABEL[a.status]}
                                        </span>
                                        {isOpen ? <ChevronUp size={16} className="text-neutral-500" /> : <ChevronDown size={16} className="text-neutral-500" />}
                                    </div>
                                </button>

                                {/* DETAYLAR — Açılır */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            {/* VERİ ALANLARI */}
                                            {a.changes && (
                                                <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-white/5 pt-4">
                                                    {Object.entries(a.changes)
                                                        .filter(([k]) => !["avatar", "photo", "access_key", "dekont_url"].includes(k))
                                                        .map(([key, val]) => (
                                                            <div key={key} className={`bg-black/30 p-3 rounded-xl ${key === "deneyim_notu" || key === "notes" ? "col-span-2 md:col-span-3" : ""}`}>
                                                                <p className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest mb-1">
                                                                    {FIELD_LABELS[key] || key}
                                                                </p>
                                                                <p className="text-xs text-neutral-200 font-medium break-words">
                                                                    {String(val) === "on" ? "✓ Evet" : String(val) || "—"}
                                                                </p>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}

                                            {a.changes?.dekont_url && (
                                                <div className="mx-5 pb-4 mt-2">
                                                    <p className="text-[9px] text-neutral-600 uppercase font-bold tracking-widest mb-2">Yüklenen Dekont</p>
                                                    <img src={a.changes.dekont_url} alt="Dekont" className="max-w-full h-auto max-h-64 object-contain rounded-xl border border-white/10 shadow-lg" />
                                                </div>
                                            )}

                                            {a.resolvedBy && (
                                                <div className="mx-5 mb-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">İşlemi Yapan Yönetici</p>
                                                        <p className="text-xs text-white font-bold">{a.resolvedBy}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">İşlem Tarihi</p>
                                                        <p className="text-xs text-neutral-300 font-mono">{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString("tr-TR") : "—"}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* GÖNÜLLÜ BAŞVURUSU BİLGİ NOTU */}
                                            {a.type === "volunteer_application" && a.status === "pending" && (
                                                <div className="mx-5 mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                                    <p className="text-[11px] text-emerald-400/80">
                                                        <strong>Onayladığınızda:</strong> Bu kişi otomatik olarak sisteme <strong>Gönüllü Üye</strong> olarak eklenir ve üye portalına giriş yapabilir hale gelir.
                                                    </p>
                                                </div>
                                            )}

                                            {/* AKSIYON BUTONLARI */}
                                            {a.status === "pending" && (
                                                <div className="flex gap-3 p-4 bg-black/20 border-t border-white/5">
                                                    <button
                                                        onClick={() => handleAction(a, "approved")}
                                                        disabled={actionLoading === a.id}
                                                        className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === a.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                        {a.type === "volunteer_application" ? "Onayla & Üye Ekle" : "Onayla"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(a, "rejected")}
                                                        disabled={actionLoading === a.id}
                                                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle size={14} /> Reddet
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
