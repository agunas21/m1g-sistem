"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Activity, Radio, AlertTriangle, ShieldCheck, Zap, Crosshair, Map as MapIcon, Users, Clock } from 'lucide-react';

interface KavkasReportViewerProps {
    operation: any;
    reportType: string;
    reportContent: any;
    reportVersion: number;
    generatedAt: string;
}

export default function KavkasReportViewer({ operation, reportType, reportContent, reportVersion, generatedAt }: KavkasReportViewerProps) {
    const formatReportType = (type: string) => {
        const types: any = {
            'OPERASYONLAR': 'Operasyonlar Grubu Raporu',
            'PLANLAMA_SONUC': 'Planlama ve Sonuç Grubu Raporu',
            'MUHENDISLIK': 'Mühendislik Grubu Raporu',
            'GUVENLIK': 'Güvenlik Grubu Raporu',
            'LOJISTIK': 'Lojistik Grubu Raporu',
            'US_LOJISTIGI': 'Üs Lojistiği Raporu',
            'ULASTIRMA_ARAC_LOJISTIGI': 'Ulaştırma ve Araç Raporu'
        };
        return types[type] || type;
    };

    const formattedDate = new Date(generatedAt).toLocaleString('tr-TR');
    
    // Simulate events for the timeline
    const events = [
        { id: 1, time: "09:12:04", text: "Merkez üssünde toplanıldı.", type: "INFO" },
        { id: 2, time: "10:05:22", text: "Tim 1 enkaz bölgesine ulaştı.", type: "MOVE" },
        { id: 3, time: "10:45:11", text: "Bölge 4'te gaz sızıntısı uyarısı.", type: "ALERT" },
        { id: 4, time: "11:10:00", text: "Sağlık ekibi intikal etti.", type: "DEPLOY" },
        { id: 5, time: "12:00:30", text: "Görev durumu 'Aktif' olarak güncellendi.", type: "STATUS" },
        { id: 6, time: "13:15:44", text: "Lojistik destek talebi alındı.", type: "REQUEST" },
        { id: 7, time: "14:20:10", text: "Tüm ekiplerle iletişim doğrulandı.", type: "COMM" },
        { id: 8, time: "15:00:00", text: "Rapor üretimi tetiklendi.", type: "SYSTEM" },
    ];

    // Dark Military Dashboard View
    return (
        <div id="kavkas-report-content" className="bg-[#050B14] text-white p-6 relative mx-auto shadow-2xl font-mono flex flex-col" style={{ width: '1200px', height: '800px', overflow: 'hidden' }}>
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {/* Top Header / KPI Bar */}
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-600 rounded-sm flex items-center justify-center font-black text-xl border border-red-400">
                            M1G
                        </div>
                        <div>
                            <h1 className="font-black text-2xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">
                                {formatReportType(reportType)}
                            </h1>
                            <div className="flex gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                                <span><MapPin size={10} className="inline mr-1" /> {operation.location || 'BELİRTİLMEDİ'}</span>
                                <span><Clock size={10} className="inline mr-1" /> {formattedDate}</span>
                                <span>REV-{reportVersion}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* KPIs (Like Real-Time Dashboard in PDF) */}
                <div className="flex gap-4">
                    <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Activity size={10} /> Olay Sayısı
                        </div>
                        <div className="text-3xl font-black mt-1 text-white">{reportContent?.metrics?.totalEventsAnalyzed || events.length}</div>
                    </div>
                    <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                        <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={10} /> Kritik Uyarı
                        </div>
                        <div className="text-3xl font-black mt-1 text-amber-400">1</div>
                    </div>
                    <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Users size={10} /> Tim Sayısı
                        </div>
                        <div className="text-3xl font-black mt-1 text-green-400">{operation.teams?.length || 0}</div>
                    </div>
                    <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                        <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={10} /> Uyumluluk
                        </div>
                        <div className="text-3xl font-black mt-1 text-purple-400">%{reportVersion * 5 > 100 ? 100 : 70 + reportVersion * 5}</div>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="relative z-10 grid grid-cols-12 gap-6 flex-1 h-[600px]">
                
                {/* Left Panel: Event Timeline */}
                <div className="col-span-4 bg-[#0a1120] border border-white/10 rounded-xl p-4 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent"></div>
                    
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                        <Radio size={14} className="text-red-500 animate-pulse" />
                        Operasyon Kronolojisi
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                        {events.map((ev, i) => (
                            <div key={ev.id} className="relative pl-4">
                                {/* Line connector */}
                                {i !== events.length - 1 && (
                                    <div className="absolute left-[3px] top-4 w-px h-full bg-white/10"></div>
                                )}
                                {/* Dot */}
                                <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${
                                    ev.type === 'ALERT' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 
                                    ev.type === 'SYSTEM' ? 'bg-purple-500' :
                                    ev.type === 'MOVE' ? 'bg-blue-500' :
                                    'bg-white/40'
                                }`}></div>
                                
                                <div className="text-[10px] text-neutral-500 font-bold">{ev.time}</div>
                                <div className={`text-[11px] mt-0.5 ${ev.type === 'ALERT' ? 'text-amber-400 font-bold' : 'text-neutral-300'}`}>
                                    {ev.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Map & Analytics */}
                <div className="col-span-8 flex flex-col gap-4 h-full">
                    
                    {/* Visual Map Area */}
                    <div className="flex-1 bg-black border border-white/10 rounded-xl relative overflow-hidden group">
                        {/* Fake Topography / Grid lines to look like a military map */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #fff 49px, #fff 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #fff 49px, #fff 50px)' }}></div>
                        
                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="bg-black/60 backdrop-blur border border-white/20 text-[9px] px-2 py-1 rounded text-white flex items-center gap-1 font-bold">
                                <Crosshair size={10} className="text-red-500" /> LIVE TRACKING
                            </div>
                            <div className="bg-black/60 backdrop-blur border border-white/20 text-[9px] px-2 py-1 rounded text-green-400 flex items-center gap-1 font-bold">
                                SECURE CONNECTION
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 z-10 text-[9px] text-neutral-500 font-bold">
                            LAT: 39.925533 LNG: 32.866287 / GRID: 35T VK 72
                        </div>

                        {/* Faux map elements */}
                        <div className="absolute top-[40%] left-[30%] w-32 h-32 bg-blue-500/10 rounded-full border border-blue-500/30 animate-pulse"></div>
                        <div className="absolute top-[45%] left-[35%] w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                        <div className="absolute top-[42%] left-[37%] text-[10px] text-blue-300 font-bold">TİM-1</div>

                        <div className="absolute top-[60%] right-[20%] w-48 h-48 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <div className="absolute top-[65%] right-[25%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
                        <div className="absolute top-[62%] right-[27%] text-[10px] text-red-400 font-bold">KRİTİK BÖLGE</div>

                        {/* Trajectory Line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                            <path d="M 400 300 Q 500 200 700 450" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                    </div>

                    {/* Bottom Analytics Row */}
                    <div className="h-40 grid grid-cols-2 gap-4">
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 relative overflow-hidden">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Müdahale Zinciri</h4>
                            <div className="flex justify-between items-center h-16 relative">
                                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/10 -translate-y-1/2"></div>
                                <div className="relative z-10 bg-green-500/20 border border-green-500 text-green-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                    <Zap size={14} className="mb-0.5" />
                                    TESPİT
                                </div>
                                <div className="relative z-10 bg-blue-500/20 border border-blue-500 text-blue-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                    <Activity size={14} className="mb-0.5" />
                                    ÇIKIŞ
                                </div>
                                <div className="relative z-10 bg-amber-500/20 border border-amber-500 text-amber-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                    <MapPin size={14} className="mb-0.5" />
                                    VARIŞ
                                </div>
                                <div className="relative z-10 bg-purple-500/20 border border-purple-500 text-purple-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold text-center leading-tight">
                                    <ShieldCheck size={14} className="mb-0.5" />
                                    MÜDAHALE
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 flex flex-col">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Durum Özeti</h4>
                            <div className="text-[11px] text-neutral-300 leading-relaxed overflow-hidden">
                                {reportContent?.summary || "Saha unsurlarının intikali tamamlanmış olup, operasyon planlanan koordinatlarda aktif olarak sürmektedir. Herhangi bir kritik zayiat bildirilmemiştir. Lojistik akışı normal seyrinde devam etmektedir."}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Footer */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest border-t border-white/10 pt-3">
                <div>M1G SYSTEM KAVKAS - CONFIDENTIAL</div>
                <div>GENERATED VIA KAVKAS ENGINE v2.4</div>
            </div>

        </div>
    );
}
