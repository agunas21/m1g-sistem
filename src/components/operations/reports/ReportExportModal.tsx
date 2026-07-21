"use client";

import React, { useState, useRef } from 'react';
import { X, Download, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import KavkasReportViewer from './KavkasReportViewer';

interface ReportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    operation: any;
}

export default function ReportExportModal({ isOpen, onClose, operation }: ReportExportModalProps) {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [reports, setReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    
    // Reference to the element we want to convert to PDF
    const printRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen && operation?.id) {
            setLoadingReports(true);
            fetch(`/api/operations/${operation.id}/generate-reports`) // Ensure a GET endpoint exists or adapt to how reports are stored
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setReports(data);
                        if (data.length > 0) setSelectedReportId(data[0].id);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingReports(false));
        }
    }, [isOpen, operation?.id]);

    if (!isOpen) return null;

    const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

    const handleDownloadPdf = async () => {
        if (!printRef.current || !selectedReport) return;
        
        try {
            setIsExporting(true);
            
            // Render HTML to canvas
            const canvas = await html2canvas(printRef.current, {
                scale: 2, // higher resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Convert canvas to image
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // A4 dimensions in mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            
            // Save PDF
            const fileName = `KAVKAS_${selectedReport.type}_${operation.name.substring(0, 10).replace(/\s/g, '_')}_REV${selectedReport.version}.pdf`;
            pdf.save(fileName);
            
        } catch (error) {
            console.error("PDF Export failed", error);
            alert("PDF dışa aktarılırken bir hata oluştu.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#0a0f1c] w-full max-w-6xl h-[90vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="bg-black/40 border-b border-white/5 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-widest text-lg">KAVKAS Rapor Merkezi</h2>
                            <p className="text-neutral-400 text-xs">Resmi AFAD mizanpajı ile PDF çıktı sistemi</p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X className="text-white" size={24} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sol Sidebar - Rapor Seçimi */}
                    <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-4 shrink-0 overflow-y-auto">
                        <h3 className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-4">Üretilmiş Taslak Raporlar</h3>
                        
                        {loadingReports ? (
                            <div className="text-center text-neutral-400 text-sm mt-10 flex flex-col items-center">
                                <Loader2 className="animate-spin mb-2 text-purple-400" /> Raporlar Yükleniyor...
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center text-neutral-600 text-sm italic mt-10">
                                Henüz bu operasyon için taslak rapor üretilmemiş.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {reports.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReportId(report.id)}
                                        className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-colors ${
                                            (selectedReportId === report.id || (!selectedReportId && selectedReport?.id === report.id))
                                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                                : 'bg-black/40 border-white/5 text-neutral-400 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="truncate">{report.type.replace(/_/g, ' ')}</div>
                                        <div className="text-[10px] font-medium opacity-50 mt-1">REV-{report.version}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sağ Taraf - Önizleme ve İndirme */}
                    <div className="flex-1 bg-[#1a1f2c] flex flex-col relative overflow-hidden">
                        {/* Top Bar inside preview */}
                        <div className="h-14 border-b border-white/10 bg-black/40 flex items-center justify-between px-6 shrink-0">
                            <span className="text-white text-sm font-bold">Önizleme Modu (A4)</span>
                            <button 
                                onClick={handleDownloadPdf}
                                disabled={isExporting || !selectedReport}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                {isExporting ? "PDF Hazırlanıyor..." : "PDF Olarak İndir"}
                            </button>
                        </div>

                        {/* PDF Preview Area */}
                        <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#2a2f3c] custom-scrollbar">
                            {selectedReport ? (
                                <div 
                                    className="shadow-2xl transition-transform" 
                                    style={{ transformOrigin: 'top center', transform: 'scale(0.8)' }}
                                >
                                    {/* Bu Div html2canvas ile yakalanacak. Ekranda görünmesi gerekiyor. */}
                                    <div ref={printRef}>
                                        <KavkasReportViewer 
                                            operation={operation}
                                            reportType={selectedReport.type}
                                            reportContent={selectedReport.content}
                                            reportVersion={selectedReport.version}
                                            generatedAt={selectedReport.draftGeneratedAt || new Date().toISOString()}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="m-auto text-neutral-500">Görüntülenecek rapor bulunamadı.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
