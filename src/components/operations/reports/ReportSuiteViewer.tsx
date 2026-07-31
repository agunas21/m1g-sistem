"use client";

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Truck, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Navigation, 
  Activity,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { KavkasFlag } from '@/lib/kavkas/backgroundCheck';

interface ReportSuiteViewerProps {
  operationId: string;
  operationName?: string;
}

const TABS = [
  { key: "kronoloji", label: "Operasyon Kronolojisi", icon: Clock },
  { key: "mekansal", label: "Alan Kapsama", icon: MapPin },
  { key: "performans_personel", label: "Personel Faaliyet", icon: Users },
  { key: "performans_lojistik", label: "Lojistik & Araç", icon: Truck },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function ReportSuiteViewer({ operationId, operationName = "Aktif Operasyon" }: ReportSuiteViewerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("kronoloji");
  const [suiteData, setSuiteData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/operations/${operationId}/report-suite`)
      .then((res) => {
        if (!res.ok) throw new Error("Rapor verisi yüklenemedi");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setSuiteData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [operationId]);

  if (loading) {
    return (
      <div className="w-full bg-[#0B0F12] text-[#E5E7EB] p-8 rounded-2xl border border-[#1F262C] flex items-center justify-center gap-3 font-mono text-xs">
        <Activity size={18} className="animate-spin text-red-500" />
        <span>C4ISR Operasyon Rapor Zarfı Hazırlanıyor...</span>
      </div>
    );
  }

  if (error || !suiteData) {
    return (
      <div className="w-full bg-[#0B0F12] text-red-400 p-6 rounded-2xl border border-red-500/20 font-mono text-xs flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>Rapor verisi alınamadı. Bağlantınızı kontrol edip sayfayı yenileyin.</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0B0F12] text-[#E5E7EB] rounded-2xl border border-[#1F262C] font-sans flex flex-col gap-5 p-6 shadow-2xl">
      
      {/* 🔴 HEADER & OPERASYON ÖZETİ */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#151A1E] p-4 rounded-xl border border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-500/40 text-red-400 bg-red-500/10 font-bold uppercase tracking-wider">
              M1G C4ISR OPERASYON ANALİZ SUİTİ
            </span>
            <span className="text-[10px] font-mono text-neutral-500">ID: {operationId.substring(0, 8)}</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            {operationName} — Rapor Zarfı
          </h2>
          <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400 mt-1">
            <span>Tür: <strong className="text-white">{suiteData.ozet?.operationType}</strong></span>
            <span>Süre: <strong className="text-emerald-400">{suiteData.ozet?.durationHours} Saat</strong></span>
            <span>Personel: <strong className="text-blue-400">{suiteData.ozet?.totalPersonnel} Kişi</strong></span>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all uppercase whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
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
      <div className="min-h-[400px] bg-[#151A1E] rounded-xl border border-white/5 p-5 relative overflow-hidden">
        {activeTab === "kronoloji" && <ChronologyPanel data={suiteData.chronology} />}
        {activeTab === "mekansal" && <CoveragePanel data={suiteData.coverage} />}
        {activeTab === "performans_personel" && <PersonnelPanel data={suiteData.personnel} />}
        {activeTab === "performans_lojistik" && <LogisticsPanel data={suiteData.logistics} />}
      </div>

      {/* 🔵 İNSAN YARGI NOTU (LESSONS LEARNED / EVALUATION) */}
      <div className="bg-[#151A1E] p-4 rounded-xl border border-white/5 font-mono text-xs">
        <div className="flex items-center gap-2 mb-2 text-neutral-300 font-bold uppercase">
          <FileText size={14} className="text-blue-400" />
          <span>Operatör Değerlendirmesi & Sonuç Raporu</span>
        </div>
        <p className="text-neutral-500 italic">
          {suiteData.sonucVeDersler || "Henüz operatör değerlendirmesi girilmedi."}
        </p>
      </div>

      {/* 🟢 FOOTER: KAVKAS BACKROUND CHECK SESSİZ ALT BİLGİ */}
      <KavkasFooterNote flags={suiteData.kavkasFlags || []} />

    </div>
  );
}

// 🟢 2.2 Kronoloji Sekmesi — Timeline + Harita Hibrit
function ChronologyPanel({ data }: { data: any }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (data?.status === "empty") {
    return <EmptyState text={data.gaps[0]} />;
  }

  const selectedEvent = data?.timeline?.find((e: any) => e.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-full font-mono text-xs">
      <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 max-h-[420px] overflow-y-auto space-y-3">
        <h4 className="font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Olay Zaman Çizelgesi</span>
          <span className="text-[10px] text-neutral-500">{data?.timeline?.length || 0} Akış</span>
        </h4>
        
        <div className="space-y-2 relative border-l border-white/10 ml-2 pl-4">
          {data?.timeline?.map((item: any) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                item.isDecision
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : selectedId === item.id
                  ? "bg-red-500/10 border-red-500/40 text-white"
                  : "bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                <span>{new Date(item.timestamp).toLocaleTimeString('tr-TR')}</span>
                {item.isDecision && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase text-[9px]">
                    KRİTİK KARAR
                  </span>
                )}
              </div>
              <div className="font-bold text-white">{item.type}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Aktör: {item.actorName}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0B0F12] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Navigation size={14} className="text-red-400" />
            <span>Olay & Karar Detay Analizi</span>
          </h4>

          {selectedEvent ? (
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Olay Tipi</span>
                <span className="text-white font-bold text-sm">{selectedEvent.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Zaman</span>
                  <span className="text-emerald-400 font-bold">{new Date(selectedEvent.timestamp).toLocaleString('tr-TR')}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Aktör</span>
                  <span className="text-blue-400 font-bold">{selectedEvent.actorName}</span>
                </div>
              </div>
              {selectedEvent.lat && selectedEvent.lng && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-neutral-500 block mb-1 uppercase text-[10px]">Koordinat</span>
                  <span className="text-amber-400 font-bold">{selectedEvent.lat}, {selectedEvent.lng}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-neutral-500">
              Soldaki zaman çizelgesinden detayını görmek istediğiniz bir olaya tıklayın.
            </div>
          )}
        </div>

        {data?.criticalMoments?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 font-bold">Kritik Karar Noktaları:</span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">{data.criticalMoments.length} Adet</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 🟡 2.3 Alan Kapsama Sekmesi
function CoveragePanel({ data }: { data: any }) {
  if (data?.status === "insufficient") {
    return <EmptyState text={data.gaps[0]} />;
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {data?.status === "no_boundary" && (
        <EmptyState text={data.gaps[0]} />
      )}

      <div className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 max-h-[320px] overflow-y-auto space-y-3">
        <h4 className="font-bold text-white uppercase tracking-wider">
          Grid Yoğunluk Harita Hücreleri (~11 Metre Çözünürlük)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {data?.heatmapGrid?.map((cell: any, i: number) => (
            <div key={i} className="p-2 bg-white/5 rounded border border-white/5 flex justify-between items-center">
              <span className="text-neutral-400">{cell.lat}, {cell.lng}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                {cell.weight} Sinyal
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 🔵 2.4 Personel Faaliyet Sekmesi
function PersonnelPanel({ data }: { data: any }) {
  if (data?.status === "empty") {
    return <EmptyState text={data.gaps[0]} />;
  }

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="bg-[#0B0F12] rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-neutral-400 uppercase text-[10px]">
              <th className="p-3">Personel Ad Soyad</th>
              <th className="p-3">Durum</th>
              <th className="p-3">Aktif Süre</th>
              <th className="p-3">Rölanti Süre</th>
              <th className="p-3">Görev Sayısı</th>
              <th className="p-3">Zaman Çizelgesi Barı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data?.personnel?.map((p: any, i: number) => {
              const totalMin = Math.max(1, (p.activeDurationMin || 0) + (p.idleDurationMin || 0));
              const activeWidthPercent = Math.min(100, Math.round(((p.activeDurationMin || 0) / totalMin) * 100));

              return (
                <tr key={i} className="hover:bg-white/5">
                  <td className="p-3 font-bold text-white">{p.fullName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'READY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-500/20 text-neutral-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">{p.activeDurationMin} dk</td>
                  <td className="p-3 text-amber-400 font-bold">{p.idleDurationMin} dk</td>
                  <td className="p-3 text-blue-400 font-bold">{p.taskCount} Adet</td>
                  <td className="p-3 min-w-[160px]">
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

// 🟠 2.5 Lojistik & Araç Sekmesi
function LogisticsPanel({ data }: { data: any }) {
  if (data?.status === "empty") {
    return <EmptyState text={data.gaps[0]} />;
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.vehicles?.map((v: any) => (
          <div key={v.vehicleId} className="bg-[#0B0F12] p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white uppercase text-sm">Araç Plaka: {v.vehicleId}</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                {v.pointCount} Sinyal Kaydı
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
        ))}
      </div>

      {data?.gaps?.length > 0 && (
        <EmptyState text={data.gaps[0]} />
      )}
    </div>
  );
}

// 🟢 2.6 KAVKAS Sessiz Alt Bilgi (Footer Note)
function KavkasFooterNote({ flags }: { flags: KavkasFlag[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasIssue = flags.some((f) => f.status !== "YESIL");

  return (
    <div className="border-t border-[#1F262C] pt-3 font-mono text-xs">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <ShieldAlert size={14} className={hasIssue ? "text-amber-400" : "text-emerald-400"} />
        <span>Sistem Arka Plan Doğrulama Notu {hasIssue ? "(Kontrol Gerekli)" : "(Uygun)"}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 pl-6">
          {flags.map((f, i) => (
            <div key={i} className={`flex items-center gap-2 ${f.status === 'KIRMIZI' ? 'text-amber-400' : 'text-neutral-400'}`}>
              <span className={`w-2 h-2 rounded-full ${
                f.status === 'YESIL' ? 'bg-emerald-500' : f.status === 'SARI' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <strong className="uppercase">{f.checkKey}:</strong>
              <span>{f.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-[#0B0F12] border border-white/5 text-neutral-400 p-4 rounded-xl flex items-center gap-3 text-xs font-mono">
      <Info size={16} className="shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}
