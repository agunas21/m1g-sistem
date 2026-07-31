import React from "react";
import { prisma } from "@/lib/prisma";
import { Box, QrCode, User, CheckCircle, Wrench, ShieldAlert, Calendar, ArrowLeft, PackageCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Core item lookup
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: {
          fullName: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!item) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#050B14] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest text-red-400">Ekipman Bulunamadı</h1>
          <p className="text-neutral-400 text-xs leading-relaxed">
            Okutulan QR kod (<code className="text-white font-mono">{id}</code>) sistem veritabanında bulunamadı veya silinmiş olabilir.
          </p>
          <Link
            href="/admin/depo"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 transition-colors"
          >
            <ArrowLeft size={16} /> Depo Paneline Dön
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch contained items if this equipment is a Kit / Container
  let containerItemsData: any[] = [];
  if (item.isContainer && item.containerItems && item.containerItems.length > 0) {
    containerItemsData = await prisma.inventoryItem.findMany({
      where: {
        id: { in: item.containerItems },
      },
      include: {
        assignedTo: {
          select: { fullName: true },
        },
      },
    });
  }

  const isKamp = item.equipmentCategory === "KAMP";
  const themeBorder = isKamp ? "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]" : "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]";
  const themeBadge = isKamp ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30";
  const themeIcon = isKamp ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30";

  const statusBadgeColor = 
    item.status === "Depoda" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
    item.status === "Zimmetli" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin/depo" className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider">
            <ArrowLeft size={16} /> Depo Paneline Git
          </Link>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">M1G DİJİTAL ETİKET</span>
        </div>

        {/* MAIN CARD */}
        <div className={`bg-[#050B14] border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden ${themeBorder}`}>
          
          {/* Header Banner */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border ${themeIcon}`}>
                <Box size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight">{item.name}</h1>
                </div>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">{item.id} • {item.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  {item.isContainer && (
                    <span className={`px-2.5 py-0.5 border text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 ${themeBadge}`}>
                      {isKamp ? "⛺ KAMP KİTİ" : "🚨 ARAMA KURTARMA KİTİ"} ({containerItemsData.length} Malzeme)
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusBadgeColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ZİMMET & DURUM BİLGİLERİ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest block mb-1">Mevcut Zimmet</span>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <User size={14} className="text-blue-400" />
                {item.assignedTo ? item.assignedTo.fullName : "Merkez Depo"}
              </p>
            </div>
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest block mb-1">Fiziksel Durum</span>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400" />
                {item.condition || "İyi"}
              </p>
            </div>
          </div>

          {/* KİT İÇERİĞİ — EĞER BU BİR KİT / KONTEYNER İSE */}
          {item.isContainer && (
            <div className={`bg-[#020617] border ${isKamp ? "border-emerald-500/20" : "border-red-500/20"} rounded-2xl p-5 space-y-4`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-widest flex items-center gap-2">
                  <Box size={18} className={isKamp ? "text-emerald-400" : "text-red-400"} /> 
                  {isKamp ? "⛺ Kamp Kiti İçerisindeki Malzemeler" : "🚨 Arama Kurtarma Kiti İçerisindeki Malzemeler"}
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${themeBadge}`}>
                  {containerItemsData.length} ADET
                </span>
              </div>

              {containerItemsData.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {containerItemsData.map((subItem) => (
                    <div key={subItem.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          subItem.status === "Depoda" ? "bg-emerald-400" :
                          subItem.status === "Zimmetli" ? "bg-blue-400" : "bg-amber-400"
                        }`} />
                        <div>
                          <p className="text-white font-bold">{subItem.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            {subItem.id} • {subItem.category} {subItem.assignedTo ? `• Zimmetli: ${subItem.assignedTo.fullName}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                        subItem.status === "Depoda" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        subItem.status === "Zimmetli" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {subItem.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-500">
                  <Box size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs italic">Bu kit henüz malzeme içermiyor.</p>
                </div>
              )}
            </div>
          )}

          {/* TARİHLER & NOTLAR */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white/3 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">Son Kullanma (Miad)</span>
              <p className="text-neutral-300 font-mono font-bold mt-1">{item.expirationDate || "Yok"}</p>
            </div>
            <div className="bg-white/3 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest block">Planlı Bakım Tarihi</span>
              <p className="text-neutral-300 font-mono font-bold mt-1">{item.maintenanceDate || "Yok"}</p>
            </div>
          </div>

          {/* QR VISUAL CARD FOOTER */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-[10px] text-neutral-500 font-mono">
              Sistem Kaydı: <span className="text-white font-bold">{item.id}</span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-md">
              <QRCodeSVG value={`https://m1g.org.tr/eq/${item.id}`} size={64} level="H" />
            </div>
          </div>

        </div>

        <div className="text-center text-[10px] text-neutral-500 uppercase tracking-widest">
          M1G ARAMA KURTARMA DERNEĞİ — LOJİSTİK VE ENVANTER SİSTEMİ
        </div>
      </div>
    </div>
  );
}
