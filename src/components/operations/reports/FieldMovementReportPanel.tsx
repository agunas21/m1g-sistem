"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Footprints, ShieldAlert, Package, MapPin, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MovementReportEntry {
    memberId: string;
    fullName: string;
    totalDistanceKm: number | "YETERSİZ VERİ";
    isInsufficientData: boolean;
    gpsPointCount: number;
    discardedAnomalyPoints: number;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    assignedEquipment: { name: string; category: string; condition: string }[];
    hasAssignedEquipment: boolean;
}

interface FieldMovementReportData {
    operationId: string;
    entityType: string;
    totalMembersTracked: number;
    grandTotalPoints: number;
    grandTotalAnomalies: number;
    grandTotalDistanceKm: number;
    heatmapGrid: { lat: number; lng: number; weight: number }[];
    reports: MovementReportEntry[];
}

export default function FieldMovementReportPanel({ operationId }: { operationId: string }) {
    const [data, setData] = useState<FieldMovementReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entityType, setEntityType] = useState<"PERSONNEL" | "VEHICLE">("PERSONNEL");

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/operations/${operationId}/movement-report?entityType=${entityType}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
            } else {
                setError(result.error || "Rapor verileri alınamadı.");
            }
        } catch (err: any) {
            setError("Sunucu bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (operationId) {
            fetchReport();
        }
    }, [operationId, entityType]);

    const formatDate = (isoStr: string | null) => {
        if (!isoStr) return "-";
        try {
            const d = new Date(isoStr);
            return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('tr-TR') + ')';
        } catch {
            return isoStr;
        }
    };

    return (
        <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Footprints className="text-emerald-400" size={22} /> Saha Hareket & Ekipman Çapraz Raporu
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        Sadece GPS/Phone kaynaklı gerçek konum verilerinden (Haversine + Anomali Filtresi) üretilmiştir.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Entity Type Selector */}
                    <div className="bg-black/50 border border-white/10 rounded-xl p-1 flex gap-1 text-xs">
                        <button
                            onClick={() => setEntityType("PERSONNEL")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${entityType === "PERSONNEL" ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            👥 Personel Takip
                        </button>
                        <button
                            onClick={() => setEntityType("VEHICLE")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${entityType === "VEHICLE" ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                        >
                            🚛 Araç Takip
                        </button>
                    </div>

                    <button
                        onClick={fetchReport}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 rounded-xl transition-colors"
                        title="Raporu Yenile"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-neutral-400 text-xs font-mono animate-pulse flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="animate-spin text-emerald-400" size={24} />
                    <span>GPS Telemetri Verileri & Ekipmanlar Analiz Ediliyor...</span>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                </div>
            ) : !data || data.reports.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs bg-black/40 rounded-2xl border border-white/5 p-6">
                    <MapPin size={32} className="mx-auto mb-2 opacity-30 text-neutral-400" />
                    <p className="font-bold text-neutral-400">Görüntülenecek Gerçek GPS Konum Kaydı Bulunamadı</p>
                    <p className="text-[11px] text-neutral-600 mt-1">
                        Sistemde henüz confidence ≥ 0.5 olan GPS/PHONE konum verisi kaydedilmemiş.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Takip Edilen Varlık</span>
                            <span className="text-xl font-black text-white block mt-1">{data.totalMembersTracked} {entityType === "PERSONNEL" ? "Personel" : "Araç"}</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Toplam Kat Edilen Mesafe</span>
                            <span className="text-xl font-black text-emerald-400 block mt-1">{data.grandTotalDistanceKm} KM</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Toplam İşlenen GPS Noktası</span>
                            <span className="text-xl font-black text-blue-400 block mt-1">{data.grandTotalPoints} Nokta</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Filtrelenen GPS Anomali</span>
                            <span className="text-xl font-black text-amber-400 block mt-1">{data.grandTotalAnomalies} Sıçrama</span>
                        </div>
                    </div>

                    {/* Heatmap Grid Overview */}
                    {data.heatmapGrid.length > 0 && (
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={14} className="text-purple-400" /> Yoğunluk Haritası Grid Özeti (~11m Hassasiyet)
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">{data.heatmapGrid.length} Yoğunluk Hücresi</span>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {data.heatmapGrid.slice(0, 8).map((g, idx) => (
                                    <span key={idx} className="bg-purple-950/40 border border-purple-500/20 text-purple-300 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                                        📍 {g.lat}, {g.lng} (Ağırlık: {g.weight})
                                    </span>
                                ))}
                                {data.heatmapGrid.length > 8 && (
                                    <span className="text-[10px] text-neutral-500 font-mono self-center">
                                        +{data.heatmapGrid.length - 8} hücre daha
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Member Movement Reports List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Kişi Bazlı Detaylı Hareket & Zimmet Tablosu</h4>

                        <div className="grid grid-cols-1 gap-4">
                            {data.reports.map((report) => (
                                <motion.div
                                    key={report.memberId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-black/50 border border-white/5 hover:border-white/15 rounded-2xl p-5 space-y-4 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-white/5 pb-3">
                                        <div>
                                            <span className="text-sm font-bold text-white uppercase flex items-center gap-2">
                                                👤 {report.fullName}
                                            </span>
                                            <span className="text-[10px] text-neutral-500 font-mono">ID: {report.memberId}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {report.isInsufficientData ? (
                                                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                                    ⚠️ YETERSİZ GPS VERİSİ — MESAFE HESAPLANAMAZ
                                                </span>
                                            ) : (
                                                <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-black font-mono">
                                                    🚶 {report.totalDistanceKm} KM
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-mono">
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-[9px] text-neutral-500 uppercase block font-bold">GPS Noktası</span>
                                            <span className="text-white font-bold">{report.gpsPointCount} Veri Noktası</span>
                                        </div>
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-[9px] text-neutral-500 uppercase block font-bold">Anomali Filtrelendi</span>
                                            <span className="text-amber-400 font-bold">{report.discardedAnomalyPoints} Sıçrama</span>
                                        </div>
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-[9px] text-neutral-500 uppercase block font-bold">İlk Konum (DB)</span>
                                            <span className="text-neutral-300 font-bold">{formatDate(report.firstSeenAt)}</span>
                                        </div>
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-[9px] text-neutral-500 uppercase block font-bold">Son Konum (DB)</span>
                                            <span className="text-neutral-300 font-bold">{formatDate(report.lastSeenAt)}</span>
                                        </div>
                                    </div>

                                    {/* Equipment Section */}
                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                        <span className="text-[10px] text-neutral-400 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                                            <Package size={14} className="text-amber-500" /> Zimmetli Ekipman Durumu
                                        </span>

                                        {report.hasAssignedEquipment ? (
                                            <div className="flex flex-wrap gap-2">
                                                {report.assignedEquipment.map((eq, idx) => (
                                                    <span key={idx} className="bg-amber-950/30 border border-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-xl flex items-center gap-2">
                                                        <span>📦 {eq.name}</span>
                                                        <span className="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-neutral-400 uppercase font-mono">{eq.condition || 'Zimmetli'}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-neutral-500 italic bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                Zimmetli ekipman kaydı yok
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
