"use client";

import { motion } from "framer-motion";
import { X, Printer, Users, Clock, MapPin, Activity } from "lucide-react";

interface OperationSummaryModalProps {
    operation: any;
    onClose: () => void;
}

export default function OperationSummaryModal({ operation, onClose }: OperationSummaryModalProps) {
    if (!operation) return null;

    const handlePrint = () => {
        window.print();
    };

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
                                            <td className="px-4 py-3">{t.members?.length || 0} Kişi</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-black text-neutral-800 border-b border-neutral-200 pb-2 mb-3 uppercase tracking-wider">Değerlendirme & Kapanış Notları</h2>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">
                            {operation.postMortemReport?.notes || "Kapanış notu girilmedi."}
                        </div>
                    </section>
                </div>

                {/* Footer Signature */}
                <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-between items-end">
                    <div className="text-xs text-neutral-400 font-medium">
                        Bu belge M1G Otomasyon Sistemi tarafından otomatik üretilmiştir.<br/>
                        İzinsiz çoğaltılamaz ve kurum dışına çıkartılamaz.
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-neutral-800 mb-2"></div>
                        <span className="text-sm font-bold text-neutral-800 uppercase">Operasyon Yetkilisi İmzası</span>
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
