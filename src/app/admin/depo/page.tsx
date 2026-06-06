"use client";

import { useState, useEffect, useRef } from "react";
import { 
    PackageSearch, PackagePlus, ScanBarcode, Search, Filter, 
    Box, Wrench, PackageCheck, AlertTriangle, X, User, CheckCircle, QrCode, PenTool
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";

import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";

const getExpirationWarning = (dateStr: string) => {
    if (!dateStr) return null;
    const expDate = new Date(dateStr);
    const today = new Date();
    expDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        return { status: "EXPIRED", msg: "MİADI DOLMUŞ! (" + dateStr + ")", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } else if (diffDays <= 30) {
        return { status: "WARNING", msg: `Miadı Yaklaşıyor (${diffDays} gün kaldı)`, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    return null;
};

const getMaintenanceWarning = (dateStr: string) => {
    if (!dateStr) return null;
    const maintDate = new Date(dateStr);
    const today = new Date();
    maintDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = maintDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
        return { status: "OVERDUE", msg: "Bakım Zamanı Geçmiş! (" + dateStr + ")", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } else if (diffDays <= 15) {
        return { status: "WARNING", msg: `Bakım Zamanı Yaklaşıyor (${diffDays} gün kaldı)`, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    }
    return null;
};

// containerItems içindeki object veya string değerleri her zaman string ID'ye normalize eder
const normalizeId = (val: any): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && val.id) return String(val.id);
    return String(val);
};

export default function DepoYonetimi() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("Tümü");
    
    // Drawers & Modals
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Kişisel Koruyucu");
    const [newItemType, setNewItemType] = useState("Demirbaş");
    const [newItemIsContainer, setNewItemIsContainer] = useState(false);
    const [newItemExpiration, setNewItemExpiration] = useState("");
    const [newItemMaintenance, setNewItemMaintenance] = useState("");
    const [scanMode, setScanMode] = useState<"equipment" | "member">("equipment");
    const [mounted, setMounted] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [kitItemSearch, setKitItemSearch] = useState(""); // Kit içeriği arama filtresi

    useEffect(() => {
        setMounted(true);
        const fetchData = async () => {
            try {
                const [invRes, memRes] = await Promise.all([
                    fetch("/api/inventory"),
                    fetch("/api/members")
                ]);
                const inv = await invRes.json();
                const mem = await memRes.json();
                setInventory(Array.isArray(inv) ? inv : []);
                setMembersData(Array.isArray(mem) ? mem : []);
            } catch (e) {
                console.error("Data fetch error", e);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    // QR Okuyucu Componenti (Modal)
    const QRScanner = () => {
        const [isCameraStarted, setIsCameraStarted] = useState(false);
        const [cameraError, setCameraError] = useState(false);
        const [cameraErrorMsg, setCameraErrorMsg] = useState("");
        const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

        useEffect(() => {
            if (!isScannerOpen) {
                setIsCameraStarted(false);
                setCameraError(false);
                setCameraErrorMsg("");
                if (html5QrCodeRef.current?.isScanning) {
                    html5QrCodeRef.current.stop().catch(() => {});
                }
            }
            return () => {
                if (html5QrCodeRef.current?.isScanning) {
                    html5QrCodeRef.current.stop().catch(() => {});
                }
            };
        }, [isScannerOpen]);

        const startCamera = async () => {
            try {
                // 1. Force native permission prompt first to ensure the browser actually asks
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    // Permission granted! Stop the stream so html5-qrcode can use it without conflict
                    stream.getTracks().forEach(track => track.stop());
                } catch (nativeErr: any) {
                    console.warn("Native getUserMedia with environment failed:", nativeErr);
                    // Try generic video if environment constraint failed
                    try {
                        const stream2 = await navigator.mediaDevices.getUserMedia({ video: true });
                        stream2.getTracks().forEach(track => track.stop());
                    } catch (nativeErr2: any) {
                        throw new Error(`Native Cam Err: ${nativeErr2.name || nativeErr2.message || String(nativeErr2)}`);
                    }
                }

                if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode("reader");
                }

                const startWithConfig = async (config: any) => {
                    return html5QrCodeRef.current?.start(
                        config,
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            html5QrCodeRef.current?.stop().then(() => {
                                setIsScannerOpen(false);
                                handleScanSuccess(decodedText);
                            }).catch(() => {
                                setIsScannerOpen(false);
                                handleScanSuccess(decodedText);
                            });
                        },
                        () => {}
                    );
                };

                try {
                    await startWithConfig({ facingMode: "environment" });
                } catch (e: any) {
                    console.warn("Environment config failed, trying getCameras fallback", e);
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        const backCamera = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("arka"));
                        await startWithConfig(backCamera ? backCamera.id : devices[0].id);
                    } else {
                        throw new Error(`HTML5QR Err: ${e.name || e.message || String(e)}`);
                    }
                }

                setIsCameraStarted(true);
                setCameraError(false);
            } catch (err: any) {
                console.error("Camera start failed completely:", err);
                setCameraError(true);
                setCameraErrorMsg(err.message || String(err));
                setIsCameraStarted(false);
            }
        };

        const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                try {
                    if (!html5QrCodeRef.current) {
                        html5QrCodeRef.current = new Html5Qrcode("reader");
                    }
                    const decodedText = await html5QrCodeRef.current.scanFile(file, true);
                    setIsScannerOpen(false);
                    handleScanSuccess(decodedText);
                } catch (err) {
                    console.error("File scan failed", err);
                    alert("QR kod okunamadı. Lütfen daha net bir fotoğraf çekin.");
                }
            }
        };

        if (!isScannerOpen) return null;

        const portalContent = (
            <div className="fixed inset-0 bg-black/90 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <button 
                    onClick={() => setIsScannerOpen(false)}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <X size={24} />
                </button>
                
                <div className="text-center mb-8">
                    <ScanBarcode size={48} className="mx-auto text-red-500 mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                        {scanMode === "equipment" ? "Ekipman Barkodu Okutun" : "Personel Kimlik Kartını Okutun"}
                    </h2>
                    <p className="text-neutral-400 mt-2 text-sm">Kameranızı karekoda doğru tutun veya fotoğraf çekin.</p>
                </div>

                <div className="w-full max-w-md bg-black rounded-3xl border-2 border-white/10 shadow-[0_0_50px_rgba(239,68,68,0.3)] p-4 flex flex-col gap-4">
                    {!isCameraStarted && !cameraError && (
                        <button 
                            onClick={startCamera} 
                            className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold uppercase tracking-widest transition-colors"
                        >
                            Kamerayı Aç / QR Okut
                        </button>
                    )}
                    
                    <div id="reader" className="w-full bg-black rounded-xl overflow-hidden"></div>

                    {cameraError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center">
                            <p className="text-sm text-red-400 font-bold uppercase tracking-widest mb-2 text-center">Kamera Erişimi Sağlanamadı</p>
                            <p className="text-xs text-neutral-400 text-center mb-1">
                                Tarayıcınız kamerayı engelliyor olabilir. Lütfen tarayıcı ayarlarından (Site Ayarları) izin verin veya aşağıdaki alternatifi kullanın.
                            </p>
                            <div className="bg-black/30 px-3 py-2 rounded-lg text-[10px] text-red-300 font-mono mb-4 text-center break-all">
                                HATA: {cameraErrorMsg || "Bilinmeyen Hata"}
                            </div>
                            <label className="w-full flex flex-col items-center justify-center py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl cursor-pointer transition-colors text-center">
                                <span className="font-bold uppercase tracking-widest text-xs mb-1">Kameradan Çek / Fotoğraf Yükle</span>
                                <span className="text-[10px] text-blue-500/70">Alternatif Tarama Yöntemi</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                />
                            </label>
                        </div>
                    )}
                </div>
            </div>
        );

        return mounted ? createPortal(portalContent, document.body) : null;
    };

    const handleScanSuccess = (text: string) => {
        if (scanMode === "equipment") {
            // Barkod genelde id içerir veya m1g.org.tr/eq/eq-001 formatındadır
            let eqId = text.split('/').filter(Boolean).pop() || text;
            eqId = eqId.split('?')[0]; // Query string'i at
            eqId = eqId.split('#')[0]; // Hash'i at
            
            const item = inventory.find(i => i.id?.toLowerCase() === eqId.toLowerCase());
            if (item) {
                setSelectedItem(item);
            } else {
                alert("Bu koda ait bir ekipman depoda bulunamadı!");
            }
        } else if (scanMode === "member" && selectedItem) {
            // Zimmet için üye kartı okutuldu
            // Kimlik URL'sinden ID'yi al (Query parametrelerini temizle)
            let rawId = text.split('/').filter(Boolean).pop() || text;
            rawId = rawId.split('?')[0]; // Query string'i at
            rawId = rawId.split('#')[0]; // Hash'i at
            
            let member = membersData.find(m => m.id?.toLowerCase() === rawId.toLowerCase());
            
            // Eğer string id bulunamazsa, eski sistem olan indeks (sayı) tabanlı aramayı dene
            if (!member && !isNaN(parseInt(rawId))) {
                const index = parseInt(rawId) - 1;
                if (index >= 0 && index < membersData.length) {
                    member = membersData[index];
                }
            }
            
            if (member) {
                assignItemToMember(selectedItem.id, member.id, member.fullName);
            } else {
                alert(`Personel sistemde bulunamadı! (Okunan Kod: ${rawId})`);
            }
        }
    };

    const assignItemToMember = async (itemId: string, memberId: string, memberName: string) => {
        if(confirm(`"${selectedItem.name}" adlı ekipman "${memberName}" isimli personele zimmetlenecektir. Onaylıyor musunuz?`)) {
            const updated = { ...selectedItem, status: "Zimmetli", assignedToId: memberId };
            const res = await fetch("/api/inventory", {
                method: "PUT",
                body: JSON.stringify(updated)
            });
            if(res.ok) {
                setInventory(inventory.map(i => i.id === itemId ? updated : i));
                setSelectedItem(updated);
                alert("Zimmet işlemi başarıyla gerçekleşti.");
            } else {
                alert("Zimmet işlemi sunucuda başarısız oldu.");
            }
        }
    };

    // Mevcut bir malzemeyi Kit/Konteyner'e dönüştür
    const convertToKit = async () => {
        if (!selectedItem) return;
        if (!confirm(`"${selectedItem.name}" malzemesini bir Kit/Konteyner'e dönüştürmek istiyor musunuz? Bu işlem geri alınabilir.`)) return;
        const updatedItem = { ...selectedItem, isContainer: true, containerItems: selectedItem.containerItems || [] };
        const res = await fetch("/api/inventory", {
            method: "PUT",
            body: JSON.stringify(updatedItem)
        });
        if (res.ok) {
            setSelectedItem(updatedItem);
            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
        }
    };

    // Kit'ten normal malzemeye geri dönüştür
    const convertFromKit = async () => {
        if (!selectedItem) return;
        if (!confirm(`"${selectedItem.name}" kitini normal malzemeye geri dönüştürmek istiyor musunuz? İçindeki ${(selectedItem.containerItems||[]).length} malzeme bağı kaldırılacak.`)) return;
        const updatedItem = { ...selectedItem, isContainer: false, containerItems: [] };
        const res = await fetch("/api/inventory", {
            method: "PUT",
            body: JSON.stringify(updatedItem)
        });
        if (res.ok) {
            setSelectedItem(updatedItem);
            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
        }
    };

    const returnItem = async (itemId: string) => {
        if(confirm("Bu ekipmanı depoya geri almak istediğinize emin misiniz?")) {
            const updated = { ...selectedItem, status: "Depoda", assignedToId: null };
            const res = await fetch("/api/inventory", {
                method: "PUT",
                body: JSON.stringify(updated)
            });
            if(res.ok) {
                setInventory(inventory.map(i => i.id === itemId ? updated : i));
                setSelectedItem(updated);
            } else {
                alert("İşlem başarısız.");
            }
        }
    };

    const startAssignProcess = () => {
        setScanMode("member");
        setIsScannerOpen(true);
    };

    const handleAddNewItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        const newId = `eq-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
        const newItem: any = {
            id: newId,
            name: newItemName,
            category: newItemCategory,
            status: "Depoda",
            assignedToId: null,
            lastMaintenance: "-",
            condition: "Yeni",
            type: newItemType,
            isContainer: newItemIsContainer,
            expirationDate: newItemExpiration ? newItemExpiration : null,
            maintenanceDate: newItemMaintenance ? newItemMaintenance : null
        };

        if (newItemIsContainer) {
            newItem.containerItems = [];
        }

        const res = await fetch("/api/inventory", {
            method: "POST",
            body: JSON.stringify(newItem)
        });
        
        if (res.ok) {
            setInventory([newItem, ...inventory]);
            setIsAddModalOpen(false);
            setNewItemName("");
            setNewItemExpiration("");
            setNewItemMaintenance("");
            setNewItemIsContainer(false);
            setSelectedItem(newItem);
        } else {
            alert("Kayıt başarısız.");
        }
    };

    const updateItemDetails = async (field: string, value: string | null) => {
        const updatedItem = { ...selectedItem, [field]: value };
        
        if (field === 'condition') {
            if (value === 'Arızalı' && updatedItem.status === 'Depoda') {
                updatedItem.status = 'Bakımda';
            } else if (selectedItem.condition === 'Arızalı' && value !== 'Arızalı' && updatedItem.status === 'Bakımda') {
                updatedItem.status = 'Depoda';
            }
        }

        const res = await fetch("/api/inventory", {
            method: "PUT",
            body: JSON.stringify(updatedItem)
        });
        
        if (res.ok) {
            setSelectedItem(updatedItem);
            setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
        }
    };

    const filteredInventory = inventory.filter(i => 
        (i.name.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())) &&
        (filterStatus === "Tümü" || i.status === filterStatus)
    );

    // Helpers for UI
    const statusColors: any = {
        "Depoda": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        "Zimmetli": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "Bakımda": "bg-amber-500/10 text-amber-400 border-amber-500/20",
        "Kayıp/Hurda": "bg-red-500/10 text-red-500 border-red-500/20"
    };

    const renderItemDrawer = () => {
        if (!selectedItem || !mounted) return null;

        const assignedMember = selectedItem.assignedToId ? membersData.find(m => m.id === selectedItem.assignedToId) : null;
        const expWarning = selectedItem.expirationDate ? getExpirationWarning(selectedItem.expirationDate) : null;
        const maintWarning = selectedItem.maintenanceDate ? getMaintenanceWarning(selectedItem.maintenanceDate) : null;

        const content = (
            <AnimatePresence>
                <div className="portal-root">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={() => setSelectedItem(null)}
                    />
                    <motion.div 
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-[100dvh] w-full max-w-lg bg-[#050B14] border-l border-white/10 z-[9999] shadow-2xl overflow-y-auto flex flex-col"
                    >
                        <div className="p-6 md:p-8 bg-neutral-900/50 border-b border-white/5 relative">
                            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-5 mt-4">
                                <div className="w-20 h-20 bg-black border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                    <Box size={40} className="opacity-50" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedItem.name}</h2>
                                    <p className="text-neutral-500 text-sm font-mono mt-1">Barkod: {selectedItem.id}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${statusColors[selectedItem.status]}`}>
                                            {selectedItem.status}
                                        </span>
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-neutral-400 text-[10px] uppercase font-bold tracking-wider rounded-full">
                                            {selectedItem.category}
                                        </span>
                                        <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                                            selectedItem.type === "KKE" 
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        }`}>
                                            {selectedItem.type === "KKE" ? "KKE (Şahsi)" : "Demirbaş"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 flex-1 space-y-6">
                            
                            {/* Uyarılar */}
                            {(expWarning || maintWarning) && (
                                <div className="space-y-3">
                                    {expWarning && (
                                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${expWarning.color}`}>
                                            <AlertTriangle size={18} className="shrink-0 animate-bounce" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider">MİAD UYARISI</p>
                                                <p className="text-sm font-semibold">{expWarning.msg}</p>
                                            </div>
                                        </div>
                                    )}
                                    {maintWarning && (
                                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${maintWarning.color}`}>
                                            <Wrench size={18} className="shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider">BAKIM UYARISI</p>
                                                <p className="text-sm font-semibold">{maintWarning.msg}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Karekod Çıktısı Alanı */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center justify-center gap-2">
                                    <QrCode size={16} className="text-red-500"/> Ekipman Karekodu
                                </h3>
                                {/* QR Etiket - İndirilebilir */}
                                <div
                                    id={`qr-label-${selectedItem.id}`}
                                    className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto mb-2"
                                    style={{ textAlign: "center" }}
                                >
                                    <QRCodeSVG value={`https://m1g.org.tr/eq/${selectedItem.id}`} size={120} level="H" />
                                    <div style={{ marginTop: "8px", fontFamily: "sans-serif", fontSize: "11px", color: "#111", fontWeight: "800", letterSpacing: "0.03em", maxWidth: "128px", wordBreak: "break-word" }}>
                                        {selectedItem.name}
                                    </div>
                                    <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#555", marginTop: "3px", letterSpacing: "0.1em" }}>
                                        {selectedItem.id}
                                    </div>
                                    <div style={{ fontSize: "8px", color: "#888", marginTop: "2px", letterSpacing: "0.05em" }}>
                                        M1G ARAMA KURTARMA DERNEĞİ
                                    </div>
                                </div>
                                <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-4">Etiket yazıcısından çıkartıp malzemenin üzerine yapıştırın.</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const html2canvas = (await import("html2canvas")).default;
                                            const el = document.getElementById(`qr-label-${selectedItem.id}`);
                                            if (!el) return;
                                            const canvas = await html2canvas(el, { scale: 4, backgroundColor: "#ffffff" });
                                            const link = document.createElement("a");
                                            link.download = `M1G_QR_${selectedItem.id}.png`;
                                            link.href = canvas.toDataURL("image/png");
                                            link.click();
                                        } catch { alert("İndirme başarısız."); }
                                    }}
                                    className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                >
                                    <QrCode size={14} /> QR Etiketi İndir (PNG)
                                </button>
                            </div>

                            {/* Kit İçeriği Yönetimi — Dinamik */}
                            {selectedItem.isContainer ? (
                                <div className="bg-[#020617] border border-purple-500/20 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                            <Box size={16} className="text-purple-400"/> Kit İçeriği
                                            <span className="bg-purple-500/20 text-purple-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                                                {(selectedItem.containerItems || []).length} malzeme
                                            </span>
                                        </h3>
                                        <button
                                            onClick={convertFromKit}
                                            className="text-[9px] text-neutral-500 hover:text-red-400 font-bold uppercase tracking-wider transition-colors"
                                            title="Bu kiti normal malzemeye dönüştür"
                                        >
                                            Kiti Dağıt
                                        </button>
                                    </div>

                                    {/* Mevcut Kit İçeriği */}
                                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                        {(selectedItem.containerItems || []).map((rawId: any, idx: number) => {
                                            const cId = normalizeId(rawId);
                                            const subItem = inventory.find((i: any) => i.id === cId);
                                            if (!subItem) return (
                                                <div key={`missing-${cId}-${idx}`} className="flex justify-between items-center bg-red-500/5 p-2 rounded-lg border border-red-500/10 text-xs">
                                                    <span className="text-red-400 font-mono">{cId} — Malzeme bulunamadı (silinmiş olabilir)</span>
                                                    <button onClick={async () => {
                                                        const updatedList = (selectedItem.containerItems || []).filter((id: string) => id !== cId);
                                                        const updated = { ...selectedItem, containerItems: updatedList };
                                                        await fetch("/api/inventory", { method: "PUT", body: JSON.stringify(updated) });
                                                        setSelectedItem(updated);
                                                        setInventory(inventory.map((i: any) => i.id === updated.id ? updated : i));
                                                    }} className="text-red-400 hover:text-red-300 text-[9px] font-bold uppercase">Temizle</button>
                                                </div>
                                            );
                                            return (
                                                <div key={`item-${cId}-${idx}`} className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 text-xs group hover:border-purple-500/20 transition-colors">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                            subItem.status === 'Depoda' ? 'bg-emerald-400' :
                                                            subItem.status === 'Zimmetli' ? 'bg-blue-400' :
                                                            subItem.status === 'Bakımda' ? 'bg-amber-400' : 'bg-red-400'
                                                        }`} />
                                                        <div>
                                                            <span className="text-white font-semibold">{subItem.name}</span>
                                                            <span className="text-[10px] text-neutral-500 font-mono block">{subItem.category} • <span className={`${
                                                                subItem.status === 'Depoda' ? 'text-emerald-400' :
                                                                subItem.status === 'Zimmetli' ? 'text-blue-400' : 'text-amber-400'
                                                            } font-bold`}>{subItem.status}</span></span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            const updatedList = (selectedItem.containerItems || [])
                                                                .map(normalizeId)
                                                                .filter((id: string) => id !== cId);
                                                            const updatedItem = { ...selectedItem, containerItems: updatedList };
                                                            const res = await fetch("/api/inventory", {
                                                                method: "PUT",
                                                                body: JSON.stringify(updatedItem)
                                                            });
                                                            if (res.ok) {
                                                                setSelectedItem(updatedItem);
                                                                setInventory(inventory.map((i: any) => i.id === updatedItem.id ? updatedItem : i));
                                                            }
                                                        }}
                                                        className="text-[10px] text-neutral-600 hover:text-red-400 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all px-2 py-1 hover:bg-red-500/10 rounded"
                                                    >
                                                        ✕ Çıkar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {(selectedItem.containerItems || []).length === 0 && (
                                            <div className="text-center py-6">
                                                <Box size={28} className="text-neutral-700 mx-auto mb-2" />
                                                <p className="text-xs text-neutral-500 italic">Bu kit henüz boş. Aşağıdan malzeme ekleyin.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kite Malzeme / Kit Ekleme — Arama Filtreli */}
                                    <div className="pt-3 border-t border-white/5 space-y-2">
                                        <span className="text-[10px] text-purple-400 uppercase tracking-widest font-extrabold block flex items-center gap-1">
                                            ＋ Kite Malzeme Ekle
                                        </span>
                                        {/* Arama Kutusu */}
                                        <input
                                            type="text"
                                            placeholder="Malzeme adı veya barkod ara..."
                                            value={kitItemSearch}
                                            onChange={e => setKitItemSearch(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 focus:border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-600"
                                        />
                                        {/* Filtrelenmiş Malzeme Listesi */}
                                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                            {inventory
                                                .filter((i: any) =>
                                                    i.id !== selectedItem.id &&
                                                    !(selectedItem.containerItems || []).includes(i.id) &&
                                                    (kitItemSearch === "" ||
                                                        i.name.toLowerCase().includes(kitItemSearch.toLowerCase()) ||
                                                        i.id.toLowerCase().includes(kitItemSearch.toLowerCase()) ||
                                                        (i.category || "").toLowerCase().includes(kitItemSearch.toLowerCase())
                                                    )
                                                )
                                                .slice(0, 15)
                                                .map((i: any) => (
                                                    <button
                                                        key={i.id}
                                                        onClick={async () => {
                                                            const updatedList = [...(selectedItem.containerItems || []).map(normalizeId), i.id];
                                                            const updatedItem = { ...selectedItem, containerItems: updatedList };
                                                            const res = await fetch("/api/inventory", {
                                                                method: "PUT",
                                                                body: JSON.stringify(updatedItem)
                                                            });
                                                            if (res.ok) {
                                                                setSelectedItem(updatedItem);
                                                                setInventory(inventory.map((inv: any) => inv.id === updatedItem.id ? updatedItem : inv));
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-between px-3 py-2 bg-white/3 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent rounded-lg text-xs transition-all text-left group"
                                                    >
                                                        <div>
                                                            <span className="text-white font-semibold group-hover:text-purple-200 transition-colors">{i.name}</span>
                                                            <span className="text-neutral-600 font-mono block text-[9px]">{i.id} • {i.category} {i.isContainer ? '• Kit' : ''}</span>
                                                        </div>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                            i.status === 'Depoda' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            i.status === 'Zimmetli' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                                        }`}>{i.status}</span>
                                                    </button>
                                                ))
                                            }
                                            {inventory.filter((i: any) =>
                                                i.id !== selectedItem.id &&
                                                !(selectedItem.containerItems || []).includes(i.id) &&
                                                (kitItemSearch === "" ||
                                                    i.name.toLowerCase().includes(kitItemSearch.toLowerCase()) ||
                                                    i.id.toLowerCase().includes(kitItemSearch.toLowerCase())
                                                )
                                            ).length === 0 && (
                                                <p className="text-center text-xs text-neutral-600 py-3 italic">
                                                    {kitItemSearch ? `"${kitItemSearch}" için sonuç bulunamadı` : 'Tüm malzemeler zaten bu kitte'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Normal malzeme — Kit'e dönüştür butonu */
                                <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-4 text-center">
                                    <Box size={22} className="text-neutral-600 mx-auto mb-2" />
                                    <p className="text-xs text-neutral-500 mb-3">Bu malzeme bir Kit/Konteyner değil.</p>
                                    <button
                                        onClick={convertToKit}
                                        className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        📦 Kit / Konteyner'e Dönüştür
                                    </button>
                                </div>
                            )}

                            {/* Zimmet Durumu */}
                            <div className="bg-[#020617] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                                    <User size={16} className="text-blue-500"/> Zimmet Durumu
                                </h3>
                                
                                {selectedItem.status === "Zimmetli" && assignedMember ? (
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center font-bold">
                                                {assignedMember.fullName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{assignedMember.fullName}</p>
                                                <p className="text-neutral-500 text-xs">Şu an bu personelde.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => returnItem(selectedItem.id)}
                                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <PackageCheck size={16} /> Depoya Geri Al
                                        </button>
                                    </div>
                                ) : selectedItem.status === "Depoda" ? (
                                    <div className="text-center py-4">
                                        <CheckCircle size={32} className="mx-auto text-emerald-500 mb-3" />
                                        <p className="text-white font-medium mb-6">Malzeme şu an depoda ve zimmete hazır.</p>
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={startAssignProcess}
                                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                            >
                                                <ScanBarcode size={18} /> Personele Zimmetle (Kart Okut)
                                            </button>

                                            <div className="relative">
                                                <select
                                                    className="w-full py-3 pl-4 pr-10 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-neutral-300 text-xs font-semibold tracking-wider uppercase outline-none focus:border-blue-500/50 appearance-none cursor-pointer transition-colors"
                                                    onChange={(e) => {
                                                        const memberId = e.target.value;
                                                        if (!memberId) return;
                                                        const member = membersData.find(m => m.id === memberId);
                                                        if (member) {
                                                            assignItemToMember(selectedItem.id, member.id, member.fullName);
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                >
                                                    <option value="" className="bg-[#050B14]">Manuel Personel Seç...</option>
                                                    {membersData.map(m => (
                                                        <option key={m.id} value={m.id} className="bg-[#050B14] text-white">
                                                            {m.fullName}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <User size={14} className="text-neutral-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
                                        <p className="text-neutral-400 text-sm">Bu malzeme şu an operasyonel değil ({selectedItem.status}).</p>
                                    </div>
                                )}
                            </div>

                            {/* Ayarlanabilir Sınıflandırma ve Tarihler */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#020617] border border-white/5 p-4 rounded-xl relative group col-span-2">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                                        <span>Sınıflandırma</span>
                                        <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <select 
                                        value={selectedItem.type || "Demirbaş"}
                                        onChange={(e) => updateItemDetails('type', e.target.value)}
                                        className="w-full bg-transparent text-white font-medium focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Demirbaş" className="bg-black">Demirbaş (Saha Ekipmanı)</option>
                                        <option value="KKE" className="bg-black">KKE (Kişisel Koruyucu)</option>
                                    </select>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative group">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                                        <span>Son Kullanma Tarihi (Miad)</span>
                                        <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input 
                                        type="date"
                                        value={selectedItem.expirationDate || ""}
                                        onChange={(e) => updateItemDetails('expirationDate', e.target.value || null)}
                                        className="w-full bg-transparent text-white font-mono focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative group">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                                        <span>Planlı Bakım Zamanı</span>
                                        <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input 
                                        type="date"
                                        value={selectedItem.maintenanceDate || ""}
                                        onChange={(e) => updateItemDetails('maintenanceDate', e.target.value || null)}
                                        className="w-full bg-transparent text-white font-mono focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Fiziksel Durum */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative group">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                                        <span>Fiziksel Durum</span>
                                        <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <select 
                                        value={selectedItem.condition}
                                        onChange={(e) => updateItemDetails('condition', e.target.value)}
                                        className="w-full bg-transparent text-white font-medium focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Yeni" className="bg-black">Yeni</option>
                                        <option value="İyi" className="bg-black">İyi</option>
                                        <option value="Yıpranmış" className="bg-black">Yıpranmış</option>
                                        <option value="Arızalı" className="bg-black">Arızalı</option>
                                    </select>
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl relative group">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1 flex items-center justify-between">
                                        <span>Son Bakım (Geçmiş)</span>
                                        <PenTool size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input 
                                        type="date"
                                        value={selectedItem.lastMaintenance === "-" ? "" : selectedItem.lastMaintenance}
                                        onChange={(e) => updateItemDetails('lastMaintenance', e.target.value || "-")}
                                        className="w-full bg-transparent text-white font-mono focus:outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>
                            
                            {selectedItem.status !== "Bakımda" && (
                                <button 
                                    onClick={() => updateItemDetails('status', 'Bakımda')}
                                    className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Wrench size={16} /> Bakıma Gönder / Arıza Bildir
                                </button>
                            )}
                            {selectedItem.status === "Bakımda" && (
                                <button 
                                    onClick={() => updateItemDetails('status', 'Depoda')}
                                    className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CheckCircle size={16} /> Bakım Tamamlandı (Depoya Al)
                                </button>
                            )}
                            
                            {/* Tehlikeli İşlemler */}
                            <div className="pt-6 border-t border-red-500/10 mt-6">
                                <button 
                                    onClick={async () => {
                                        if (confirm(`DIKKAT: "${selectedItem.name}" adlı ekipmanı sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
                                            const res = await fetch("/api/inventory", {
                                                method: "DELETE",
                                                body: JSON.stringify({ id: selectedItem.id })
                                            });
                                            if (res.ok) {
                                                setInventory(inventory.filter(i => i.id !== selectedItem.id));
                                                setSelectedItem(null);
                                            } else {
                                                alert("Silme başarısız.");
                                            }
                                        }
                                    }}
                                    className="w-full py-3 bg-transparent hover:bg-red-500/10 text-neutral-500 hover:text-red-500 border border-transparent hover:border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                                >
                                    <X size={16} /> Demirbaşı Sistemden Kalıcı Olarak Sil
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );

        return createPortal(content, document.body);
    };

    const renderAddModal = () => {
        if (!isAddModalOpen || !mounted) return null;

        const content = (
            <div className="portal-root">
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99990] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#050B14] border border-white/10 rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PackagePlus size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Yeni Ekipman Ekle</h2>
                            <p className="text-neutral-500 text-sm mt-2">Eklenen ekipmana anında QR kod üretilir.</p>
                        </div>

                        <form onSubmit={handleAddNewItem} className="space-y-4">
                            <div>
                               <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Ekipman Sınıfı</label>
                               <select 
                                   value={newItemType}
                                   onChange={(e) => setNewItemType(e.target.value)}
                                   className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                               >
                                   <option value="Demirbaş">Demirbaş (Saha Ekipmanı)</option>
                                   <option value="KKE">KKE (Kişisel Koruyucu Donanım)</option>
                               </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Ekipman Adı / Modeli</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Örn: Aselsan El Telsizi V2"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Kategori</label>
                                <select 
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                >
                                    <option value="Araç">Motorlu Araç (4x4, Motosiklet)</option>
                                    <option value="Hava Gözlem">Hava Gözlem (Drone)</option>
                                    <option value="Kişisel Koruyucu">Kişisel Koruyucu (Baret, Gözlük)</option>
                                    <option value="Haberleşme">Haberleşme (Telsiz, Uydu)</option>
                                    <option value="Kıyafet">Kıyafet (Yelek, Mont)</option>
                                    <option value="Navigasyon">Navigasyon (GPS)</option>
                                    <option value="Enerji">Enerji (Jeneratör, Güneş Paneli)</option>
                                    <option value="Enkaz Müdahale">Enkaz Müdahale (Kırıcı, Ayırıcı)</option>
                                    <option value="Tıbbi">Tıbbi Ekipman</option>
                                    <option value="Diğer">Diğer Araç Gereç</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 py-1">
                                <input 
                                    type="checkbox" 
                                    id="newItemIsContainer"
                                    checked={newItemIsContainer}
                                    onChange={(e) => setNewItemIsContainer(e.target.checked)}
                                    className="w-4 h-4 bg-black/50 border border-white/10 rounded accent-red-600 cursor-pointer"
                                />
                                <label htmlFor="newItemIsContainer" className="text-xs font-bold text-neutral-400 cursor-pointer select-none">
                                    Bu Ekipman Bir Konteyner/Kit mi?
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Son Kullanma Tarihi</label>
                                    <input 
                                        type="date" 
                                        value={newItemExpiration}
                                        onChange={(e) => setNewItemExpiration(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-1">Planlı Bakım Tarihi</label>
                                    <input 
                                        type="date" 
                                        value={newItemMaintenance}
                                        onChange={(e) => setNewItemMaintenance(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                type="submit"
                                className="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            >
                                Kaydet ve Karekod Üret
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        );

        return createPortal(content, document.body);
    };

    return (
        <div className="space-y-8 pb-20 relative">
            <QRScanner />
            {renderItemDrawer()}
            {renderAddModal()}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                        <PackageSearch className="text-red-500" size={28} /> Depo & Lojistik Üssü
                    </h1>
                    <p className="text-neutral-500 text-sm md:text-lg font-light italic">Araç, drone ve kişisel donanım zimmet merkezi.</p>
                </div>
                
                {/* HIZLI KAMERA BUTONU */}
                <button 
                    onClick={() => { setScanMode("equipment"); setIsScannerOpen(true); }}
                    className="group relative px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform"></div>
                    <ScanBarcode size={20} className="relative z-10 animate-pulse" /> 
                    <span className="relative z-10">Kamerayı Aç (Okut)</span>
                </button>
            </div>

            {/* İSTATİSTİK WIDGETLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Toplam Malzeme", val: inventory.length, icon: <Box size={20} className="text-white" />, color: "bg-neutral-800" },
                    { label: "Depoda (Hazır)", val: inventory.filter(i => i.status === "Depoda").length, icon: <CheckCircle size={20} className="text-emerald-500" />, color: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" },
                    { label: "Zimmetli Sahada", val: inventory.filter(i => i.status === "Zimmetli").length, icon: <User size={20} className="text-blue-500" />, color: "bg-blue-500/10 border border-blue-500/20 text-blue-400" },
                    { label: "Bakımda / Arızalı", val: inventory.filter(i => i.status === "Bakımda" || i.status === "Kayıp/Hurda").length, icon: <Wrench size={20} className="text-amber-500" />, color: "bg-amber-500/10 border border-amber-500/20 text-amber-400" }
                ].map((stat, i) => (
                    <div key={i} className={`p-5 rounded-2xl flex flex-col justify-between h-28 ${stat.color}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{stat.label}</span>
                            {stat.icon}
                        </div>
                        <div className="text-3xl font-black">{stat.val}</div>
                    </div>
                ))}
            </div>

            {/* FİLTRELEME VE TABLO */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/5 bg-black/40 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                            <input
                                type="text"
                                placeholder="Ekipman adı veya barkod ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full md:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <PackagePlus size={16} /> Yeni Ekipman Girişi
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest mr-2 flex items-center gap-1"><Filter size={14}/> Durum:</span>
                        {['Tümü', 'Depoda', 'Zimmetli', 'Bakımda', 'Kayıp/Hurda'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    filterStatus === status 
                                    ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400 min-w-[600px]">
                        <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5 font-bold">Barkod & Ekipman</th>
                                <th className="px-6 py-5 font-bold">Kategori</th>
                                <th className="px-6 py-5 font-bold">Mevcut Durum</th>
                                <th className="px-6 py-5 font-bold">Zimmet / Lokasyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInventory.map((item) => (
                                <tr key={item.id} onClick={() => setSelectedItem(item)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-black border border-white/10 rounded-lg flex items-center justify-center text-white/50 group-hover:text-red-500 transition-colors">
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors">{item.name}</h4>
                                                    {item.isContainer && (
                                                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20 uppercase tracking-wider shrink-0">
                                                            📦 Kit
                                                        </span>
                                                    )}
                                                    {/* Kit içinde mi? */}
                                                    {(() => {
                                                        const parentKit = inventory.find((k: any) =>
                                                            k.isContainer &&
                                                            (k.containerItems || []).map(normalizeId).includes(item.id)
                                                        );
                                                        return parentKit ? (
                                                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider shrink-0" title={`Kit: ${parentKit.name}`}>
                                                                └ {parentKit.name}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                    {item.expirationDate && (() => {
                                                        const warn = getExpirationWarning(item.expirationDate);
                                                        return warn ? <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" title={warn.msg} /> : null;
                                                    })()}
                                                    {item.maintenanceDate && (() => {
                                                        const warn = getMaintenanceWarning(item.maintenanceDate);
                                                        return warn ? <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title={warn.msg} /> : null;
                                                    })()}
                                                    <span className={`text-[8px] font-extrabold px-1 rounded uppercase tracking-wider shrink-0 ${
                                                        item.type === "KKE" ? "bg-purple-500/20 text-purple-400 border border-purple-500/20" : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                                                    }`}>
                                                        {item.type || "Demirbaş"}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/5">{item.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 inline-flex text-[9px] uppercase font-bold tracking-wider rounded-full border ${statusColors[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === "Zimmetli" && item.assignedToId ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-500" />
                                                <span className="text-white text-xs font-medium">
                                                    {membersData.find(m => m.id === item.assignedToId)?.fullName || item.assignedToId}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-600 text-xs italic">Merkez Depo</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredInventory.length === 0 && (
                        <div className="p-16 text-center text-neutral-500">
                            <Box className="mx-auto w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">Kriterlere uygun ekipman bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
