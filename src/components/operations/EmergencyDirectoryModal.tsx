"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  TURKEY_81_PROVINCES,
  detectProvinceAndDistrict,
  getInstitutionsForLocation,
  loadOfflineMuhtarDirectory,
  saveOfflineMuhtarContact,
  deleteOfflineMuhtarContact,
  MuhtarContact
} from "@/data/turkeyEmergencyDirectory";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operationLocation?: string;
  onUpdateOperationLocation?: (newLoc: string) => void;
}

export default function EmergencyDirectoryModal({
  isOpen,
  onClose,
  operationLocation = "",
  onUpdateOperationLocation
}: Props) {
  const detected = useMemo(
    () => detectProvinceAndDistrict(operationLocation),
    [operationLocation]
  );

  const [selectedProvinceName, setSelectedProvinceName] = useState<string>(detected.province.name);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(detected.district);
  const [activeTab, setActiveTab] = useState<"kurumlar" | "muhtarlar">("kurumlar");
  const [searchQuery, setSearchQuery] = useState("");

  // Offline Muhtar Rehberi State
  const [muhtarList, setMuhtarList] = useState<MuhtarContact[]>([]);
  const [showAddMuhtarForm, setShowAddMuhtarForm] = useState(false);
  const [newMuhtar, setNewMuhtar] = useState({
    neighborhood: "",
    muhtarName: "",
    phone: "",
    altPhone: "",
    gatheringAreaNote: ""
  });

  useEffect(() => {
    const det = detectProvinceAndDistrict(operationLocation);
    setSelectedProvinceName(det.province.name);
    setSelectedDistrictName(det.district);
  }, [operationLocation]);

  useEffect(() => {
    setMuhtarList(loadOfflineMuhtarDirectory());
  }, [isOpen]);

  const currentProvince = useMemo(() => {
    return (
      TURKEY_81_PROVINCES.find(p => p.name === selectedProvinceName) ||
      TURKEY_81_PROVINCES.find(p => p.plate === "35") ||
      TURKEY_81_PROVINCES[0]
    );
  }, [selectedProvinceName]);

  const institutions = useMemo(() => {
    const list = getInstitutionsForLocation(currentProvince.name, selectedDistrictName);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLocaleLowerCase("tr-TR");
    return list.filter(
      item =>
        item.name.toLocaleLowerCase("tr-TR").includes(q) ||
        item.category.toLocaleLowerCase("tr-TR").includes(q) ||
        item.description.toLocaleLowerCase("tr-TR").includes(q) ||
        item.phone.includes(q)
    );
  }, [currentProvince.name, selectedDistrictName, searchQuery]);

  const filteredMuhtars = useMemo(() => {
    const byLoc = muhtarList.filter(
      m =>
        m.province.toLocaleLowerCase("tr-TR") === currentProvince.name.toLocaleLowerCase("tr-TR") &&
        (!selectedDistrictName ||
          m.district.toLocaleLowerCase("tr-TR") === selectedDistrictName.toLocaleLowerCase("tr-TR"))
    );
    if (!searchQuery.trim()) return byLoc;
    const q = searchQuery.toLocaleLowerCase("tr-TR");
    return byLoc.filter(
      m =>
        m.neighborhood.toLocaleLowerCase("tr-TR").includes(q) ||
        m.muhtarName.toLocaleLowerCase("tr-TR").includes(q) ||
        m.phone.includes(q) ||
        (m.gatheringAreaNote || "").toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [muhtarList, currentProvince.name, selectedDistrictName, searchQuery]);

  const handleProvinceChange = (provName: string) => {
    setSelectedProvinceName(provName);
    const found = TURKEY_81_PROVINCES.find(p => p.name === provName);
    const firstDist = found?.districts[0] || "Merkez";
    setSelectedDistrictName(firstDist);
  };

  const handleSaveMuhtar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuhtar.neighborhood.trim() || !newMuhtar.phone.trim()) {
      toast.error("Lütfen Mahalle Adı ve Telefon numarasını girin.");
      return;
    }
    const updated = saveOfflineMuhtarContact({
      province: currentProvince.name,
      district: selectedDistrictName || "Merkez",
      neighborhood: newMuhtar.neighborhood.trim(),
      muhtarName: newMuhtar.muhtarName.trim() || `${newMuhtar.neighborhood.trim()} Muhtarı`,
      phone: newMuhtar.phone.trim(),
      altPhone: newMuhtar.altPhone.trim() || undefined,
      gatheringAreaNote: newMuhtar.gatheringAreaNote.trim() || undefined
    });
    setMuhtarList(updated);
    setNewMuhtar({
      neighborhood: "",
      muhtarName: "",
      phone: "",
      altPhone: "",
      gatheringAreaNote: ""
    });
    setShowAddMuhtarForm(false);
    toast.success("Mahalle Muhtarı çevrimdışı (offline) saha rehberine kaydedildi!");
  };

  const handleDeleteMuhtar = (id: string) => {
    if (!confirm("Bu muhtar kaydını silmek istediğinize emin misiniz?")) return;
    const updated = deleteOfflineMuhtarContact(id);
    setMuhtarList(updated);
    toast.success("Muhtar kaydı silindi.");
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9995] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0b1120] border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Üst Başlık */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-2xl shadow-inner">
              ☎️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  81 İl / İlçe Acil Kurumlar & Muhtarlık Rehberi
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  📴 %100 Offline Çalışır
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                İnternet kesilse bile seçili il ve ilçedeki AFAD, Kriz Masası, İtfaiye, Altyapı ve Muhtarlık numaralarına anında ulaşın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
          >
            Kapat ✕
          </button>
        </div>

        {/* İl / İlçe Seçici & Operasyon Konumu Eşleştirme Çubuğu */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              📍 İl Seçin (81 İl Tam Liste)
            </label>
            <select
              value={currentProvince.name}
              onChange={e => handleProvinceChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500"
            >
              {TURKEY_81_PROVINCES.map(p => (
                <option key={p.plate} value={p.name}>
                  {p.plate} — {p.name} (Alan Kodu: {p.areaCode})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              🏘️ İlçe Seçin ({currentProvince.districts.length} İlçe)
            </label>
            <select
              value={selectedDistrictName}
              onChange={e => setSelectedDistrictName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500"
            >
              {currentProvince.districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 flex gap-2">
            {onUpdateOperationLocation && (
              <button
                type="button"
                onClick={() => {
                  const formatted = `${currentProvince.name}, ${selectedDistrictName}`;
                  onUpdateOperationLocation(formatted);
                  toast.success(`Operasyon konumu "${formatted}" olarak güncellendi.`);
                }}
                className="w-full py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                title="Seçili İl ve İlçeyi aktif operasyonun resmi saha konumu olarak kaydet"
              >
                📌 Operasyon Konumu Yap
              </button>
            )}
          </div>
        </div>

        {/* Sekmeler & Arama */}
        <div className="px-4 py-3 bg-[#0f172a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("kurumlar")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "kurumlar"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "bg-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              <span>🏛️</span>
              <span>Acil Kurumlar & Kriz Masası ({institutions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("muhtarlar")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === "muhtarlar"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25"
                  : "bg-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              <span>🏘️</span>
              <span>
                {selectedDistrictName} Muhtarlık Rehberi ({filteredMuhtars.length})
              </span>
            </button>
          </div>

          <div className="flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "kurumlar"
                  ? "Kurum ara (AFAD, İtfaiye, Gaz, Muhtarlık...)"
                  : "Mahalle veya muhtar adı ara..."
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* İçerik Listesi */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {activeTab === "kurumlar" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {institutions.map(inst => (
                <div
                  key={inst.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                    inst.priority === "Kritik"
                      ? "bg-slate-900/90 border-red-500/30 hover:border-red-500/60"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          inst.category === "AFAD & Kriz Merkezi"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : inst.category === "Muhtarlık Koordinasyon"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : inst.category === "Belediye & İtfaiye"
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {inst.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {currentProvince.name} / {selectedDistrictName}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{inst.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{inst.description}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-sm font-black font-mono text-emerald-400">{inst.phone}</div>
                      {inst.altPhone && (
                        <div className="text-[10px] font-mono text-slate-400">
                          Kısa Hat / Yedek: <strong className="text-amber-300">{inst.altPhone}</strong>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inst.phone);
                          toast.success(`${inst.name} numarası kopyalandı: ${inst.phone}`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                        title="Numarayı Kopyala"
                      >
                        📋
                      </button>
                      <a
                        href={`tel:${inst.phone.replace(/\s+/g, "")}`}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <span>📞</span>
                        <span>Hemen Ara</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* İlçe Muhtarlık Koordinasyon Masası Sabit Kartı */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                    RESMİ MUHTARLIK KOORDİNASYON HATTI
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {currentProvince.name} — {selectedDistrictName} Muhtarlık İşleri Müdürlüğü & Kaymakamlık İletişim Masası
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    İlçedeki tüm mahalle ve köy muhtarlarının nöbetçi cep numaralarına ulaşmak veya saha muhtarlarını aşağıya çevrimdışı kaydetmek için kullanabilirsiniz.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${currentProvince.muhtarlikMasaPhone.replace(/\s+/g, "")}`}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                  >
                    📞 {currentProvince.muhtarlikMasaPhone}
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowAddMuhtarForm(prev => !prev)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
                  >
                    + Mahalle Muhtarı Ekle
                  </button>
                </div>
              </div>

              {/* Yeni Mahalle Muhtarı Ekleme Formu (Offline Kaydedilir) */}
              {showAddMuhtarForm && (
                <form
                  onSubmit={handleSaveMuhtar}
                  className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      ➕ {currentProvince.name} / {selectedDistrictName} İçin Yeni Mahalle/Köy Muhtarı Kaydet (Offline Hafıza)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMuhtarForm(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      İptal ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Mahalle / Köy Adı *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Bostanlı Mahallesi"
                        value={newMuhtar.neighborhood}
                        onChange={e => setNewMuhtar({ ...newMuhtar, neighborhood: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Muhtar Adı Soyadı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={newMuhtar.muhtarName}
                        onChange={e => setNewMuhtar({ ...newMuhtar, muhtarName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Cep / Sabit Telefon *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: 0532 000 00 00"
                        value={newMuhtar.phone}
                        onChange={e => setNewMuhtar({ ...newMuhtar, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Afet Toplanma Alanı / Kritik Bina Notu (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Pazaryeri yanı toplanma alanı, muhtarlık binası sağlam"
                      value={newMuhtar.gatheringAreaNote}
                      onChange={e => setNewMuhtar({ ...newMuhtar, gatheringAreaNote: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
                    >
                      💾 Cihaza & Offline Rehbere Kaydet
                    </button>
                  </div>
                </form>
              )}

              {/* Kayıtlı Mahalle Muhtarları Listesi */}
              {filteredMuhtars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMuhtars.map(m => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase">
                            {m.province} / {m.district}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMuhtar(m.id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                            title="Muhtar kaydını sil"
                          >
                            Sil
                          </button>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1">{m.neighborhood}</h4>
                        <p className="text-xs text-slate-300 font-semibold">{m.muhtarName}</p>
                        {m.gatheringAreaNote && (
                          <p className="text-[11px] text-slate-400 mt-1">📍 {m.gatheringAreaNote}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-sm font-black font-mono text-emerald-400">{m.phone}</span>
                        <a
                          href={`tel:${m.phone.replace(/\s+/g, "")}`}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider"
                        >
                          📞 Muhtarı Ara
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                  <div className="text-2xl">🏘️</div>
                  <div className="text-sm font-bold text-white">
                    {currentProvince.name} / {selectedDistrictName} için henüz özel mahalle muhtarı eklenmemiş
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Yukarıdaki <strong>{currentProvince.muhtarlikMasaPhone}</strong> numaralı İlçe Muhtarlık Masasını arayabilir veya sahadaki mahalle muhtarlarının numaralarını <strong>&ldquo;+ Mahalle Muhtarı Ekle&rdquo;</strong> butonuyla çevrimdışı hafızaya kaydedebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

