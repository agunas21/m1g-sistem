"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import KimlikCard from "@/components/KimlikCard";

export default function TopluKimlik() {
    const [members, setMembers] = useState<any[]>([]);
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://m1g.org.tr';

    useEffect(() => {
        fetch('/api/members')
            .then(res => res.json())
            .then(data => {
                setAllMembers(data);
                const activeMembers = data.filter((m: any) => {
                    const isPasif = (m.dir?.includes("PASİF") || m.dir?.includes("İPTAL")) || m.status === "Pasif" || m.status === "Banlı";
                    return !isPasif && m.fullName && m.memberType;
                });
                setMembers(activeMembers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getRole = (m: any) => {
        if (m.role && m.role.trim() !== "" && m.role !== "Üye" && m.role !== "Gönüllü") return m.role.trim().toUpperCase();
        if (m.honorary === "Evet") return "ONUR ÜYESİ";
        if (m.memberType === "Üye" || m.memberType === "Asil Üye" || m.memberType === "ASİL ÜYE") return "ÜYE";
        if (m.memberType && m.memberType.trim() !== "" && m.memberType !== "Gönüllü") return m.memberType.trim().toUpperCase();
        return "GÖNÜLLÜ";
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const selectAll = () => {
        setSelectedIds(members.map(m => m.id));
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const exportToZip = async () => {
        if (selectedIds.length === 0) {
            alert("Lütfen dışa aktarmak için en az bir kişi seçin.");
            return;
        }

        try {
            setExporting(true);
            setExportProgress({ current: 0, total: selectedIds.length });

            const { captureCard } = await import('@/lib/cardCapture');

            const zip = new JSZip();

            for (let i = 0; i < selectedIds.length; i++) {
                const memberId = selectedIds[i];
                const member = members.find(m => m.id === memberId);
                if (!member) continue;

                setExportProgress(prev => ({ ...prev, current: i + 1 }));

                try {
                    const frontCanvas = await captureCard(`export-front-${member.id}`, { scale: 5 });
                    const backCanvas = await captureCard(`export-back-${member.id}`, { scale: 5 });

                    const frontData = frontCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");
                    const backData = backCanvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");

                    const cleanName = member.fullName.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ ]/g, "").trim().replace(/\s+/g, "_");

                    zip.file(`${cleanName}_ON.png`, frontData, { base64: true });
                    zip.file(`${cleanName}_ARKA.png`, backData, { base64: true });
                } catch (cardError: any) {
                    alert(`Hata (${member.fullName} işlenirken): ${cardError?.message || "Bilinmeyen hata"}`);
                    throw cardError;
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "M1G_Secili_Kimlikler.zip");
        } catch (error: any) {
            console.error("Dışa aktarma hatası:", error);
            alert(`Dışa aktarma sırasında genel bir hata oluştu: ${error?.message || "Bilinmeyen hata"}`);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 min-h-screen text-white p-8 print:p-0 print:bg-white">
            <div className="mb-8 flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Toplu Kimlik Yazdırma</h1>
                    <p className="text-neutral-400">Toplam {members.length} aktif personel. Dışa aktarmak istediklerinizi seçin.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    {exporting && (
                        <span className="text-red-400 font-bold animate-pulse text-sm">
                            İşleniyor... ({exportProgress.current} / {exportProgress.total})
                        </span>
                    )}
                    <button onClick={selectAll} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold uppercase rounded-xl transition-all text-sm border border-neutral-700">
                        Tümünü Seç
                    </button>
                    <button onClick={clearSelection} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-bold uppercase rounded-xl transition-all text-sm border border-neutral-700">
                        Temizle
                    </button>
                    <button onClick={exportToZip} disabled={exporting || selectedIds.length === 0} className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase rounded-xl transition-all text-sm flex items-center gap-2">
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Seçilileri İndir (ZIP)
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .page-break-after { page-break-after: always; }
                }
            `}} />

            <div className="flex flex-wrap gap-6 justify-center print:justify-start">
                {members.map((member, index) => {
                    const role = getRole(member);
                    const baskan = allMembers.find(m => m.memberType === "Yönetim Kurulu Başkanı" && m.phone) || allMembers.find(m => m.id === "cgorgu");
                    const baskanPhone = baskan?.phone || "+90 544 727 60 75";

                    // Enhance member with president phone
                    const enhancedMember = {
                        ...member,
                        presidentPhone: baskanPhone,
                        role: role
                    };

                    return (
                        <div key={index} className="flex flex-col gap-2 mb-4 print:mb-0">
                            <div className="flex items-center gap-2 print:hidden bg-neutral-800 p-3 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors border border-neutral-700" onClick={() => toggleSelection(member.id)}>
                                <input type="checkbox" className="w-5 h-5 accent-red-600 pointer-events-none" checked={selectedIds.includes(member.id)} readOnly />
                                <span className="font-bold">{member.fullName}</span>
                                <span className="text-neutral-400 text-sm ml-auto">{role}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4" style={{ pageBreakInside: 'avoid' }}>
                                {/* ÖN YÜZ */}
                                <div id={`card-front-${member.id}`} className="relative shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
                                    <KimlikCard
                                        member={enhancedMember}
                                        origin={origin}
                                        isFront={true}
                                        htmlId={`card-inner-front-${member.id}`}
                                        scale={0.6375}
                                    />
                                </div>
                                
                                {/* ARKA YÜZ */}
                                <div id={`card-back-${member.id}`} className="relative shadow-2xl" style={{ width: "54mm", height: "86mm", backgroundColor: "#ffffff", border: "1px solid #e5e7eb", fontFamily: "'Inter', sans-serif", boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.05), inset -4px -4px 10px rgba(255,255,255,0.5)", overflow: "hidden" }}>
                                    <KimlikCard
                                        member={enhancedMember}
                                        origin={origin}
                                        isFront={false}
                                        htmlId={`card-inner-back-${member.id}`}
                                        scale={0.6375}
                                    />
                                </div>
                            </div>
                            
                            {/* EXPORT İÇİN GİZLİ VE ÖLÇEKLENDİRİLMEMİŞ (SCALE=1) KARTLAR */}
                            <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
                                <KimlikCard
                                    member={enhancedMember}
                                    origin={origin}
                                    isFront={true}
                                    htmlId={`export-front-${member.id}`}
                                    scale={1}
                                />
                                <KimlikCard
                                    member={enhancedMember}
                                    origin={origin}
                                    isFront={false}
                                    htmlId={`export-back-${member.id}`}
                                    scale={1}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
