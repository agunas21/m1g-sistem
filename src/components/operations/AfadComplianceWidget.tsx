"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

export default function AfadComplianceWidget({ operationId }: { operationId: string }) {
    // In a real scenario, this state would be fetched from /api/operations/[id]/compliance
    // Stubbing for UI demonstration
    const [score, setScore] = useState(65);
    const [checks, setChecks] = useState([
        { id: 1, requirement: 'KAVKAS Rol Eşleştirmeleri', status: 'PASS' },
        { id: 2, requirement: 'Saha Personeli İletişim Kontrolü', status: 'PASS' },
        { id: 3, requirement: 'Araç / Lojistik Kayıtları', status: 'WARN' },
        { id: 4, requirement: 'Düzenli Raporlama (Son 4 saat)', status: 'FAIL' },
        { id: 5, requirement: 'Risk Değerlendirme Formu', status: 'FAIL' },
    ]);

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleGenerateReports = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // trigger the generate reports API
            const res = await fetch(`/api/operations/${operationId}/generate-reports`, { method: 'POST' });
            if (res.ok) {
                setChecks(prev => prev.map(c => c.id === 4 ? { ...c, status: 'PASS' } : c));
                setScore(80);
                setSuccessMsg("Taslak Raporlar Başarıyla Üretildi!");
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                const errData = await res.json().catch(() => null);
                alert(`Rapor üretilirken bir hata oluştu: ${errData?.error || res.statusText || 'Bilinmeyen Hata'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Rapor üretilirken bağlantı hatası oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
            
            <div className="flex justify-between items-center mb-4 ml-2">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14} className={score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'} /> 
                    AFAD Uyumluluk Skoru
                </h3>
                <div className={`text-xl font-black ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    %{score}
                </div>
            </div>

            <div className="space-y-2 ml-2">
                {checks.map(check => (
                    <div key={check.id} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 text-[11px]">
                        <span className="text-white font-medium">{check.requirement}</span>
                        {check.status === 'PASS' && <CheckCircle2 size={14} className="text-green-400" />}
                        {check.status === 'WARN' && <AlertCircle size={14} className="text-amber-400" />}
                        {check.status === 'FAIL' && <XCircle size={14} className="text-red-400" />}
                    </div>
                ))}
            </div>

            <div className="mt-4 ml-2">
                {successMsg && <div className="text-green-400 text-xs font-bold mb-2 text-center">{successMsg}</div>}
                <button 
                    onClick={handleGenerateReports}
                    disabled={loading}
                    className="w-full bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 border border-blue-500/20 rounded-xl py-2 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                >
                    <FileText size={14} /> {loading ? "Üretiliyor..." : "Otomatik Taslak Rapor Üret"}
                </button>
            </div>
        </div>
    );
}
