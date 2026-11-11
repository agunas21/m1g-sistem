"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CertificateType,
  CERTIFICATE_TEMPLATES,
  generateCertificateDataUrl,
  downloadCertificateImage
} from "@/lib/certificateGenerator";
import toast from "react-hot-toast";

interface MemberOption {
  id: string;
  fullName: string;
  email?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CertificateType;
  initialFullName?: string;
  initialEmail?: string;
  operationName?: string;
  members?: MemberOption[];
}

export default function ThankYouCertificateModal({
  isOpen,
  onClose,
  defaultType = "destekci",
  initialFullName = "",
  initialEmail = "",
  operationName = "",
  members = []
}: Props) {
  const [certType, setCertType] = useState<CertificateType>(defaultType);
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [customNote, setCustomNote] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCertType(defaultType);
      setFullName(initialFullName);
      setEmail(initialEmail);
    }
  }, [isOpen, defaultType, initialFullName, initialEmail]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsRendering(true);
    const timer = setTimeout(async () => {
      try {
        const url = await generateCertificateDataUrl(
          certType,
          fullName.trim() || "ÖRNEK AD SOYAD"
        );
        if (!cancelled) setPreviewDataUrl(url);
      } catch (err) {
        console.error("Sertifika önizleme hatası:", err);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, certType, fullName]);

  if (!isOpen) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Lütfen belge üzerine yazılacak Ad Soyad bilgisini girin.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Lütfen geçerli bir alıcı e-posta adresi girin.");
      return;
    }

    setIsSending(true);
    try {
      const certDataUrl = await generateCertificateDataUrl(certType, fullName.trim());
      const res = await fetch("/api/mail/thank-you-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: certType,
          fullName: fullName.trim(),
          email: email.trim(),
          certificateDataUrl: certDataUrl,
          operationName: operationName || undefined,
          customNote: customNote.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `🎖️ "${fullName.trim().toLocaleUpperCase("tr-TR")}" adına düzenlenen Teşekkür Belgesi ${email.trim()} adresine gönderildi!`
        );
        onClose();
      } else {
        toast.error(data.error || data.message || "E-posta gönderilemedi.");
      }
    } catch (err: any) {
      toast.error("Gönderim sırasında hata oluştu: " + (err.message || ""));
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    if (!fullName.trim()) {
      toast.error("İndirmeden önce lütfen Ad Soyad yazın.");
      return;
    }
    try {
      await downloadCertificateImage(certType, fullName.trim());
      toast.success("Teşekkür belgesi görseli indirildi.");
    } catch {
      toast.error("Belge indirilemedi.");
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-700/80 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Üst Başlık */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-2xl">
              🎖️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                M1G Teşekkür Belgesi Oluştur & E-Posta Gönder
              </h2>
              <p className="text-xs text-slate-400">
                Ad Soyad ve E-Posta adresini aynı pencereden manuel yazarak veya listeden seçerek anında gönderebilirsiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold"
          >
            Kapat ✕
          </button>
        </div>

        {/* Gövde: Sol Form + Sağ Canlı Belge Önizlemesi */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol: Manuel Giriş Formu */}
          <form onSubmit={handleSendEmail} className="lg:col-span-5 space-y-4">
            {/* Belge Şablonu Seçimi */}
            <div>
              <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider mb-2">
                1. Belge Türünü Seçin
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCertType("destekci")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    certType === "destekci"
                      ? "bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/15"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-base mb-0.5">🤝 Destekçi Belgesi</div>
                  <div className="text-[10px] opacity-80">
                    Bağışçı, kurum veya gönüllü destekçiler için
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCertType("operasyon")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    certType === "operasyon"
                      ? "bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/15"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-base mb-0.5">🚒 Operasyon Belgesi</div>
                  <div className="text-[10px] opacity-80">
                    Sahada görev alan arama kurtarma personeli için
                  </div>
                </button>
              </div>
            </div>

            {/* Opsiyonel: Kayıtlı Üyeden Hızlı Doldur */}
            {members.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Kayıtlı Personelden Hızlı Seç (Opsiyonel — Veya Aşağıya Manuel Yazın)
                </label>
                <select
                  onChange={e => {
                    const found = members.find(m => m.id === e.target.value);
                    if (found) {
                      setFullName(found.fullName);
                      if (found.email) setEmail(found.email);
                    }
                  }}
                  defaultValue=""
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-red-500"
                >
                  <option value="">-- Manuel Yazmak İçin Boş Bırakın veya Listeden Seçin --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} {m.email ? `(${m.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manuel Ad Soyad Girişi */}
            <div>
              <label className="block text-[11px] font-black text-white uppercase tracking-wider mb-1">
                2. Belgede &ldquo;SAYIN&rdquo; Altına Yazılacak Ad Soyad / Kurum Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: AHMET YILMAZ veya ABC LOJİSTİK A.Ş."
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                İsim otomatik olarak büyük harfe çevrilir ve şablondaki <strong>SAYIN</strong> ibaresinin hemen altındaki boşluğa diğer yazıları ezmeden yerleştirilir.
              </p>
            </div>

            {/* Manuel E-Posta Girişi */}
            <div>
              <label className="block text-[11px] font-black text-white uppercase tracking-wider mb-1">
                3. Gönderilecek E-Posta Adresi *
              </label>
              <input
                type="email"
                required
                placeholder="Örn: destekci@eposta.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500"
              />
            </div>

            {/* Opsiyonel Ek Not */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                E-Posta İçeriğine Eklenecek Özel Not (Opsiyonel)
              </label>
              <textarea
                rows={2}
                placeholder="E-posta gövdesinde belgenin üstünde görünecek ek teşekkür mesajınız (isteğe bağlı)..."
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Gönder & İndir Butonları */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>📧</span>
                <span>{isSending ? "Gönderiliyor..." : "Teşekkür Belgesini Mail Gönder"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <span>📥</span>
                <span>Görseli İndir</span>
              </button>
            </div>
          </form>

          {/* Sağ: Canlı Belge Önizlemesi */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>👁️</span> Canlı Belge Önizlemesi ({CERTIFICATE_TEMPLATES[certType].label})
              </span>
              {isRendering && (
                <span className="text-[11px] text-amber-400 animate-pulse">Önizleme güncelleniyor...</span>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-950 shadow-2xl relative">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Teşekkür Belgesi Önizleme"
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-[1000/707] flex items-center justify-center text-slate-500 text-xs">
                  Belge şablonu yükleniyor...
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Belge yüksek çözünürlüklü <strong>.JPG</strong> olarak hem e-postanın içinde görünür hem de indirilebilir ek dosya olarak iletilir.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

