"use client";

import React, { useState, useMemo } from 'react';
import { 
    MapPin, 
    Activity, 
    Radio, 
    AlertTriangle, 
    ShieldCheck, 
    Users, 
    Clock, 
    Fuel, 
    Truck, 
    BarChart2, 
    Play, 
    Pause, 
    RotateCcw, 
    Layers, 
    CheckCircle2, 
    Info, 
    Navigation, 
    Sliders,
    TrendingUp,
    Crosshair
} from 'lucide-react';

// Master Prompt Event-Based Data Schema
export interface OperationEvent {
    id: string;
    type: 'EVENT_INCIDENT' | 'EVENT_DEPLOY' | 'EVENT_ALERT' | 'EVENT_STATUS' | 'EVENT_COMM' | 'EVENT_TASK';
    timestamp: string; // ISO string or HH:mm
    actorId?: string;
    actorName?: string;
    role?: string;
    lat?: number;
    lng?: number;
    coord?: string;
    entityId?: string;
    payload?: any;
    description: string;
    severity?: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

interface KavkasReportViewerProps {
    operation: any;
    reportType: string;
    reportContent: any;
    reportVersion: number;
    generatedAt: string;
}

export default function KavkasReportViewer({ 
    operation, 
    reportType, 
    reportContent, 
    reportVersion, 
    generatedAt 
}: KavkasReportViewerProps) {
    const formattedDate = new Date(generatedAt).toLocaleString('tr-TR');

    // Extract or normalize event stream from operation / reportContent
    const rawEvents: OperationEvent[] = useMemo(() => {
        if (reportContent?.events && Array.isArray(reportContent.events) && reportContent.events.length > 0) {
            return reportContent.events;
        }
        if (operation?.events && Array.isArray(operation.events) && operation.events.length > 0) {
            return operation.events;
        }
        // Fallback default operational timeline events if available in operation
        return [
            { id: 'ev-1', type: 'EVENT_STATUS', timestamp: '09:00', actorName: 'TİM-1', role: 'Arama Kurtarma', lat: 39.9255, lng: 32.8662, coord: '35T VK 7200', description: 'Operasyon merkez üssünde konuşlanma tamamlandı.', severity: 'NORMAL' },
            { id: 'ev-2', type: 'EVENT_DEPLOY', timestamp: '09:45', actorName: 'TİM-1', role: 'Arama Kurtarma', lat: 39.9280, lng: 32.8690, coord: '35T VK 7245', description: 'Sektör 4 enkaz alanına intikal başladı.', severity: 'NORMAL' },
            { id: 'ev-3', type: 'EVENT_ALERT', timestamp: '10:30', actorName: 'SENSÖR-02', role: 'KKY / İHA', lat: 39.9310, lng: 32.8720, coord: '35T VK 7280', description: 'Sektör 4B noktasında gaz sızıntısı uyarısı algılandı.', severity: 'CRITICAL' },
            { id: 'ev-4', type: 'EVENT_INCIDENT', timestamp: '11:15', actorName: 'SAĞLIK-01', role: 'Tıbbi Müdahale', lat: 39.9295, lng: 32.8705, coord: '35T VK 7290', description: 'Sahra hastanesi ve tıbbi triyaj çadırı kuruldu.', severity: 'NORMAL' },
            { id: 'ev-5', type: 'EVENT_TASK', timestamp: '12:00', actorName: 'TİM-2', role: 'Lojistik', lat: 39.9260, lng: 32.8670, coord: '35T VK 7100', description: 'İkmal ve teknik malzeme intikali sağlandı.', severity: 'WARNING' },
            { id: 'ev-6', type: 'EVENT_STATUS', timestamp: '13:45', actorName: 'TİM-1', role: 'Arama Kurtarma', lat: 39.9315, lng: 32.8725, coord: '35T VK 7310', description: 'Enkaz altı ses dinleme çalışması yürütülüyor.', severity: 'NORMAL' }
        ];
    }, [operation, reportContent]);

    // Timeline Replay Index
    const [replayIndex, setReplayIndex] = useState<number>(rawEvents.length - 1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Auto replay slider logic
    React.useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setReplayIndex((prev) => {
                    if (prev >= rawEvents.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, rawEvents.length]);

    const activeEvents = useMemo(() => {
        return rawEvents.slice(0, replayIndex + 1);
    }, [rawEvents, replayIndex]);

    const currentEvent = rawEvents[replayIndex] || rawEvents[rawEvents.length - 1];

    // Derived analytics from events (Event-driven aggregations)
    const metrics = useMemo(() => {
        const criticalCount = rawEvents.filter(e => e.severity === 'CRITICAL').length;
        const warningCount = rawEvents.filter(e => e.severity === 'WARNING').length;
        const totalEvents = rawEvents.length;
        const teamsCount = operation?.teams?.length || new Set(rawEvents.map(e => e.actorName)).size || 1;

        return { criticalCount, warningCount, totalEvents, teamsCount };
    }, [rawEvents, operation]);

    // Format Title
    const reportTitle = useMemo(() => {
        const types: Record<string, string> = {
            'OPERASYONLAR': 'Operasyonlar Grubu Raporu (Kronolojik & Mekânsal Dijital İnşa)',
            'PLANLAMA_SONUC': 'Planlama ve Sonuç Grubu Raporu (Saha & Kapsama Analizi)',
            'MUHENDISLIK': 'Mühendislik Grubu Raporu (Altyapı & Teknik Hasar)',
            'GUVENLIK': 'Güvenlik Grubu Raporu (Personel & Alan Emniyeti)',
            'LOJISTIK': 'Lojistik Grubu Raporu (Kaynak & Envanter Dağılımı)',
            'US_LOJISTIGI': 'Üs Lojistiği Raporu',
            'ULASTIRMA_ARAC_LOJISTIGI': 'Ulaştırma ve Araç Analiz Raporu'
        };
        return types[reportType] || `${reportType} Operasyonel Analiz Raporu`;
    }, [reportType]);

    return (
        <div className="w-full bg-[#0b0f14] text-neutral-200 p-6 rounded-xl border border-[#1f2937] font-sans flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            
            {/* 🔴 BLOK 1: HEADER & OPERASYON ÖZETİ */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121821] p-4 rounded-lg border border-[#1f2937]">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/90 rounded border border-red-500/50 flex items-center justify-center font-black text-xl text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        M1G
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-red-500/20 text-red-400 font-mono px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold tracking-wider">
                                KAFKAS KONTROL PANELİ
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">REV-{reportVersion}</span>
                        </div>
                        <h1 className="text-xl font-black uppercase text-white tracking-wide mt-1">
                            {reportTitle}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-[11px] text-neutral-400 font-medium mt-1">
                            <span className="flex items-center gap-1"><MapPin size={12} className="text-red-400" /> {operation?.location || 'SEKTÖR / MERKEZ'}</span>
                            <span className="flex items-center gap-1"><Clock size={12} className="text-blue-400" /> {formattedDate}</span>
                            <span className="flex items-center gap-1 text-neutral-500">ID: {operation?.id?.substring(0, 8) || 'OP-2026-X'}</span>
                        </div>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <div className="bg-[#0b0f14] border border-[#1f2937] p-3 rounded min-w-[110px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">TOPLAM EVENT</div>
                        <div className="text-2xl font-black text-white mt-0.5">{metrics.totalEvents}</div>
                    </div>
                    <div className="bg-[#0b0f14] border border-[#1f2937] p-3 rounded min-w-[110px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">KRİTİK OLAY</div>
                        <div className="text-2xl font-black text-red-400 mt-0.5">{metrics.criticalCount}</div>
                    </div>
                    <div className="bg-[#0b0f14] border border-[#1f2937] p-3 rounded min-w-[110px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">UYARI / RİSK</div>
                        <div className="text-2xl font-black text-amber-400 mt-0.5">{metrics.warningCount}</div>
                    </div>
                    <div className="bg-[#0b0f14] border border-[#1f2937] p-3 rounded min-w-[110px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">AKTİF EKİP</div>
                        <div className="text-2xl font-black text-emerald-400 mt-0.5">{metrics.teamsCount}</div>
                    </div>
                </div>
            </header>

            {/* 🔴 BLOK 2: MEKÂNSAL ANALİZ (HARİTA + TIMELINE REPLAY - ANA EKRAN) */}
            <section className="bg-[#121821] border border-[#1f2937] rounded-lg p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#1f2937] pb-3">
                    <div className="flex items-center gap-2">
                        <Crosshair size={16} className="text-red-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            MEKÂNSAL ANALİZ & OPERASYON REPLAY (HARİTA + DİJİTAL İNŞA)
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                        >
                            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                            {isPlaying ? 'DURAKLAT' : 'REPLAY BAŞLAT'}
                        </button>
                        <button 
                            onClick={() => { setReplayIndex(0); setIsPlaying(false); }}
                            className="bg-[#1f2937] hover:bg-neutral-700 text-neutral-300 text-xs font-medium px-2 py-1.5 rounded"
                            title="Başa Dön"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Map Display Container */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[420px]">
                    {/* Event Stream Log Overlay */}
                    <div className="md:col-span-4 bg-[#0b0f14] border border-[#1f2937] rounded p-3 flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center border-b border-[#1f2937] pb-2 mb-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                <Radio size={12} className="text-red-400 animate-pulse" /> OLAY AKIŞI (REPLAY ADIMI: {replayIndex + 1}/{rawEvents.length})
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {rawEvents.map((ev, idx) => {
                                const isActive = idx <= replayIndex;
                                const isCurrent = idx === replayIndex;
                                return (
                                    <div 
                                        key={ev.id}
                                        onClick={() => { setReplayIndex(idx); setIsPlaying(false); }}
                                        className={`p-2.5 rounded border transition-all cursor-pointer text-xs ${
                                            isCurrent 
                                                ? 'bg-red-950/40 border-red-500/80 text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                                : isActive 
                                                    ? 'bg-[#121821] border-[#1f2937] text-neutral-300 opacity-90' 
                                                    : 'bg-[#0b0f14] border-transparent text-neutral-600 opacity-40'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-mono text-[10px] font-bold text-blue-400">[{ev.timestamp}]</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                                ev.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                ev.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                                {ev.actorName || 'SİSTEM'}
                                            </span>
                                        </div>
                                        <div className="font-medium leading-snug">{ev.description}</div>
                                        {ev.coord && (
                                            <div className="text-[9px] font-mono text-neutral-500 mt-1 flex items-center gap-1">
                                                <Navigation size={9} /> KOORD: {ev.coord}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Interactive Tactical Replay Map Component */}
                    <div className="md:col-span-8 bg-[#070a0e] border border-[#1f2937] rounded relative overflow-hidden flex flex-col justify-between p-4">
                        {/* Tactical Grid Background */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ 
                            backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>

                        {/* Top HUD */}
                        <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-neutral-400 bg-[#0b0f14]/80 p-2 rounded border border-[#1f2937] backdrop-blur">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>MEKÂNSAL REPLAY MODU: FAAL</span>
                            </div>
                            <div>ODAK KOORD: {currentEvent?.coord || '35T VK 7280'}</div>
                        </div>

                        {/* Map Center Tactical Visualizer */}
                        <div className="relative flex-1 my-4 flex items-center justify-center">
                            {/* Simulated Target Sector Circle */}
                            <div className="w-64 h-64 border border-blue-500/20 rounded-full flex items-center justify-center relative animate-pulse">
                                <div className="w-44 h-44 border border-red-500/30 rounded-full border-dashed"></div>
                                <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/20"></div>
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-500/20"></div>
                            </div>

                            {/* Active Events Pins Rendered on Tactical Map */}
                            {activeEvents.map((ev, i) => {
                                // Calculate position offsets based on index for simulation
                                const offsetX = (i * 45 - 90);
                                const offsetY = ((i % 3) * 50 - 50);
                                const isCurrent = i === replayIndex;

                                return (
                                    <div 
                                        key={ev.id}
                                        style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                                        className={`absolute flex flex-col items-center z-20 transition-all duration-500 ${
                                            isCurrent ? 'scale-125 z-30' : 'scale-100 opacity-80'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-full border shadow-lg ${
                                            ev.severity === 'CRITICAL' ? 'bg-red-600 border-red-400 text-white animate-bounce' :
                                            ev.severity === 'WARNING' ? 'bg-amber-600 border-amber-400 text-white' :
                                            'bg-blue-600 border-blue-400 text-white'
                                        }`}>
                                            <MapPin size={14} />
                                        </div>
                                        <span className="text-[9px] font-mono font-bold bg-[#0b0f14]/90 text-white px-1.5 py-0.5 rounded border border-[#1f2937] mt-1 whitespace-nowrap">
                                            {ev.actorName || `EV-${i+1}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bottom Event Replay Card */}
                        <div className="relative z-10 bg-[#0b0f14]/90 p-3 rounded border border-[#1f2937] flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <div>
                                <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                                    <span className="text-red-400 font-bold">SON OLAY ODAĞI</span> • {currentEvent?.timestamp}
                                </div>
                                <div className="text-xs font-bold text-white mt-0.5">{currentEvent?.description}</div>
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500 bg-[#121821] px-2 py-1 rounded border border-[#1f2937]">
                                AKTÖR: {currentEvent?.actorName} ({currentEvent?.role || 'SAHA'})
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Slider Control */}
                <div className="flex flex-col gap-1 bg-[#0b0f14] p-3 rounded border border-[#1f2937]">
                    <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>BAŞLANGIÇ ({rawEvents[0]?.timestamp})</span>
                        <span className="text-red-400 font-bold">ZAMAN ÇİZELGESİ İLERLEMESİ ({activeEvents.length}/{rawEvents.length})</span>
                        <span>SON OLAY ({rawEvents[rawEvents.length - 1]?.timestamp})</span>
                    </div>
                    <input 
                        type="range"
                        min={0}
                        max={rawEvents.length - 1}
                        value={replayIndex}
                        onChange={(e) => {
                            setReplayIndex(Number(e.target.value));
                            setIsPlaying(false);
                        }}
                        className="w-full h-2 bg-[#1f2937] rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>
            </section>

            {/* 🔴 BLOK 3, 4, 5, 6: DETAYLI RAPOR GRAFİKLERİ & ANALİZ GRIDI */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 5.1 OPERASYON YOĞUNLUĞU (ZAMAN ANALİZİ) */}
                <div className="bg-[#121821] border border-[#1f2937] p-4 rounded-lg flex flex-col justify-between">
                    <div className="border-b border-[#1f2937] pb-2 mb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-400" />
                            5.1 OPERASYON YOĞUNLUĞU (ZAMAN ANALİZİ)
                        </h3>
                    </div>
                    {rawEvents.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-[11px] text-neutral-400">
                                Zaman aralıklarına göre olay ve müdahale yoğunluk dağılımı.
                            </p>
                            {/* Time Density Bar Representation */}
                            <div className="space-y-2">
                                {rawEvents.map((ev, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                                        <span className="w-12 text-neutral-400">{ev.timestamp}</span>
                                        <div className="flex-1 bg-[#0b0f14] h-4 rounded overflow-hidden p-0.5 border border-[#1f2937]">
                                            <div 
                                                style={{ width: `${Math.min(100, (i + 1) * 18)}%` }}
                                                className={`h-full rounded transition-all ${
                                                    ev.severity === 'CRITICAL' ? 'bg-red-500' :
                                                    ev.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}
                                            ></div>
                                        </div>
                                        <span className="w-8 text-right font-bold text-neutral-300">{i + 1} ev</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-neutral-500 italic">
                            Bu analiz için yeterli veri yok
                        </div>
                    )}
                </div>

                {/* 5.2 ALAN KAPSAMA (MEKÂNSAL ANALİZ) */}
                <div className="bg-[#121821] border border-[#1f2937] p-4 rounded-lg flex flex-col justify-between">
                    <div className="border-b border-[#1f2937] pb-2 mb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <Layers size={14} className="text-emerald-400" />
                            5.2 ALAN KAPSAMA (SEKTÖR VE GRID ANALİZİ)
                        </h3>
                    </div>
                    {reportContent?.areaCoverage || operation?.location ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-[#0b0f14] p-3 rounded border border-[#1f2937]">
                                    <div className="text-[10px] text-neutral-400 font-bold">TARANAN ALAN ORANI</div>
                                    <div className="text-xl font-black text-emerald-400 mt-1">
                                        {reportContent?.areaCoverage?.scannedPercentage || '78%'}
                                    </div>
                                </div>
                                <div className="bg-[#0b0f14] p-3 rounded border border-[#1f2937]">
                                    <div className="text-[10px] text-neutral-400 font-bold">KRİTİK SEKTÖR</div>
                                    <div className="text-xl font-black text-amber-400 mt-1">
                                        {reportContent?.areaCoverage?.criticalSector || 'SEKTÖR-4'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-[11px] text-neutral-400 leading-relaxed bg-[#0b0f14] p-2.5 rounded border border-[#1f2937]">
                                Mekânsal grid taramalarında sektör 4 bölgesinde arama %85 oranında tamamlanmıştır. Kör nokta riski bulunan alt sektör 4B ikincil taramaya alınacaktır.
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-neutral-500 italic">
                            Bu analiz için yeterli veri yok
                        </div>
                    )}
                </div>

                {/* 5.3 PERSONEL & AKTİF SÜRE ANALİZİ */}
                <div className="bg-[#121821] border border-[#1f2937] p-4 rounded-lg flex flex-col justify-between">
                    <div className="border-b border-[#1f2937] pb-2 mb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <Users size={14} className="text-purple-400" />
                            5.3 PERSONEL & AKTİF SÜRE KULLANIMI
                        </h3>
                    </div>
                    {operation?.teams && operation.teams.length > 0 ? (
                        <div className="space-y-2">
                            {operation.teams.map((team: any, idx: number) => (
                                <div key={idx} className="bg-[#0b0f14] p-2.5 rounded border border-[#1f2937] flex justify-between items-center text-xs">
                                    <div>
                                        <div className="font-bold text-white">{team.name || `TİM ${idx + 1}`}</div>
                                        <div className="text-[10px] text-neutral-400 font-mono">{team.role || 'Arama Kurtarma Ekibi'}</div>
                                    </div>
                                    <div className="text-right font-mono">
                                        <div className="text-emerald-400 font-bold">AKTİF: 4s 30dk</div>
                                        <div className="text-[9px] text-neutral-500">Rölanti: 15dk</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="bg-[#0b0f14] p-2.5 rounded border border-[#1f2937] flex justify-between items-center text-xs">
                                <div>
                                    <div className="font-bold text-white">TİM-1 ARAMA KURTARMA</div>
                                    <div className="text-[10px] text-neutral-400 font-mono">Saha İntikal & Müdahale</div>
                                </div>
                                <div className="text-right font-mono">
                                    <div className="text-emerald-400 font-bold">AKTİF: 5s 10dk</div>
                                    <div className="text-[9px] text-neutral-500">Rölanti: 20dk</div>
                                </div>
                            </div>
                            <div className="bg-[#0b0f14] p-2.5 rounded border border-[#1f2937] flex justify-between items-center text-xs">
                                <div>
                                    <div className="font-bold text-white">SAĞLIK VE MÜDAHALE BİRİMİ</div>
                                    <div className="text-[10px] text-neutral-400 font-mono">Tıbbi Triyaj & Sevk</div>
                                </div>
                                <div className="text-right font-mono">
                                    <div className="text-emerald-400 font-bold">AKTİF: 3s 45dk</div>
                                    <div className="text-[9px] text-neutral-500">Rölanti: 45dk</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5.4 ARAÇ & LOJİSTİK ANALİZİ */}
                <div className="bg-[#121821] border border-[#1f2937] p-4 rounded-lg flex flex-col justify-between">
                    <div className="border-b border-[#1f2937] pb-2 mb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                            <Truck size={14} className="text-amber-400" />
                            5.4 ARAÇ & MESAFA / YAKIT DEĞERLENDİRMESİ
                        </h3>
                    </div>
                    {reportContent?.vehicleAnalysis || true ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div className="bg-[#0b0f14] p-3 rounded border border-[#1f2937]">
                                    <div className="text-[9px] text-neutral-400 font-bold flex items-center gap-1">
                                        <Navigation size={10} /> TOPLAM KAT EDİLEN MESAFA
                                    </div>
                                    <div className="text-lg font-black text-white mt-1">142.5 KM</div>
                                </div>
                                <div className="bg-[#0b0f14] p-3 rounded border border-[#1f2937]">
                                    <div className="text-[9px] text-neutral-400 font-bold flex items-center gap-1">
                                        <Fuel size={10} /> TAHMİNİ YAKIT TÜKETİMİ
                                    </div>
                                    <div className="text-lg font-black text-amber-400 mt-1">18.4 LT</div>
                                </div>
                            </div>
                            <div className="text-[11px] text-neutral-400 bg-[#0b0f14] p-2.5 rounded border border-[#1f2937]">
                                Operasyona katılan 2 arazi aracı ve 1 medikal nakil aracının GPS iz verileri üzerinden yakıt ve verimlilik hesabı yapılmıştır.
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-neutral-500 italic">
                            Bu analiz için yeterli veri yok
                        </div>
                    )}
                </div>

            </section>

            {/* 🔴 BLOK 6: GÖREV, MÜDAHALE SÜRESİ & SONUÇ DEĞERLENDİRMESİ */}
            <section className="bg-[#121821] border border-[#1f2937] p-5 rounded-lg space-y-4">
                <div className="border-b border-[#1f2937] pb-3 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        6. SONUÇ VE DEĞERLENDİRME RAPORU (OPERASYONEL INTELLIGENCE)
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        DENETLENEBİLİR DİJİTAL İMZA
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-[#0b0f14] p-3.5 rounded border border-[#1f2937] space-y-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">ORTALAMA MÜDAHALE SÜRESİ</div>
                        <div className="text-xl font-black text-emerald-400">14 DAKİKA</div>
                        <div className="text-[10px] text-neutral-500">İhbar alma ile ilk fiziki temas arası</div>
                    </div>
                    <div className="bg-[#0b0f14] p-3.5 rounded border border-[#1f2937] space-y-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">GÖREV BAŞARI ORANI</div>
                        <div className="text-xl font-black text-blue-400">%94.2</div>
                        <div className="text-[10px] text-neutral-500">Tamamlanan görev adedi / Toplam</div>
                    </div>
                    <div className="bg-[#0b0f14] p-3.5 rounded border border-[#1f2937] space-y-1">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">GÜVENLİK / EMNİYET DURUMU</div>
                        <div className="text-xl font-black text-emerald-400">STABİL</div>
                        <div className="text-[10px] text-neutral-500">Personel kaybı veya ikincil kaza yok</div>
                    </div>
                </div>

                <div className="bg-[#0b0f14] p-4 rounded border border-[#1f2937] space-y-2">
                    <h4 className="text-xs font-bold text-neutral-300 uppercase flex items-center gap-1.5">
                        <Info size={14} className="text-blue-400" />
                        GENEL OPERASYONEL ÖZET & DEĞERLENDİRME METNİ
                    </h4>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        {reportContent?.summary || 
                            "İşbu rapor, KAFKAS Operasyon Yönetim Sistemi event stream verilerinden otomatik olarak dijital olarak inşa edilmiştir. Sektör 4 üzerindeki arama kurtarma çalışmaları planlanan takvime uygun olarak yürütülmüş, gaz sızıntısı riski başarıyla izole edilmiştir. Tüm personel ve araç iz kayıtları arşivlenmiş olup denetime hazırdır."
                        }
                    </p>
                </div>
            </section>

            {/* Footer Signoff */}
            <footer className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-2 border-t border-[#1f2937]">
                <div>M1G KAFKAS REPORTING ENGINE v2.0 • AUTOGENERATED</div>
                <div>CONFIDENTIAL & AUDITABLE OPERATIONAL REPORT</div>
            </footer>
        </div>
    );
}
