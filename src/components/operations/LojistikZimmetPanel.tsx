import React, { useState } from 'react';
import { Package, ScanBarcode, Check, UserCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import dynamic from "next/dynamic";

const QRScannerModal = dynamic(() => import("@/components/admin/operasyonlar/QRScannerModal"), { ssr: false });

export default function LojistikZimmetPanel({ operationId, membersData, isAdmin, isActive = true, mounted }: any) {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAssign = async (action: 'assign' | 'unassign') => {
        if (!qrCode) {
            toast.error("Önce QR Kod okutun veya girin");
            return;
        }

        if (action === 'assign' && !selectedMember) {
            toast.error("Zimmet yapılacak personeli seçin");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/settings/operations/equipment-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrCode,
                    operationId,
                    memberId: action === 'assign' ? selectedMember : undefined,
                    action
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(action === 'assign' ? "Ekipman zimmetlendi" : "Ekipman iade alındı");
                setQrCode("");
                setSelectedMember("");
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("İşlem sırasında hata oluştu");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScannerResult = (result: string) => {
        setQrCode(result);
        setIsScannerOpen(false);
    };

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Package size={16} className="text-amber-400" /> Hızlı Ekipman Zimmet (QR)
                </h3>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <input 
                        type="text"
                        placeholder="Cihaz QR / Barkod Kodu..."
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-amber-500"
                    />
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="p-3 bg-amber-600/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-600/20 transition-colors"
                    >
                        <ScanBarcode size={18} />
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <UserCheck size={16} className="text-neutral-500" />
                    <select 
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500"
                    >
                        <option value="">Zimmetlenecek Personeli Seç...</option>
                        {membersData.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.fullName}</option>
                        ))}
                    </select>
                </div>

                {(isAdmin && isActive) && (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button 
                            disabled={isProcessing}
                            onClick={() => handleAssign('unassign')}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} /> İade Al (Düş)
                        </button>
                        <button 
                            disabled={isProcessing}
                            onClick={() => handleAssign('assign')}
                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Check size={14} /> Zimmetle
                        </button>
                    </div>
                )}
            </div>

            {mounted && <QRScannerModal isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} onCommandSubmit={handleScannerResult} mounted={mounted} />}
        </div>
    );
}
