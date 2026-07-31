import React, { useState, useEffect } from 'react';
import { Package, ScanBarcode, Check, UserCheck, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dynamic from "next/dynamic";
import { parseQRString } from '@/lib/qrResolver';
import { SearchableSelect } from '@/components/ui/searchable-select';

const QRScannerModal = dynamic(() => import("@/components/admin/operasyonlar/QRScannerModal"), { ssr: false });

export default function LojistikZimmetPanel({ operationId, membersData = [], isAdmin, isActive = true, mounted, currentUser }: any) {
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [selectedMember, setSelectedMember] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasLogisticsPermission, setHasLogisticsPermission] = useState(isAdmin);

    useEffect(() => {
        if (isAdmin) {
            setHasLogisticsPermission(true);
            return;
        }

        const checkLogisticsRole = async () => {
            try {
                const res = await fetch(`/api/settings/operations/${operationId}/roles`);
                if (res.ok) {
                    const roles = await res.json();
                    const isAssigned = roles.some((r: any) => 
                        (r.memberId === currentUser?.id || r.member?.email === currentUser?.email) &&
                        (r.roleTitle?.includes('Depocu') || r.roleTitle?.includes('Lojistik') || r.roleTitle?.includes('Kamp'))
                    );
                    setHasLogisticsPermission(isAssigned);
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (operationId) {
            checkLogisticsRole();
        }
    }, [operationId, isAdmin, currentUser]);

    const executeAssign = async (action: 'assign' | 'unassign', targetQr?: string, targetMember?: string) => {
        const activeQr = targetQr || qrCode;
        const activeMember = targetMember || selectedMember;

        if (!activeQr) {
            toast.error("Önce QR Kod okutun veya girin");
            return;
        }

        if (action === 'assign' && !activeMember) {
            toast.error("Lütfen zimmetlenecek personeli seçin");
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading(action === 'assign' ? "Ekipman zimmetleniyor..." : "Ekipman iade alınıyor...");

        try {
            const res = await fetch('/api/settings/operations/equipment-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrCode: activeQr,
                    operationId,
                    memberId: action === 'assign' ? activeMember : undefined,
                    action
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || (action === 'assign' ? "Ekipman başarıyla zimmetlendi!" : "Ekipman depoya iade alındı!"), { id: toastId });
                setQrCode("");
            } else {
                toast.error(data.error || "İşlem sırasında hata oluştu", { id: toastId });
            }
        } catch (error: any) {
            toast.error("Bağlantı hatası: " + (error?.message || String(error)), { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleScannerResult = (result: string) => {
        const parsed = parseQRString(result);
        
        // Smart Resolver: Check if scanned QR matches any member token or ID
        const matchedMember = membersData.find((m: any) => 
            m.id === parsed.cleanCode || 
            m.kimlikToken === parsed.cleanCode || 
            m.email === parsed.cleanCode ||
            parsed.possibleTokens.some(tok => tok === m.id || tok === m.kimlikToken || tok === m.email)
        );

        if (matchedMember || parsed.type === "MEMBER") {
            const memberIdToSet = matchedMember ? matchedMember.id : parsed.cleanCode;
            setSelectedMember(memberIdToSet);
            const memberName = matchedMember ? matchedMember.fullName : parsed.cleanCode;
            toast.success(`Personel Algılandı: ${memberName}`);

            // If an equipment QR was already scanned in the input, auto-trigger assign!
            if (qrCode) {
                executeAssign('assign', qrCode, memberIdToSet);
            }
        } else {
            // Equipment QR detected
            const equipmentCode = parsed.cleanCode || result;
            setQrCode(equipmentCode);

            // If a member is ALREADY selected, AUTO-EXECUTE ZİMMET!
            if (selectedMember) {
                executeAssign('assign', equipmentCode, selectedMember);
            } else {
                toast(`📦 Ekipman Algılandı: ${equipmentCode}. Şimdi zimmetlenecek personeli seçin!`);
            }
        }

        setIsScannerOpen(false);
    };

    const canOperate = (isAdmin || hasLogisticsPermission) && isActive;

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Package size={16} className="text-amber-400" /> Hızlı Ekipman Zimmet (QR - Depocu / Lojistik)
                </h3>
                {hasLogisticsPermission && !isAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold flex items-center gap-1">
                        <ShieldCheck size={10} /> LOJİSTİK YETKİLİSİ
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <input 
                        type="text"
                        placeholder="Cihaz/Personel QR veya Barkod Kodu..."
                        value={qrCode}
                        onChange={(e) => {
                            const parsed = parseQRString(e.target.value);
                            setQrCode(parsed.cleanCode);
                        }}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-amber-500"
                    />
                    <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="p-3 bg-amber-600/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-600/20 transition-colors flex items-center gap-2 text-xs font-bold"
                        title="Kamera ile QR Tara"
                    >
                        <ScanBarcode size={18} /> QR TARA
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <UserCheck size={16} className="text-neutral-500 shrink-0" />
                    <div className="flex-1">
                        <SearchableSelect 
                            value={selectedMember}
                            onChange={(val) => setSelectedMember(val)}
                            options={membersData.map((m: any) => ({
                                value: m.id,
                                label: `${m.fullName} ${m.telsizKodu ? `(${m.telsizKodu})` : ''}`
                            }))}
                            placeholder="Zimmetlenecek Personel Ara/Seç (veya Kimlik QR tara)..."
                        />
                    </div>
                </div>

                {canOperate ? (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button 
                            disabled={isProcessing}
                            onClick={() => executeAssign('unassign')}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} İade Al (Düş)
                        </button>
                        <button 
                            disabled={isProcessing}
                            onClick={() => executeAssign('assign')}
                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} QR İle Zimmetle
                        </button>
                    </div>
                ) : (
                    <div className="text-[11px] text-neutral-500 italic text-center p-2 bg-white/5 rounded-xl border border-white/5">
                        Zimmet yapmak için Lojistik / Depocu yetkisi veya Yönetici rolü gereklidir.
                    </div>
                )}
            </div>

            {mounted && <QRScannerModal isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} onCommandSubmit={handleScannerResult} mounted={mounted} />}
        </div>
    );
}
