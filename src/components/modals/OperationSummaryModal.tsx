"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Printer, Users, Clock, MapPin, Activity } from "lucide-react";

interface OperationSummaryModalProps {
    operation: any;
    onClose: () => void;
}

export default function OperationSummaryModal({ operation, onClose }: OperationSummaryModalProps) {
    const [sectors, setSectors] = useState<any[]>(operation?.sectors || []);
    const [worksites, setWorksites] = useState<any[]>(operation?.worksites || []);

    useEffect(() => {
        if (!operation?.id) return;
        fetch(`/api/settings/operations/active/sectors?operationId=${operation.id}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d.sectors) && d.sectors.length > 0) setSectors(d.sectors); })
            .catch(() => {});
        fetch(`/api/settings/operations/active/worksites?operationId=${operation.id}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d.worksites) && d.worksites.length > 0) setWorksites(d.worksites); })
            .catch(() => {});
    }, [operation?.id]);

    if (!operation) return null;

    const handlePrint = () => {
        window.print();
    };

    const totalLiveExtracted = worksites.reduce((sum, w) => sum + (w.victims?.liveExtracted || 0), 0);
    const totalDeceasedExtracted = worksites.reduce((sum, w) => sum + (w.victims?.deceasedExtracted || 0), 0);
    const allExtrications = worksites.flatMap(w => (w.extrications || []).map((e: any) => ({ ...e, worksiteCode: w.code, worksiteName: w.name })));

    // Calculate total hours
    const start = new Date(operation.startTime).getTime();
    const end = operation.endTime ? new Date(operation.endTime).getTime() : Date.now();
    const totalHours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));

    const totalTeams = operation.teams?.length || 0;
    const totalMembers = (operation.baseCamp?.members?.length || 0) + 
                         (operation.teams?.reduce((acc: number, t: any) => acc + (t.members?.length || 0), 0) || 0);

    return (
        <div className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto no-print">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white text-black rounded-xl p-8 max-w-4xl w-full shadow-2xl my-8 relative print:m-0 print:p-0 print:shadow-none print:w-full print:bg-white"
            >
                {/* Print and Close Actions - Hidden on Print */}
                <div className="absolute top-4 right-4 flex gap-2 no-print">
                    <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-bold text-sm">
                        <Printer size={16} /> PDF / Yazdır
                    </button>
                    <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Report Header */}
                <div className="border-b-4 border-red-600 pb-6 mb-6 flex items-center gap-6">
                    <img src="/m1g-logo.png" alt="M1G Logo" className="w-24 h-24 object-contain" />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-900">M1G Operasyon Raporu</h1>
                        <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mt-1">Döküman Ref: {operation.id} • {new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>

                {/* Report Meta Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200">
                        <span className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase mb-1"><Activity size={14}/> Durum</span>
                        <p className="text-lg font-black text-neutral-800">{operation.status}</p>
                    </div>
                    <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200">
                        <span className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase mb-1"><Clock size={14}/> Toplam Süre</span>
                        <p className="text-lg font-black text-neutral-800">{totalHours} Saat</p>
                    </div>
                    <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200">
                        <span className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase mb-1"><Users size={14}/> Efor (Tim/Kişi)</span>
                        <p className="text-lg font-black text-neutral-800">{totalTeams} Tim / {totalMembers} Personel</p>
                    </div>
                    <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200">
                        <span className="flex items-center gap-2 text-neutral-500 font-bold text-xs uppercase mb-1"><MapPin size={14}/> Sektör</span>
                        <p className="text-lg font-black text-neutral-800 truncate" title={operation.location}>{operation.location || "Merkez"}</p>
                    </div>
                </div>

                {/* Report Content */}
                <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">Operasyon Künyesi</h2>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div><span className="font-bold text-neutral-500 w-32 inline-block">Operasyon Adı:</span> <span className="font-medium text-neutral-900">{operation.name}</span></div>
                            <div><span className="font-bold text-neutral-500 w-32 inline-block">Türü:</span> <span className="font-medium text-neutral-900">{operation.type}</span></div>
                            <div><span className="font-bold text-neutral-500 w-32 inline-block">Başlangıç:</span> <span className="font-medium text-neutral-900">{operation.startTime}</span></div>
                            <div><span className="font-bold text-neutral-500 w-32 inline-block">Bitiş:</span> <span className="font-medium text-neutral-900">{operation.endTime || "Devam Ediyor"}</span></div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">Saha Timleri ve Personel</h2>
                        <div className="overflow-hidden border border-neutral-200 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Tim Adı</th>
                                        <th className="px-4 py-3">Durumu</th>
                                        <th className="px-4 py-3">Personel Sayısı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                                    {operation.teams?.map((t: any) => (
                                        <tr key={t.id} className="bg-white">
                                            <td className="px-4 py-3">{t.name}</td>
                                            <td className="px-4 py-3">{t.status}</td>
                                            <td className="px-4 py-3">
                                                {t.members?.length || 0} Kişi
                                                {t.members?.some((m: any) => m.distanceCovered) && (
                                                    <div className="text-xs text-neutral-500 mt-1 font-bold">
                                                        Toplam Yürüyüş: {(t.members.reduce((sum: number, m: any) => sum + (m.distanceCovered || 0), 0)).toFixed(2)} km
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* INSARAG ASR-1 / LKP Sektör Özeti */}
                    {sectors.length > 0 && (
                        <section className="print:break-inside-avoid">
                            <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">
                                INSARAG ASR-1 & Saha Sektörleme Özeti ({sectors.length} Sektör)
                            </h2>
                            <div className="overflow-hidden border border-neutral-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase">
                                        <tr>
                                            <th className="px-3 py-2.5">Sektör Kodu</th>
                                            <th className="px-3 py-2.5">Bölge / Tanım</th>
                                            <th className="px-3 py-2.5">Görevli Tim</th>
                                            <th className="px-3 py-2.5">Durum & Öncelik</th>
                                            <th className="px-3 py-2.5">Tehlike / Notlar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                                        {sectors.map((sec: any) => (
                                            <tr key={sec.id} className="bg-white">
                                                <td className="px-3 py-2 font-mono font-bold">{sec.sectorType === 'LKP' ? `[LKP] ${sec.code}` : sec.code}</td>
                                                <td className="px-3 py-2 font-bold">{sec.name}</td>
                                                <td className="px-3 py-2">{sec.assignedTeamName || '-'}</td>
                                                <td className="px-3 py-2">{sec.status} ({sec.priority})</td>
                                                <td className="px-3 py-2 text-neutral-600">{sec.hazards || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* INSARAG ASR-3/4/5 Enkaz & Arama Kurtarma Bilançosu */}
                    {worksites.length > 0 && (
                        <section className="print:break-inside-avoid">
                            <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">
                                INSARAG ASR-3/4/5 Enkaz & Arama Kurtarma Bilançosu
                            </h2>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                                    <span className="block text-neutral-500 text-[11px] font-bold uppercase">Çalışılan Enkaz</span>
                                    <span className="block text-2xl font-black text-neutral-900">{worksites.length}</span>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                                    <span className="block text-emerald-700 text-[11px] font-bold uppercase">Canlı Çıkarılan (L)</span>
                                    <span className="block text-2xl font-black text-emerald-700">{totalLiveExtracted}</span>
                                </div>
                                <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                                    <span className="block text-red-700 text-[11px] font-bold uppercase">Çıkarılan Vefat (D)</span>
                                    <span className="block text-2xl font-black text-red-700">{totalDeceasedExtracted}</span>
                                </div>
                            </div>
                            <div className="overflow-hidden border border-neutral-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase">
                                        <tr>
                                            <th className="px-3 py-2.5">Kademe / Kod</th>
                                            <th className="px-3 py-2.5">Enkaz / Yapı</th>
                                            <th className="px-3 py-2.5">Görevli Tim</th>
                                            <th className="px-3 py-2.5">Teknik Arama (K9/Akustik)</th>
                                            <th className="px-3 py-2.5">Canlı / Vefat</th>
                                            <th className="px-3 py-2.5">Son Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                                        {worksites.map((ws: any) => (
                                            <tr key={ws.id} className="bg-white">
                                                <td className="px-3 py-2 font-mono font-bold">{ws.asrLevel || 'ASR-3'} [{ws.code}]</td>
                                                <td className="px-3 py-2">
                                                    <div className="font-bold">{ws.name}</div>
                                                    <div className="text-[10px] text-neutral-500">{ws.structureType} / {ws.collapseType}</div>
                                                </td>
                                                <td className="px-3 py-2">{ws.assignedTeamName || '-'}</td>
                                                <td className="px-3 py-2 text-[11px]">
                                                    K9: {ws.techSearch?.k9 || '-'} | Akustik: {ws.techSearch?.acoustic || '-'}
                                                </td>
                                                <td className="px-3 py-2 font-bold">
                                                    <span className="text-emerald-700">L:{ws.victims?.liveExtracted || 0}</span> / <span className="text-red-700">D:{ws.victims?.deceasedExtracted || 0}</span>
                                                </td>
                                                <td className="px-3 py-2 font-bold">{ws.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* START Triyaj & Çıkarılan Kazazede Teslim Listesi */}
                    {allExtrications.length > 0 && (
                        <section className="print:break-inside-avoid">
                            <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">
                                START Triyaj & Çıkarılan Kazazede Teslim Tutanak Özeti ({allExtrications.length} Kayıt)
                            </h2>
                            <div className="overflow-hidden border border-neutral-200 rounded-lg">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase">
                                        <tr>
                                            <th className="px-3 py-2">Saat</th>
                                            <th className="px-3 py-2">Enkaz</th>
                                            <th className="px-3 py-2">START Triyaj</th>
                                            <th className="px-3 py-2">Kazazede Bilgisi</th>
                                            <th className="px-3 py-2">Çıkarıldığı Nokta</th>
                                            <th className="px-3 py-2">Teslim Alan Sağlık Birimi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 font-medium text-neutral-800">
                                        {allExtrications.map((ext: any) => (
                                            <tr key={ext.id} className="bg-white">
                                                <td className="px-3 py-2 font-mono">{ext.timeString}</td>
                                                <td className="px-3 py-2 font-bold">[{ext.worksiteCode}] {ext.worksiteName}</td>
                                                <td className="px-3 py-2 font-bold">{ext.triage}</td>
                                                <td className="px-3 py-2">{ext.victimInfo}</td>
                                                <td className="px-3 py-2">{ext.locationInRubble}</td>
                                                <td className="px-3 py-2 font-bold">{ext.handedOverTo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <section className="print:break-inside-avoid">
                        <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">Değerlendirme & Kapanış Notları</h2>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">
                            {operation.postMortemReport?.notes || "Kapanış notu girilmedi."}
                        </div>
                    </section>

                    {/* Logistics Section */}
                    {operation.postMortemReport?.suppliesUsed && (
                        <section className="print:break-inside-avoid mt-6">
                            <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">Lojistik ve Tüketim Bilançosu</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center">
                                    <span className="block text-neutral-500 text-xs font-bold uppercase mb-1">KKD & Ekipman</span>
                                    <span className="block text-2xl font-black text-neutral-800">{operation.postMortemReport.suppliesUsed.ppeCount || 0}</span>
                                </div>
                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center">
                                    <span className="block text-neutral-500 text-xs font-bold uppercase mb-1">Erzak & Kumanya</span>
                                    <span className="block text-2xl font-black text-neutral-800">{operation.postMortemReport.suppliesUsed.mealsCount || 0}</span>
                                </div>
                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-center">
                                    <span className="block text-neutral-500 text-xs font-bold uppercase mb-1">İlk Yardım Kiti</span>
                                    <span className="block text-2xl font-black text-neutral-800">{operation.postMortemReport.suppliesUsed.firstAidKits || 0}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Chronological Log Section */}
                    {operation.logs && operation.logs.length > 0 && (
                        <section className="mt-8 print:mt-12">
                            <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={18} /> Kronolojik Seyir Defteri (Olay Günlüğü)
                            </h2>
                            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase">
                                        <tr>
                                            <th className="px-4 py-2 w-32 border-b border-neutral-200">Saat</th>
                                            <th className="px-4 py-2 border-b border-neutral-200">Aksiyon / Gelişme</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                                        {operation.logs.map((log: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-neutral-50">
                                                <td className="px-4 py-2 whitespace-nowrap font-mono font-bold text-neutral-500">{log.time}</td>
                                                <td className="px-4 py-2">{log.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer Signature */}
                <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-between items-end print:mt-24 print:break-inside-avoid">
                    <div className="text-xs text-neutral-400 font-medium">
                        Bu belge M1G Otomasyon Sistemi tarafından otomatik üretilmiştir.<br/>
                        AFAD ve İlgili Kamu Kurumlarına Sunulmak Üzere Hazırlanmıştır.<br/>
                        İzinsiz çoğaltılamaz ve kurum dışına çıkartılamaz.
                    </div>
                    
                    <div className="flex gap-16">
                        <div className="text-center">
                            <div className="w-48 border-b border-neutral-800 mb-2 h-16"></div>
                            <span className="text-xs font-bold text-neutral-800 uppercase block">Tim Liderleri Sözcüsü</span>
                            <span className="text-[10px] text-neutral-500 block">Ad, Soyad, İmza</span>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b border-neutral-800 mb-2 h-16"></div>
                            <span className="text-xs font-bold text-neutral-800 uppercase block">Operasyon Yöneticisi (Sorumlu)</span>
                            <span className="text-[10px] text-neutral-500 block">Ad, Soyad, İmza</span>
                        </div>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
