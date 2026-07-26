"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanBarcode, Camera, Upload, Check } from "lucide-react";
import { parseQRString } from "@/lib/qrResolver";

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
    const [manualCode, setManualCode] = useState("");
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (!isScannerOpen) {
            setIsCameraStarted(false);
            setCameraError(false);
            setCameraErrorMsg("");
            setManualCode("");
            stopCamera();
        } else {
            // Auto start camera when modal opens
            const timer = setTimeout(() => {
                startCamera();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isScannerOpen]);

    const stopCamera = async () => {
        try {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }
        } catch (e) {
            console.warn("Error stopping camera", e);
        }
    };

    const startCamera = async () => {
        setCameraError(false);
        setCameraErrorMsg("");

        try {
            // 1. Force native permission check first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                stream.getTracks().forEach(track => track.stop());
            } catch (nativeErr: any) {
                try {
                    const stream2 = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream2.getTracks().forEach(track => track.stop());
                } catch (nativeErr2: any) {
                    throw new Error(`Kamera İzni Alınamadı: ${nativeErr2.name || nativeErr2.message || String(nativeErr2)}`);
                }
            }

            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode("reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false
                });
            }

            // Enhanced scanner config for maximum QR detection sensitivity
            const qrScannerConfig = {
                fps: 20, // 20 frames per sec for fast scanning on moving cameras
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    const minDim = Math.min(viewfinderWidth, viewfinderHeight);
                    return {
                        width: Math.floor(minDim * 0.8),
                        height: Math.floor(minDim * 0.8)
                    };
                },
                aspectRatio: 1.0,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };

            const onScanSuccess = async (decodedText: string) => {
                const parsed = parseQRString(decodedText);
                await stopCamera();
                setIsScannerOpen(false);
                onCommandSubmit(parsed.cleanCode || decodedText);
            };

            try {
                await html5QrCodeRef.current.start(
                    { facingMode: "environment" },
                    qrScannerConfig,
                    onScanSuccess,
                    () => {}
                );
            } catch (e: any) {
                console.warn("Environment config failed, trying camera devices fallback", e);
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    const backCamera = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("arka") || d.label.toLowerCase().includes("environment"));
                    await html5QrCodeRef.current.start(
                        backCamera ? backCamera.id : devices[0].id,
                        qrScannerConfig,
                        onScanSuccess,
                        () => {}
                    );
                } else {
                    throw new Error(`Kamera Bulunamadı: ${e.name || e.message || String(e)}`);
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
                const parsed = parseQRString(decodedText);
                await stopCamera();
                setIsScannerOpen(false);
                onCommandSubmit(parsed.cleanCode || decodedText);
            } catch (err) {
                console.error("File scan failed", err);
                alert("QR kod okunamadı. Lütfen daha net bir fotoğraf çekin veya elle girin.");
            }
        }
    };

    const handleManualSubmit = async () => {
        if (!manualCode.trim()) return;
        const parsed = parseQRString(manualCode);
        await stopCamera();
        setIsScannerOpen(false);
        onCommandSubmit(parsed.cleanCode || manualCode.trim());
    };

    if (!isScannerOpen) return null;

    const portalContent = (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <button 
                onClick={async () => {
                    await stopCamera();
                    setIsScannerOpen(false);
                }} 
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            >
                <X size={24} />
            </button>

            <div className="text-center mb-6">
                <ScanBarcode size={44} className="mx-auto text-amber-500 mb-2 animate-pulse" />
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Hızlı QR / Barkod Okuyucu</h2>
                <p className="text-neutral-400 text-xs mt-1">QR kodunu kırmızı hizada tutun veya galerinizden fotoğraf yükleyin.</p>
            </div>

            <div className="w-full max-w-sm bg-[#050b14] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(245,158,11,0.2)] p-4 flex flex-col gap-4">
                
                {/* HTML5 QR Camera Element Container */}
                <div className="relative w-full bg-black rounded-2xl overflow-hidden min-h-[260px] border border-white/10 flex items-center justify-center">
                    <div id="reader" className="w-full h-full"></div>
                    {!isCameraStarted && !cameraError && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center">
                            <Camera size={36} className="text-neutral-500 mb-2 animate-bounce" />
                            <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">Kamera Başlatılıyor...</span>
                        </div>
                    )}
                </div>

                {cameraError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center text-center">
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">Kamera Başlatılamadı</p>
                        <p className="text-[10px] text-neutral-400 mb-2">{cameraErrorMsg}</p>
                        <button 
                            onClick={startCamera}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                        >
                            Yeniden Dene
                        </button>
                    </div>
                )}

                {/* Alternatifler: Fotoğraf Yükle & Elle Gir */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="QR Kodunu elle yazın..." 
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                            className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                        />
                        <button 
                            onClick={handleManualSubmit}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                            <Check size={14} /> Tamam
                        </button>
                    </div>

                    <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-xl cursor-pointer transition-colors text-xs font-bold uppercase tracking-wider">
                        <Upload size={14} className="text-amber-400" /> Galeriden QR Fotoğrafı Seç
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                        />
                    </label>
                </div>

            </div>
        </div>
    );

    return mounted ? createPortal(portalContent, document.body) : null;
}
