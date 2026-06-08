"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import { X, ScanBarcode } from "lucide-react";

interface QRScannerModalProps {
    isScannerOpen: boolean;
    setIsScannerOpen: (val: boolean) => void;
    onCommandSubmit: (val: string) => void;
    mounted: boolean;
}

export default function QRScannerModal({ isScannerOpen, setIsScannerOpen, onCommandSubmit, mounted }: QRScannerModalProps) {
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
                            onCommandSubmit(decodedText);
                        }).catch(() => {
                            setIsScannerOpen(false);
                            onCommandSubmit(decodedText);
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
                onCommandSubmit(decodedText);
            } catch (err) {
                console.error("File scan failed", err);
                alert("QR kod okunamadı. Lütfen daha net bir fotoğraf çekin.");
            }
        }
    };

    if (!isScannerOpen) return null;

    const portalContent = (
        <div className="fixed inset-0 bg-black/90 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <button onClick={() => setIsScannerOpen(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X size={24} />
            </button>
            <div className="text-center mb-8">
                <ScanBarcode size={48} className="mx-auto text-red-500 mb-4 " />
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Hızlı Sevk Barkod Okuyucu</h2>
                <p className="text-neutral-400 mt-2 text-sm font-light">Üye kimlik QR kodunu veya envanter barkodunu gösterin veya fotoğraf yükleyin.</p>
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
}
