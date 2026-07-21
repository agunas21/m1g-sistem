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
            { id: 1, time: "09:12:04", text: "Merkez üssünde toplanıldı.", type: "INFO" },
            { id: 2, time: "10:05:22", text: "Tim 1 enkaz bölgesine ulaştı.", type: "MOVE" },
            { id: 3, time: "10:45:11", text: "Bölge 4'te gaz sızıntısı uyarısı.", type: "ALERT" },
            { id: 4, time: "11:10:00", text: "Sağlık ekibi intikal etti.", type: "DEPLOY" },
            { id: 5, time: "12:00:30", text: "Görev durumu 'Aktif' olarak güncellendi.", type: "STATUS" },
            { id: 6, time: "13:15:44", text: "Lojistik destek talebi alındı.", type: "REQUEST" },
            { id: 7, time: "14:20:10", text: "Tüm ekiplerle iletişim doğrulandı.", type: "COMM" },
            { id: 8, time: "15:00:00", text: "Rapor üretimi tetiklendi.", type: "SYSTEM" },
        ];

        return (
            <>
                {renderHeader(formatReportType(reportType), (
                    <>
                        <div className="bg-[#0a1120] border border-white/10 rounded-lg p-3 w-32 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Activity size={10} /> Olay Sayısı
                            </div>
                            <div className="text-3xl font-black mt-1 text-white">{events.length}</div>
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
                            <div className="text-3xl font-black mt-1 text-green-400">{operation.teams?.length || 2}</div>
                        </div>
                    </>
                ))}
                
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
                                    {i !== events.length - 1 && <div className="absolute left-[3px] top-4 w-px h-full bg-white/10"></div>}
                                    <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${
                                        ev.type === 'ALERT' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 
                                        ev.type === 'SYSTEM' ? 'bg-purple-500' : ev.type === 'MOVE' ? 'bg-blue-500' : 'bg-white/40'
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
                        <div className="flex-1 bg-black border border-white/10 rounded-xl relative overflow-hidden group">
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #fff 49px, #fff 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, #fff 49px, #fff 50px)' }}></div>
                            
                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                <div className="bg-black/60 backdrop-blur border border-white/20 text-[9px] px-2 py-1 rounded text-white flex items-center gap-1 font-bold">
                                    <Crosshair size={10} className="text-red-500" /> LIVE TRACKING
                                </div>
                            </div>

                            <div className="absolute top-[40%] left-[30%] w-32 h-32 bg-blue-500/10 rounded-full border border-blue-500/30 animate-pulse"></div>
                            <div className="absolute top-[45%] left-[35%] w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                            <div className="absolute top-[42%] left-[37%] text-[10px] text-blue-300 font-bold">TİM-1</div>

                            <div className="absolute top-[60%] right-[20%] w-48 h-48 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                            <div className="absolute top-[65%] right-[25%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
                            <div className="absolute top-[62%] right-[27%] text-[10px] text-red-400 font-bold">KRİTİK BÖLGE</div>

                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                                <path d="M 400 300 Q 500 200 700 450" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
                            </svg>
                        </div>
                        <div className="h-40 grid grid-cols-2 gap-4">
                            <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 relative overflow-hidden">
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Müdahale Zinciri</h4>
                                <div className="flex justify-between items-center h-16 relative">
                                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/10 -translate-y-1/2"></div>
                                    <div className="relative z-10 bg-green-500/20 border border-green-500 text-green-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                        <Zap size={14} className="mb-0.5" /> TESPİT
                                    </div>
                                    <div className="relative z-10 bg-blue-500/20 border border-blue-500 text-blue-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                        <Activity size={14} className="mb-0.5" /> ÇIKIŞ
                                    </div>
                                    <div className="relative z-10 bg-amber-500/20 border border-amber-500 text-amber-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold">
                                        <MapPin size={14} className="mb-0.5" /> VARIŞ
                                    </div>
                                    <div className="relative z-10 bg-purple-500/20 border border-purple-500 text-purple-400 w-12 h-12 flex flex-col items-center justify-center rounded-full text-[8px] font-bold text-center leading-tight">
                                        <ShieldCheck size={14} className="mb-0.5" /> MÜDAHALE
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0a1120] border border-white/10 rounded-xl p-4 flex flex-col">
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase mb-3">Durum Özeti</h4>
                                <div className="text-[11px] text-neutral-300 leading-relaxed overflow-hidden">
                                    {reportContent?.summary || "Saha unsurlarının intikali tamamlanmış olup, operasyon planlanan koordinatlarda aktif olarak sürmektedir."}
                                </div>
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
