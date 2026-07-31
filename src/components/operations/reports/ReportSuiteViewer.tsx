"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Navigation, 
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { KavkasFlag } from '@/lib/kavkas/backgroundCheck';

interface ReportSuiteViewerProps {
  operationId: string;
  operationName?: string;
}

type TabType = "KRONOLOJI" | "ALAN_KAPSAMA" | "PERSONEL_FAALIYET" | "LOJISTIK_ARAC";

const REPORT_TABS = [
  { key: "KRONOLOJI" as TabType, label: "Operasyon Kronolojisi", icon: Clock },
  { key: "ALAN_KAPSAMA" as TabType, label: "Alan Kapsama", icon: MapPin },
  { key: "PERSONEL_FAALIYET" as TabType, label: "Personel Faaliyet", icon: Users },
  { key: "LOJISTIK_ARAC" as TabType, label: "Lojistik & Araç", icon: Truck },
] as const;

export default function ReportSuiteViewer({ operationId, operationName = "Aktif Operasyon" }: ReportSuiteViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("KRONOLOJI");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/operations/${operationId}/report-data/${activeTab}`)
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted) {
          setData(resData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [operationId, activeTab]);

  return (
    <div className="w-full bg-[#0B0F12] text-neutral-200 p-6 rounded-2xl border border-[#1f2937] font-sans flex flex-col gap-6 shadow-2xl">
      
      {/* 🔴 HEADER & TAB NAVIGATION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#151A1E] p-4 rounded-xl border border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/40 text-red-400 bg-red-500/10 font-bold uppercase tracking-wider">
              M1G C4ISR KOMUTA RAPORU
            </span>
            <span className="text-[10px] font-mono text-neutral-500">ID: {operationId.substring(0, 8)}</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            {operationName} — Operasyonel Analiz Suite
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all uppercase whitespace-nowrap ${
                  isActive
                    ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 🟡 MAIN CONTENT CONTAINER */}
      <div className="min-h-[420px] bg-[#151A1E] rounded-xl border border-white/5 p-5 relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[350px] text-neutral-400 font-mono text-xs gap-3">
            <Activity size={18} className="animate-spin text-red-500" />
            <span>Rapor verileri analizi yapılıyor...</span>
          </div>
        ) : (
          <>
            {activeTab === "KRONOLOJI" && <ChronologyView data={data} />}
            {activeTab === "ALAN_KAPSAMA" && <CoverageView data={data} />}
            {activeTab === "PERSONEL_FAALIYET" && <PersonnelActivityView data={data} />}
            {activeTab === "LOJISTIK_ARAC" && <LogisticsView data={data} />}
          </>
        )}
      </div>

      {/* 🟢 FOOTER: KAVKAS BACKROUND CHECK SYSTEM FOOTNOTE */}
      {data?.kavkasBackgroundCheck && Array.isArray(data.kavkasBackgroundCheck) && (
        <footer className="bg-[#151A1E]/80 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldAlert size={14} className="text-amber-400" />
            <span className="font-bold text-white uppercase tracking-wider">Sistem Arka Plan Doğrulama Notu:</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {data.kavkasBackgroundCheck.map((flag: KavkasFlag, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  flag.status === 'YESIL' ? 'bg-emerald-500' : flag.status === 'SARI' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-neutral-300 font-bold uppercase">{flag.checkKey}:</span>
                <span className="text-neutral-400">{flag.reason}</span>
              </div>
            ))}
          </div>
        </footer>
      )}

    </div>
  );
}

// 🟢 2.1 KRONOLOJİ SEKMESİ
function ChronologyView({ data }: { data: any }) {
  const [selectedMoment, setSelectedMoment] = useState<any | null>(null);

  if (data?.status === "empty") {
    return <InfoBanner text={data.gaps[0]} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-full">
      {/* Sol: Timeline Canvas Panel */}
      <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 max-h-[450px] overflow-y-auto space-y-3">
        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Olay Akış Çizelgesi</span>
          <span className="text-[10px] text-neutral-500">{data?.timeline?.length || 0} Event</span>
        </h4>
        
        <div className="space-y-2 relative border-l border-white/10 ml-2 pl-4">
          {data?.timeline?.map((item: any) => (
            <div
              key={item.id}
              onClick={() => setSelectedMoment(item)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                item.isDecision
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : selectedMoment?.id === item.id
                  ? "bg-red-500/10 border-red-500/40 text-white"
                  : "bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-1">
                <span>{new Date(item.timestamp).toLocaleTimeString('tr-TR')}</span>
                {item.isDecision && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase text-[9px]">
                    KRİTİK KARAR
                  </span>
                )}
              </div>
              <div className="font-bold text-white">{item.type}</div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">Aktör: {item.actorName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ: Seçili Olay Detay / Harita Temsili */}
      <div className="bg-[#0B0F12] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
        <div>
          <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Navigation size={14} className="text-red-400" />
            <span>Olay & Karar Detay Analizi</span>
          </h4>

          {selectedMoment ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Olay Tipi</span>
                <span className="text-white font-bold text-sm">{selectedMoment.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Zaman Damgası</span>
                  <span className="text-emerald-400 font-bold">{new Date(selectedMoment.timestamp).toLocaleString('tr-TR')}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Aktör</span>
                  <span className="text-blue-400 font-bold">{selectedMoment.actorName}</span>
                </div>
              </div>
              {selectedMoment.lat && selectedMoment.lng && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">GPS Koordinatı</span>
                  <span className="text-amber-400 font-bold">{selectedMoment.lat}, {selectedMoment.lng}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-neutral-500 font-mono text-xs">
              Soldaki zaman çizelgesinden detayını görmek istediğiniz bir olaya tıklayın.
            </div>
          )}
        </div>

        {/* Decision Highlights */}
        {data?.criticalMoments?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">Kritik Karar Noktaları Sayısı:</span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">{data.criticalMoments.length} Adet</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 🟡 2.2 ALAN KAPSAMA SEKMESİ
function CoverageView({ data }: { data: any }) {
  if (data?.status === "insufficient") {
    return <InfoBanner text={data.gaps[0]} />;
  }

  return (
    <div className="space-y-4 font-mono">
      {data?.status === "no_boundary" && (
        <InfoBanner text={data.gaps[0]} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5">
          <span className="text-neutral-500 text-[10px] uppercase font-bold">Toplam GPS Noktası</span>
          <div className="text-2xl font-black text-white mt-1">{data?.totalPoints || 0}</div>
        </div>
        <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5">
          <span className="text-neutral-500 text-[10px] uppercase font-bold">Yoğunluk Grid Hücresi</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{data?.heatmapGrid?.length || 0}</div>
        </div>
        <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5">
          <span className="text-neutral-500 text-[10px] uppercase font-bold">Grid Çözünürlüğü</span>
          <div className="text-2xl font-black text-amber-400 mt-1">~11 Metre</div>
        </div>
      </div>

      {/* Grid Heatmap Table */}
      <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto">
        <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-3">
          Saha Yoğunluk Grid Hücreleri (0.0001° Hassasiyet)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {data?.heatmapGrid?.map((cell: any, i: number) => (
            <div key={i} className="p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center">
              <span className="text-neutral-400">{cell.lat}, {cell.lng}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                {cell.intensity} Sinyal
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 🔵 2.3 PERSONEL FAALİYET SEKMESİ
function PersonnelActivityView({ data }: { data: any }) {
  if (data?.status === "empty") {
    return <InfoBanner text={data.gaps[0]} />;
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="bg-[#0B0F12] rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-neutral-400 uppercase text-[10px]">
              <th className="p-3">Personel Ad Soyad</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Aktif Süre (Dk)</th>
              <th className="p-3">Rölanti Süre (Dk)</th>
              <th className="p-3">Başlatılan Görev</th>
              <th className="p-3">Zaman Çizelgesi Dağılımı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data?.personnel?.map((p: any, i: number) => {
              const totalMin = Math.max(1, p.activeDurationMin + p.idleDurationMin);
              const activeWidthPercent = Math.min(100, Math.round((p.activeDurationMin / totalMin) * 100));

              return (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 font-bold text-white">{p.fullName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-500/20 text-neutral-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">{p.activeDurationMin} dk</td>
                  <td className="p-3 text-amber-400 font-bold">{p.idleDurationMin} dk</td>
                  <td className="p-3 text-blue-400 font-bold">{p.taskCount} Adet</td>
                  <td className="p-3 min-w-[180px]">
                    <div className="w-full bg-amber-500/30 h-3 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${activeWidthPercent}%` }} 
                        className="bg-emerald-500 h-full"
                        title={`Aktif: %${activeWidthPercent}`}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 🟠 2.4 LOJİSTİK & ARAÇ SEKMESİ
function LogisticsView({ data }: { data: any }) {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.vehicles?.length > 0 ? (
          data.vehicles.map((v: any) => (
            <div key={v.vehicleId} className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white uppercase text-sm">Araç Plaka: {v.vehicleId}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                  {v.pointCount} Telemetri Noktası
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-white/5 rounded border border-white/5">
                  <span className="text-neutral-500 text-[10px] block uppercase">Toplam Mesafe</span>
                  <span className="text-emerald-400 font-bold text-base">{v.totalKm} KM</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded border border-white/5">
                  <span className="text-neutral-500 text-[10px] block uppercase">Ayıklanan Anomali</span>
                  <span className="text-amber-400 font-bold text-base">{v.discardedAnomalies} Nokta</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-6 bg-[#0B0F12] rounded-xl border border-white/5 text-center text-neutral-400 font-mono">
            Operasyonel araç telemetry verisi bulunamadı.
          </div>
        )}
      </div>

      {/* Fuel Banner */}
      {data?.fuelNote && (
        <InfoBanner text={data.fuelNote} />
      )}
    </div>
  );
}

// Info Banner Utility
function InfoBanner({ text }: { text: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl flex items-center gap-3 text-xs font-mono">
      <Info size={16} className="shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}
