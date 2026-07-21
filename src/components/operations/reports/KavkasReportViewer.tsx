"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Activity, Radio, AlertTriangle, ShieldCheck, Zap, Crosshair, Map as MapIcon, Users, Clock, Flame, Navigation, Anchor, Fuel, Truck, BarChart2 } from 'lucide-react';

interface KavkasReportViewerProps {
    operation: any;
    reportType: string;
    reportContent: any;
    reportVersion: number;
    generatedAt: string;
}

export default function KavkasReportViewer({ operation, reportType, reportContent, reportVersion, generatedAt }: KavkasReportViewerProps) {
    const formattedDate = new Date(generatedAt).toLocaleString('tr-TR');

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

    const renderHeader = (title: string, metrics: React.ReactNode) => (
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-sm flex items-center justify-center font-black text-xl border border-red-400">
                        M1G
                    </div>
                    <div>
                        <h1 className="font-black text-2xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">
                            {title}
                        </h1>
                        <div className="flex gap-4 text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            <span><MapPin size={10} className="inline mr-1" /> {operation.location || 'BELİRTİLMEDİ'}</span>
                            <span><Clock size={10} className="inline mr-1" /> {formattedDate}</span>
                            <span>REV-{reportVersion}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* KPIs */}
            <div className="flex gap-4">
                {metrics}
            </div>
        </div>
    );

    // 1. ANA RAPOR (OPERASYON KRONOLOJİSİ)
    const renderOperationsChronology = () => {
        const events = [
            { id: 1, time: "09:12", coord: "35T VK 7200", text: "Merkez üssünde toplanıldı.", type: "INFO", unit: "ALL" },
            { id: 2, time: "10:05", coord: "35T VK 7245", text: "Tim 1 enkaz bölgesine intikal etti.", type: "MOVE", unit: "TİM-1" },
            { id: 3, time: "10:45", coord: "35T VK 7280", text: "Bölge 4'te gaz sızıntısı uyarısı.", type: "ALERT", unit: "SENSÖR" },
            { id: 4, time: "11:10", coord: "35T VK 7290", text: "Sağlık ekibi konuşlandı.", type: "DEPLOY", unit: "SAĞLIK" },
            { id: 5, time: "12:00", coord: "35T VK 7300", text: "Görev durumu 'Aktif' olarak güncellendi.", type: "STATUS", unit: "TİM-1" },
            { id: 6, time: "13:15", coord: "35T VK 7100", text: "Lojistik destek (su/gıda) talebi.", type: "REQUEST", unit: "TİM-2" },
            { id: 7, time: "14:20", coord: "35T VK 7255", text: "Kurtarma operasyonu başladı.", type: "ACTION", unit: "TİM-1" },
        ];

        return (
            <>
                {renderHeader(formatReportType(reportType), (
                    <>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity size={10} /> Aktif Olay
                            </div>
                            <div className="text-3xl font-black mt-1 text-white">{events.length}</div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <AlertTriangle size={10} /> Kritik Zayiat
                            </div>
                            <div className="text-3xl font-black mt-1 text-amber-400">0</div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Users size={10} /> Aktif Tim
                            </div>
                            <div className="text-3xl font-black mt-1 text-green-400">{operation.teams?.length || 2}</div>
                        </div>
                    </>
                ))}
                
                <div className="relative z-10 flex-1 flex flex-col gap-4 h-[600px]">
                    
                    {/* Top Row: Event List & Tactical Map */}
                    <div className="flex-1 flex gap-4 h-[420px]">
                        
                        {/* Event List (Data-driven panel) */}
                        <div className="w-80 bg-[#0a1120] border border-white/10 rounded-xl flex flex-col overflow-hidden">
                            <div className="bg-white/5 p-3 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-300 flex items-center gap-2">
                                    <Radio size={12} className="text-red-500 animate-pulse" />
                                    Olay Akışı (Log)
                                </h3>
                                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">REC</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {events.map((ev, i) => (
                                    <div key={ev.id} className="p-2 hover:bg-white/5 rounded border border-transparent hover:border-white/10 transition-colors cursor-default group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-blue-400">[{ev.time}]</span>
                                            <span className="text-[8px] font-mono text-neutral-500 border border-neutral-700 px-1 rounded">{ev.unit}</span>
                                        </div>
                                        <div className={`text-[10px] leading-tight ${ev.type === 'ALERT' ? 'text-amber-400 font-bold' : 'text-neutral-300'}`}>
                                            {ev.text}
                                        </div>
                                        <div className="text-[8px] font-mono text-neutral-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            GEO: {ev.coord}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tactical Map (Focus Area) */}
                        <div className="flex-1 bg-[#111820] border border-white/10 rounded-xl relative overflow-hidden">
                            {/* Terrain/Topo Texture */}
                            <div className="absolute inset-0 opacity-30" style={{ 
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
                                backgroundSize: '200px 200px'
                            }}></div>
                            {/* Grid Overlay */}
                            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #60a5fa 49px, #60a5fa 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #60a5fa 49px, #60a5fa 50px)' }}></div>
                            
                            {/* HUD Overlays */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="bg-black/80 backdrop-blur border border-blue-500/50 text-[9px] px-2 py-1 text-blue-400 flex items-center gap-1 font-bold">
                                    <MapPin size={10} /> SECTOR 4 - GRID ALPHA
                                </div>
                                <div className="bg-black/80 backdrop-blur border border-green-500/50 text-[9px] px-2 py-1 text-green-400 flex items-center gap-1 font-bold">
                                    SECURE LINK
                                </div>
                            </div>
                            
                            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 text-[8px] font-mono text-neutral-500">
                                <div>SCALE 1:5000</div>
                                <div>COORD: 39.9255° N, 32.8662° E</div>
                            </div>

                            {/* TACTICAL ELEMENTS */}
                            
                            {/* Base Camp */}
                            <div className="absolute top-[20%] left-[15%] flex flex-col items-center z-20">
                                <div className="w-8 h-6 border-2 border-blue-500 flex items-center justify-center bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                    <span className="text-[10px] font-bold text-blue-400">HQ</span>
                                </div>
                                <span className="text-[8px] font-bold mt-1 bg-black/60 px-1 rounded text-blue-300">MERKEZ ÜS</span>
                            </div>

                            {/* Team 1 */}
                            <div className="absolute top-[45%] left-[40%] flex flex-col items-center z-20">
                                <div className="w-6 h-6 border-2 border-blue-400 flex items-center justify-center bg-blue-400/20 backdrop-blur-sm">
                                    <Users size={12} className="text-blue-400" />
                                </div>
                                <span className="text-[8px] font-bold mt-1 bg-black/60 px-1 rounded text-blue-300">TİM-1</span>
                            </div>

                            {/* Medical Team */}
                            <div className="absolute top-[35%] left-[45%] flex flex-col items-center z-20">
                                <div className="w-6 h-6 border-2 border-blue-400 flex items-center justify-center bg-blue-400/20 rounded-full backdrop-blur-sm">
                                    <span className="text-[12px] font-bold text-blue-400">+</span>
                                </div>
                                <span className="text-[8px] font-bold mt-1 bg-black/60 px-1 rounded text-blue-300">SAĞLIK</span>
                            </div>

                            {/* Alert/Hazard Area (Red polygon) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                <polygon points="500,250 550,220 620,260 600,320 520,300" fill="rgba(239, 68, 68, 0.15)" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="2" strokeDasharray="4 2" />
                            </svg>
                            <div className="absolute top-[48%] left-[65%] flex flex-col items-center z-20 animate-pulse">
                                <AlertTriangle size={16} className="text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,1)]" />
                                <span className="text-[8px] font-bold mt-1 bg-black/60 px-1 rounded text-red-400 border border-red-500/30">GAZ SIZINTISI</span>
                            </div>

                            {/* Movement Arrows (Red Tactical Arrows) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                                <defs>
                                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                                    </marker>
                                </defs>
                                {/* HQ to Tim 1 */}
                                <path d="M 160 130 Q 250 150 310 250" fill="none" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                                {/* Tim 1 to Hazard */}
                                <path d="M 330 270 Q 400 280 490 270" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                                {/* Medical to Tim 1 */}
                                <path d="M 360 210 Q 350 230 335 250" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 2" markerEnd="url(#arrow)" />
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Row: Horizontal Gantt/Timeline (StackFrame style) */}
                    <div className="bg-[#0a1120] border border-white/10 rounded-xl h-36 flex flex-col overflow-hidden relative">
                        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center shrink-0">
                            <span className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">Operasyon Görev & Zaman Çizelgesi</span>
                        </div>
                        <div className="flex-1 relative overflow-hidden p-2 custom-scrollbar">
                            
                            {/* Time Axis Header */}
                            <div className="absolute top-0 left-[150px] right-0 flex text-[8px] font-mono text-neutral-500 border-b border-white/5 pb-1">
                                <div className="flex-1">09:00</div>
                                <div className="flex-1">10:00</div>
                                <div className="flex-1">11:00</div>
                                <div className="flex-1">12:00</div>
                                <div className="flex-1">13:00</div>
                                <div className="flex-1">14:00</div>
                            </div>

                            {/* Gantt Rows */}
                            <div className="mt-5 space-y-2">
                                {/* Row 1 */}
                                <div className="flex items-center text-[9px] font-bold text-neutral-300">
                                    <div className="w-[140px] truncate shrink-0 px-2 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-blue-500"></div> TİM-1 HAREKETİ
                                    </div>
                                    <div className="flex-1 relative h-4 bg-white/5 rounded-sm">
                                        <div className="absolute top-0 bottom-0 left-[10%] w-[35%] bg-blue-500/80 rounded-sm border border-blue-400 flex items-center px-1 text-[7px] text-white overflow-hidden shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                                            İNTİKAL & ARAMA
                                        </div>
                                        <div className="absolute top-0 bottom-0 left-[55%] w-[40%] bg-blue-500/80 rounded-sm border border-blue-400 flex items-center px-1 text-[7px] text-white overflow-hidden shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                                            KURTARMA OPERASYONU
                                        </div>
                                    </div>
                                </div>
                                {/* Row 2 */}
                                <div className="flex items-center text-[9px] font-bold text-neutral-300">
                                    <div className="w-[140px] truncate shrink-0 px-2 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> SAĞLIK BİRİMİ
                                    </div>
                                    <div className="flex-1 relative h-4 bg-white/5 rounded-sm">
                                        <div className="absolute top-0 bottom-0 left-[35%] w-[60%] bg-amber-500/80 rounded-sm border border-amber-400 flex items-center px-1 text-[7px] text-white overflow-hidden">
                                            SAHADA HAZIR BEKLEME
                                        </div>
                                    </div>
                                </div>
                                {/* Row 3 */}
                                <div className="flex items-center text-[9px] font-bold text-neutral-300">
                                    <div className="w-[140px] truncate shrink-0 px-2 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-red-500"></div> KRİTİK OLAYLAR
                                    </div>
                                    <div className="flex-1 relative h-4 border-b border-white/10">
                                        {/* Event Markers on Timeline */}
                                        <div className="absolute top-1 left-[29%] flex flex-col items-center transform -translate-x-1/2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,1)]"></div>
                                            <div className="text-[6px] text-red-400 mt-0.5 whitespace-nowrap">GAZ SIZINTISI</div>
                                        </div>
                                        <div className="absolute top-1 left-[70%] flex flex-col items-center transform -translate-x-1/2">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <div className="text-[6px] text-purple-400 mt-0.5 whitespace-nowrap">LOJİSTİK DESTEK</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Current Time Indicator Line */}
                            <div className="absolute top-0 bottom-0 left-[85%] w-px bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)] z-10">
                                <div className="absolute -top-1 -translate-x-1/2 text-[7px] bg-red-500 text-white px-1 rounded">ŞU AN</div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // 2. ALAN KAPSAMA RAPORU (HEATMAP)
    const renderAreaCoverageReport = () => {
        return (
            <>
                {renderHeader(formatReportType(reportType), (
                    <>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Crosshair size={10} /> Toplam Tarama
                            </div>
                            <div className="text-3xl font-black mt-1 text-white">4.2<span className="text-sm">km²</span></div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <MapIcon size={10} /> Hedef Kapsama
                            </div>
                            <div className="text-3xl font-black mt-1 text-purple-400">%85</div>
                        </div>
                    </>
                ))}
                
                <div className="relative z-10 flex-1 h-[600px] flex flex-col gap-6">
                    <div className="flex-1 bg-[#0a1120] border border-white/10 rounded-xl p-6 flex flex-col relative overflow-hidden">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4">Alan Tarama Isı Haritası (Heatmap)</h3>
                        
                        {/* Heatmap Simulation */}
                        <div className="flex-1 bg-black border border-white/10 rounded-lg relative overflow-hidden flex items-center justify-center">
                            {/* Fake grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, #fff 29px, #fff 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, #fff 29px, #fff 30px)' }}></div>
                            
                            {/* Heat blobs */}
                            <div className="absolute w-[400px] h-[300px] bg-red-600 rounded-full blur-[80px] opacity-40 mix-blend-screen translate-x-[-100px] translate-y-[-50px]"></div>
                            <div className="absolute w-[300px] h-[200px] bg-amber-500 rounded-full blur-[60px] opacity-50 mix-blend-screen translate-x-[150px] translate-y-[100px]"></div>
                            <div className="absolute w-[200px] h-[200px] bg-blue-500 rounded-full blur-[50px] opacity-30 mix-blend-screen translate-x-[50px] translate-y-[50px]"></div>
                            
                            {/* Overlay data */}
                            <div className="absolute top-10 left-10 text-[10px] font-bold text-white bg-black/50 px-2 py-1 border border-red-500 rounded">
                                ZONE ALPHA: YÜKSEK YOĞUNLUK
                            </div>
                            <div className="absolute bottom-20 right-20 text-[10px] font-bold text-white bg-black/50 px-2 py-1 border border-amber-500 rounded">
                                ZONE BETA: ORTA YOĞUNLUK
                            </div>
                        </div>
                    </div>

                    <div className="h-48 grid grid-cols-3 gap-6">
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Taranmamış (Kör) Noktalar</h4>
                            <ul className="space-y-3">
                                <li className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                                    <span className="text-neutral-300">SEKTÖR 4 - KUZEY</span>
                                    <span className="text-red-400 font-bold">RİSK YÜKSEK</span>
                                </li>
                                <li className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2">
                                    <span className="text-neutral-300">SEKTÖR 7 - VADİ</span>
                                    <span className="text-amber-400 font-bold">ULAŞIM ZOR</span>
                                </li>
                            </ul>
                        </div>
                        <div className="col-span-2 bg-[#0a1120] border border-white/10 rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Tarama İlerlemesi (Bölge Bazlı)</h4>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>BÖLGE 1 (MERKEZ)</span><span>%95</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[95%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>BÖLGE 2 (KUZEY)</span><span>%60</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[60%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>BÖLGE 3 (GÜNEY KIRSAL)</span><span>%20</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[20%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // 3. PERSONEL FAALİYET RAPORU (GÜVENLİK vb.)
    const renderPersonnelActivityReport = () => {
        return (
            <>
                {renderHeader(formatReportType(reportType), (
                    <>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Users size={10} /> Toplam Personel
                            </div>
                            <div className="text-3xl font-black mt-1 text-white">24</div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity size={10} /> Ortalama Aktif
                            </div>
                            <div className="text-3xl font-black mt-1 text-green-400">4.2<span className="text-sm">s</span></div>
                        </div>
                    </>
                ))}
                
                <div className="relative z-10 flex-1 h-[600px] flex flex-col gap-6">
                    {/* Gantt Chart / Workforce Timeline */}
                    <div className="bg-[#0a1120] border border-white/10 rounded-xl p-6 flex flex-col h-[400px]">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                            <Clock size={14} className="text-blue-500" />
                            Personel Faaliyet Zaman Çizelgesi (Workforce Timeline)
                        </h3>
                        
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <div className="min-w-[700px]">
                                {/* Timeline Header */}
                                <div className="flex text-[9px] font-bold text-neutral-500 border-b border-white/10 pb-2 mb-4 pl-32">
                                    <div className="flex-1 text-left">08:00</div>
                                    <div className="flex-1 text-left">10:00</div>
                                    <div className="flex-1 text-left">12:00</div>
                                    <div className="flex-1 text-left">14:00</div>
                                    <div className="flex-1 text-left">16:00</div>
                                </div>
                                
                                {/* Rows */}
                                {[
                                    { name: "Ahmet Yılmaz", role: "Arama Kurtarma", bars: [{ left: '10%', width: '40%', color: 'bg-green-500' }, { left: '60%', width: '30%', color: 'bg-green-500' }] },
                                    { name: "Ayşe Demir", role: "Sağlık", bars: [{ left: '20%', width: '60%', color: 'bg-blue-500' }] },
                                    { name: "Mehmet Kaya", role: "Lojistik", bars: [{ left: '0%', width: '100%', color: 'bg-purple-500' }] },
                                    { name: "Zeynep Çelik", role: "Güvenlik", bars: [{ left: '10%', width: '20%', color: 'bg-amber-500' }, { left: '40%', width: '50%', color: 'bg-amber-500' }] },
                                    { name: "Can Polat", role: "K9 Birimi", bars: [{ left: '30%', width: '20%', color: 'bg-red-500' }] },
                                ].map((person, idx) => (
                                    <div key={idx} className="flex items-center mb-4">
                                        <div className="w-32 pr-4 text-right">
                                            <div className="text-[11px] font-bold text-white">{person.name}</div>
                                            <div className="text-[9px] text-neutral-500">{person.role}</div>
                                        </div>
                                        <div className="flex-1 h-6 bg-black/50 rounded overflow-hidden relative border border-white/5">
                                            {person.bars.map((bar, i) => (
                                                <div key={i} className={`absolute top-1 bottom-1 rounded-sm ${bar.color} opacity-80`} style={{ left: bar.left, width: bar.width }}></div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-6">
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Rol Bazlı Performans</h4>
                            <div className="flex items-end gap-2 h-24 mt-4 px-4 border-b border-white/10 pb-2">
                                <div className="flex-1 flex flex-col justify-end items-center gap-2 group">
                                    <div className="w-full bg-green-500/50 hover:bg-green-400 transition-colors rounded-t" style={{ height: '80%' }}></div>
                                    <span className="text-[8px] font-bold text-neutral-400 text-center uppercase">Kurtarma</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-end items-center gap-2 group">
                                    <div className="w-full bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t" style={{ height: '60%' }}></div>
                                    <span className="text-[8px] font-bold text-neutral-400 text-center uppercase">Sağlık</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-end items-center gap-2 group">
                                    <div className="w-full bg-purple-500/50 hover:bg-purple-400 transition-colors rounded-t" style={{ height: '95%' }}></div>
                                    <span className="text-[8px] font-bold text-neutral-400 text-center uppercase">Lojistik</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-end items-center gap-2 group">
                                    <div className="w-full bg-red-500/50 hover:bg-red-400 transition-colors rounded-t" style={{ height: '40%' }}></div>
                                    <span className="text-[8px] font-bold text-neutral-400 text-center uppercase">Güvenlik</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Bekleme (Idle) Süreleri</h4>
                            <ul className="space-y-3 mt-4">
                                <li className="flex justify-between items-center bg-red-500/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-300">
                                    <span>K9 BİRİMİ - CAN POLAT</span>
                                    <span className="font-bold bg-red-500/20 px-2 py-0.5 rounded text-red-400">4s 20dk BEKLEME</span>
                                </li>
                                <li className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 rounded p-2 text-[10px] font-mono text-amber-300">
                                    <span>GÜVENLİK TİMİ B</span>
                                    <span className="font-bold bg-amber-500/20 px-2 py-0.5 rounded text-amber-400">2s 15dk BEKLEME</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // 4. ARAÇ VE LOJİSTİK RAPORU
    const renderVehicleLogisticsReport = () => {
        return (
            <>
                {renderHeader(formatReportType(reportType), (
                    <>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Fuel size={10} /> Tahmini Yakıt
                            </div>
                            <div className="text-3xl font-black mt-1 text-amber-400">284<span className="text-sm">L</span></div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Navigation size={10} /> Toplam Mesafe
                            </div>
                            <div className="text-3xl font-black mt-1 text-white">1,240<span className="text-sm">km</span></div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Truck size={10} /> Aktif Araç
                            </div>
                            <div className="text-3xl font-black mt-1 text-green-400">8<span className="text-sm">/12</span></div>
                        </div>
                    </>
                ))}
                
                <div className="relative z-10 grid grid-cols-12 gap-6 flex-1 h-[600px]">
                    {/* Left: Charts */}
                    <div className="col-span-5 flex flex-col gap-6 h-full">
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 flex-1">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                <BarChart2 size={14} className="text-purple-500" /> Yakıt Tüketimi (Litre/Saat)
                            </h3>
                            {/* Line Chart Simulation */}
                            <div className="h-40 w-full relative mt-4 border-b border-l border-white/20">
                                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <polyline points="0,150 50,120 100,130 150,80 200,90 250,40 300,50 350,10" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinejoin="round" />
                                    <polyline points="0,150 50,120 100,130 150,80 200,90 250,40 300,50 350,10 350,160 0,160" fill="rgba(168,85,247,0.1)" stroke="none" />
                                </svg>
                                <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between text-[8px] text-neutral-500">
                                    <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 flex-1">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4">Araç Bazlı Kilometre</h3>
                            <div className="space-y-3 mt-4">
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>34 M1G 01 (Kurtarma)</span><span>320 km</span>
                                    </div>
                                    <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-blue-500 w-[80%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>34 M1G 02 (Lojistik)</span><span>410 km</span>
                                    </div>
                                    <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-purple-500 w-[100%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[9px] font-bold text-neutral-400 mb-1">
                                        <span>34 M1G 03 (Personel)</span><span>150 km</span>
                                    </div>
                                    <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/10">
                                        <div className="h-full bg-green-500 w-[30%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Routes Map */}
                    <div className="col-span-7 bg-[#0a1120] border border-white/10 rounded-xl p-4 flex flex-col h-full">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                            <Anchor size={14} className="text-blue-500" /> Araç Rota ve İntikal Haritası
                        </h3>
                        <div className="flex-1 bg-black border border-white/5 rounded-lg relative overflow-hidden group">
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 19px, #fff 19px, #fff 20px)' }}></div>
                            
                            {/* Route lines */}
                            <svg className="absolute inset-0 w-full h-full">
                                <path d="M 100 100 Q 200 50 300 150 T 500 200" fill="none" stroke="#3b82f6" strokeWidth="4" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                <path d="M 150 300 Q 300 350 400 250 T 500 200" fill="none" stroke="#a855f7" strokeWidth="4" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                            </svg>

                            {/* Waypoints */}
                            <div className="absolute top-[100px] left-[100px] w-4 h-4 bg-white rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                                <span className="absolute top-5 text-[9px] font-bold text-white bg-black/80 px-1 py-0.5 whitespace-nowrap">MERKEZ ÜS</span>
                            </div>

                            <div className="absolute top-[200px] left-[500px] w-6 h-6 bg-red-600 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(220,38,38,1)]">
                                <Flame size={12} className="text-white" />
                                <span className="absolute top-8 text-[9px] font-bold text-red-400 bg-black/80 px-1 py-0.5 whitespace-nowrap border border-red-500/30">OPERASYON ALANI</span>
                            </div>

                            {/* Vehicles */}
                            <div className="absolute top-[140px] left-[270px] bg-blue-600 text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg border border-blue-400 flex items-center gap-1">
                                <Truck size={10} /> 34 M1G 01
                            </div>
                            <div className="absolute top-[280px] left-[350px] bg-purple-600 text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg border border-purple-400 flex items-center gap-1">
                                <Truck size={10} /> 34 M1G 02
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    // Main Renderer
    return (
        <div id="kavkas-report-content" className="bg-[#050B14] text-white p-6 relative mx-auto shadow-2xl font-mono flex flex-col" style={{ width: '1200px', height: '800px', overflow: 'hidden' }}>
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {/* Alt Bilgi - Tüm Raporlarda Sabit */}
            <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest border-t border-white/10 pt-3 z-20">
                <div>M1G SYSTEM KAVKAS - CONFIDENTIAL</div>
                <div>GENERATED VIA KAVKAS ENGINE v2.4</div>
            </div>

            {reportType === 'PLANLAMA_SONUC' 
                ? renderAreaCoverageReport() 
                : reportType === 'GUVENLIK' 
                    ? renderPersonnelActivityReport() 
                    : (reportType === 'ULASTIRMA_ARAC_LOJISTIGI' || reportType === 'LOJISTIK' || reportType === 'US_LOJISTIGI')
                        ? renderVehicleLogisticsReport()
                        : renderOperationsChronology()
            }
        </div>
    );
}
