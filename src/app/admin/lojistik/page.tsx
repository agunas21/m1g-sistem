"use client";

import { useState } from "react";
import { Wrench, ShieldAlert, Truck, Navigation, BatteryCharging, AlertTriangle, Search, CheckCircle2, Factory } from "lucide-react";

export default function LojistikUssu() {
    const [search, setSearch] = useState("");

    const [inventory, setInventory] = useState([
        { id: 1, type: "Araç", name: "M1G-01 (Toyota Hilux 4x4)", category: "Kurtarma Aracı", status: "Depoda", assignedTo: "Merkez Garaj", lastMaintenance: "15.02.2024", condition: "Kusursuz" },
        { id: 2, type: "Araç", name: "M1G-02 (Ford Ranger 4x4)", category: "Lojistik Aracı", status: "Sahada", assignedTo: "Ahmet Yılmaz", lastMaintenance: "01.12.2023", condition: "İyi - Ön fren balatası değişecek" },
        { id: 3, type: "Drone", name: "DJI Mavic 3T (Termal)", category: "Hava Gözlem", status: "Sahada", assignedTo: "Can Yücel", lastMaintenance: "20.03.2024", condition: "Kusursuz" },
        { id: 4, type: "İletişim", name: "Iridium Extreme Uydu Telefonu", category: "Haberleşme", status: "Depoda", assignedTo: "Merkez Depo", lastMaintenance: "01.01.2024", condition: "Kusursuz - Pil %100" },
        { id: 5, type: "Ekipman", name: "Honda 5Kw Jeneratör", category: "Enerji", status: "Bakımda", assignedTo: "Teknik Servis", lastMaintenance: "Bekleniyor", condition: "Arızalı - Buji Değişimi" },
        { id: 6, type: "Ekipman", name: "Hilti Kırıcı Delici Takımı", category: "Enkaz Müdahale", status: "Depoda", assignedTo: "Merkez Depo", lastMaintenance: "05.11.2023", condition: "Kusursuz" }
    ]);

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Depoda': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Sahada': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'Bakımda': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-neutral-800 text-neutral-400 border-white/10';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Araç': return <Truck size={16} className="text-blue-400" />;
            case 'Drone': return <Navigation size={16} className="text-purple-400" />;
            case 'İletişim': return <BatteryCharging size={16} className="text-yellow-400" />;
            default: return <Wrench size={16} className="text-neutral-400" />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <Factory className="text-red-500" size={28} /> Lojistik Üssü
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Araç ve ekipman envanter yönetimi.</p>
            </div>

            {/* DASHBOARD NELER OLUYOR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-[#050B14] border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <Truck className="text-blue-500 mb-2" size={24} />
                    <span className="text-2xl md:text-3xl font-black text-white">2</span>
                    <h3 className="text-neutral-500 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">Araç Filosu</h3>
                </div>
                <div className="bg-[#050B14] border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <ShieldAlert className="text-orange-500 mb-2" size={24} />
                    <span className="text-2xl md:text-3xl font-black text-white">2</span>
                    <h3 className="text-neutral-500 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">Sahada</h3>
                </div>
                <div className="bg-[#050B14] border border-white/5 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <CheckCircle2 className="text-emerald-500 mb-2" size={24} />
                    <span className="text-2xl md:text-3xl font-black text-white">3</span>
                    <h3 className="text-neutral-500 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">Hazır</h3>
                </div>
                <div className="bg-red-600/10 border border-red-500/20 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                    <AlertTriangle className="text-red-500 mb-2" size={24} />
                    <span className="text-2xl md:text-3xl font-black text-red-500">1</span>
                    <h3 className="text-red-400 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-1">Bakımda</h3>
                </div>
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">

                <div className="p-4 border-b border-white/5 bg-black/40 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="Ekipman veya zimmetli personel ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-red-500 outline-none transition-colors"
                        />
                    </div>
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                        + Yeni Demirbaş Ekle
                    </button>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[11px]">
                            <tr>
                                <th className="px-6 py-5 font-bold">Demirbaş Adı (Kimlik)</th>
                                <th className="px-6 py-5 font-bold">Güncel Durum / Zimmet</th>
                                <th className="px-6 py-5 font-bold">Bakım Durumu (Notlar)</th>
                                <th className="px-6 py-5 font-bold text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInventory.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-lg">
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-base">{item.name}</h4>
                                                <span className="text-xs text-neutral-500 tracking-widest uppercase">{item.category}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 border-l border-white/5 text-xs">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full flex items-center w-max gap-1.5 border ${getStatusColor(item.status)}`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                                {item.status}
                                            </span>
                                            <span className="text-neutral-300">
                                                Konum: <span className={item.status === 'Sahada' ? 'text-orange-400' : ''}>{item.assignedTo}</span>
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 border-l border-white/5 max-w-[250px] text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-neutral-500">Son Bakım: <strong className="text-white">{item.lastMaintenance}</strong></span>
                                            <span className={`text-[11px] leading-tight ${item.condition.includes("Kusursuz") ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {item.condition}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-5 text-right border-l border-white/5">
                                        <button className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white hover:text-black transition-colors">
                                            Yönet
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden space-y-4 p-4">
                    {filteredInventory.map((item) => (
                        <div key={item.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#050B14] border border-white/5 flex items-center justify-center">
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold uppercase tracking-wide text-sm">{item.name}</h4>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{item.category}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 text-[9px] uppercase font-black tracking-widest rounded-md border ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-[9px] text-neutral-600 uppercase font-bold mb-1">Konum / Sorumlu</p>
                                    <p className="text-xs text-neutral-300 font-medium">{item.assignedTo}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-neutral-600 uppercase font-bold mb-1">Durum</p>
                                    <p className={`text-xs font-black ${item.condition.includes("Kusursuz") ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {item.condition.split(' - ')[0]}
                                    </p>
                                </div>
                            </div>

                            <button className="w-full mt-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-white/5">
                                DETAY & YÖNET
                            </button>
                        </div>
                    ))}
                </div>

                {filteredInventory.length === 0 && (
                    <div className="p-12 text-center text-neutral-500">
                        <Search className="mx-auto w-12 h-12 mb-4 opacity-20" />
                        <p>Aradığınız kriterlere uygun demirbaş bulunamadı.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
