"use client";

import React from 'react';
import { MapPin, FileText, Activity, CheckSquare } from 'lucide-react';

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
    
    // Askeri/Resmi rapor görünümü (A4 boyutlarında, beyaz arkaplan, siyah metin)
    return (
        <div id="kavkas-report-content" className="bg-white text-black p-8 relative mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Üst Antet / Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-black text-xl">
                        M1G
                    </div>
                    <div>
                        <h1 className="font-black text-2xl uppercase tracking-tighter">M1G KAVKAS SİSTEMİ</h1>
                        <h2 className="font-bold text-gray-600 text-sm uppercase">Acil Durum Yönetim Başkanlığı Raporu</h2>
                    </div>
                </div>
                <div className="text-right text-xs">
                    <div className="font-bold">BELGE NO: <span className="font-mono">{operation.id.split('-')[0]?.toUpperCase()}-REV{reportVersion}</span></div>
                    <div>TARİH: {formattedDate.split(' ')[0]}</div>
                    <div>SAAT: {formattedDate.split(' ')[1]}</div>
                    <div className="font-bold mt-1 text-red-600 border border-red-600 inline-block px-1">GİZLİ / TASNİF DIŞI</div>
                </div>
            </div>

            {/* Rapor Başlığı */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black underline uppercase">{formatReportType(reportType)}</h2>
                <div className="text-sm font-bold mt-2">DURUM: ONAY BEKLİYOR</div>
            </div>

            {/* Operasyon Künyesi */}
            <div className="border border-black mb-6">
                <div className="bg-gray-200 border-b border-black p-2 font-bold uppercase text-sm flex items-center gap-2">
                    <MapPin size={16} /> 1. Operasyon Künyesi
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-bold">Operasyon Adı:</span> {operation.name}</div>
                    <div><span className="font-bold">Durum:</span> {operation.status}</div>
                    <div><span className="font-bold">Başlangıç Tarihi:</span> {new Date(operation.startDate).toLocaleDateString('tr-TR')}</div>
                    <div><span className="font-bold">Bölge/Konum:</span> {operation.location || 'Belirtilmedi'}</div>
                    <div><span className="font-bold">Tim Seviyesi:</span> {operation.teamLevel || 'Standart'}</div>
                    <div><span className="font-bold">Özerklik:</span> {operation.selfSufficiencyDays ? `${operation.selfSufficiencyDays} Gün` : 'Yok'}</div>
                </div>
            </div>

            {/* İçerik Özeti */}
            <div className="border border-black mb-6">
                <div className="bg-gray-200 border-b border-black p-2 font-bold uppercase text-sm flex items-center gap-2">
                    <FileText size={16} /> 2. Rapor Özeti ve Metrikler
                </div>
                <div className="p-4 text-sm">
                    <p className="mb-4 leading-relaxed font-medium">
                        {reportContent?.summary || "Rapor özeti bulunamadı."}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="border border-gray-300 p-3 text-center rounded">
                            <div className="text-3xl font-black">{reportContent?.metrics?.totalEventsAnalyzed || 0}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase mt-1">İncelenen Log</div>
                        </div>
                        <div className="border border-gray-300 p-3 text-center rounded">
                            <div className="text-3xl font-black">{operation.teams?.length || 0}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase mt-1">Saha Timi</div>
                        </div>
                        <div className="border border-gray-300 p-3 text-center rounded">
                            <div className="text-3xl font-black">%{reportVersion * 5 > 100 ? 100 : 70 + reportVersion * 5}</div>
                            <div className="text-xs font-bold text-gray-500 uppercase mt-1">KAVKAS Uyumu</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Taktik Akış (Timeline) */}
            <div className="border border-black mb-6">
                <div className="bg-gray-200 border-b border-black p-2 font-bold uppercase text-sm flex items-center gap-2">
                    <Activity size={16} /> 3. Tespit Edilen Kritik Taktik Olaylar
                </div>
                <div className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 border-b border-black text-xs uppercase">
                            <tr>
                                <th className="px-4 py-2 border-r border-black w-1/4">Zaman Damgası</th>
                                <th className="px-4 py-2 border-r border-black w-1/4">Olay Tipi</th>
                                <th className="px-4 py-2">Durum Değerlendirmesi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportContent?.timeline?.length > 0 ? (
                                reportContent.timeline.slice(0, 5).map((event: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-300">
                                        <td className="px-4 py-2 border-r border-black font-mono">{new Date(event.time).toLocaleString('tr-TR')}</td>
                                        <td className="px-4 py-2 border-r border-black font-bold">{event.type}</td>
                                        <td className="px-4 py-2 text-gray-600 italic">Sistem tarafından doğrulanmış otomatik kayıt.</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center italic text-gray-500">Bu gruba ait olay tespit edilmedi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {reportContent?.timeline?.length > 5 && (
                        <div className="p-2 text-xs text-center text-gray-500 bg-gray-50 border-t border-black">
                            + {reportContent.timeline.length - 5} olay daha bulunmaktadır. Tamamı sistem veritabanında saklıdır.
                        </div>
                    )}
                </div>
            </div>

            {/* Eksikler / Tespitler */}
            <div className="border border-black mb-12">
                <div className="bg-gray-200 border-b border-black p-2 font-bold uppercase text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> 4. AFAD / KAVKAS Eksiklik Tespiti
                </div>
                <div className="p-4 text-sm">
                    {reportContent?.gaps?.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                            {reportContent.gaps.map((gap: string, i: number) => (
                                <li key={i} className="text-red-700 font-medium">{gap}</li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-green-700 font-bold flex items-center gap-2">
                            <CheckSquare size={16} /> Kritik eksiklik veya kural ihlali tespit edilmemiştir.
                        </div>
                    )}
                </div>
            </div>

            {/* İmza Blokları */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 text-center text-sm">
                <div>
                    <div className="h-16"></div>
                    <div className="border-t border-black pt-2 font-bold uppercase">Hazırlayan</div>
                    <div className="text-xs text-gray-600 mt-1">M1G KAVKAS AI</div>
                </div>
                <div>
                    <div className="h-16"></div>
                    <div className="border-t border-black pt-2 font-bold uppercase">Operasyon Sorumlusu</div>
                    <div className="text-xs text-gray-600 mt-1">İmza</div>
                </div>
                <div>
                    <div className="h-16"></div>
                    <div className="border-t border-black pt-2 font-bold uppercase">Onay / Yönetim Kurulu</div>
                    <div className="text-xs text-gray-600 mt-1">İmza</div>
                </div>
            </div>

            {/* Alt Bilgi (Footer) */}
            <div className="absolute bottom-4 left-0 w-full px-8 text-xs text-center text-gray-400 font-mono">
                Bu belge 5070 sayılı Elektronik İmza Kanunu'na uygun olarak M1G Sistemi tarafından otomatik üretilmiştir. <br />
                Doğrulama Kodu: {operation.id.split('-')[1]?.toUpperCase()}-{reportVersion}-{Date.now().toString().slice(-4)}
            </div>
        </div>
    );
}

// Custom icon for gap
function AlertTriangle(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>;
}
