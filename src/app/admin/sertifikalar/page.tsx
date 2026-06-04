"use client";

import { useState, useEffect } from "react";
import { Award, CheckCircle, Search, FileBadge, Image as ImageIcon } from "lucide-react";


export default function AdminSertifikaYonetimi() {
    const [loading, setLoading] = useState(false);

    const [certName, setCertName] = useState("");
    const [certAuthority, setCertAuthority] = useState("");
    const [certImage, setCertImage] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [membersData, setMembersData] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/members')
            .then(res => res.json())
            .then(data => setMembersData(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert(`"${certName}" sertifikası seçilen üyeye başarıyla tanımlanmıştır.`);
            setCertName("");
            setCertAuthority("");
            setCertImage("");
            setSelectedUser("");
        }, 1200);
    };

    return (
        <div className="space-y-8 pb-20 max-w-5xl">
            {/* BAŞLIK */}
            <div>
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-blue-500" size={28} /> Sertifika Yönetimi
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic truncate pr-4">Resmi yetkinlik belgesi tanımlama.</p>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* SOL: SERTİFİKA OLUŞTURMA VE ATAMA */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><FileBadge size={100} /></div>

                    <div className="relative z-10">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-6 uppercase tracking-tight flex items-center gap-2 border-b border-white/5 pb-4">
                            Yeni Belge Tanımla
                        </h2>

                        <form onSubmit={handleAssign} className="space-y-6">

                            {/* Üye Seçimi */}
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                                    <label className="block text-[11px] font-bold text-blue-400 uppercase tracking-widest mb-2">Hangi Üyeye Tanımlanacak?</label>
                                    <select
                                        required
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full bg-[#020617] border border-blue-500/30 rounded px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 appearance-none text-sm"
                                    >
                                        <option value="" disabled>Üye Seçin...</option>
                                        {membersData.map((m: any) => (
                                            <option key={m.id} value={m.id}>
                                                {m.fullName || m.Name} ({m.id})
                                            </option>
                                        ))}
                                        <option value="all">TÜM ÜYELERE TOPLU ATA (Genel Eğitim)</option>
                                    </select>
                                </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Sertifika / Eğitim Adı</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Örn: AFAD Hafif Arama Kurtarma Sertifikası"
                                    value={certName}
                                    onChange={e => setCertName(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors uppercase tracking-wide text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Düzenleyen Kurum</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Örn: Kızılay, Başbakanlık, M1G Akademi"
                                    value={certAuthority}
                                    onChange={e => setCertAuthority(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors uppercase tracking-wide text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <ImageIcon size={14} /> Rozet / Belge Görseli (URL)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Şimdilik opsiyonel..."
                                    value={certImage}
                                    onChange={e => setCertImage(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-neutral-400 focus:outline-none focus:border-red-500 transition-colors text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
                            >
                                {loading ? 'TANIMLANIYOR...' : <><CheckCircle size={18} /> BELGEYİ RESMİLEŞTİR</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* SAĞ: VERİLEN SERTİFİKALAR ARŞİVİ (Mock) */}
                <div className="bg-[#050B14] border border-white/5 rounded-2xl p-5 md:p-8 shadow-xl">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-6 uppercase tracking-tight border-b border-white/5 pb-4 flex justify-between items-center">
                        Arşiv Kayıtları
                        <Search size={18} className="text-neutral-500" />
                    </h2>

                    <div className="space-y-4">
                        {[
                            { name: "Kentsel Arama Kurtarma", user: "Ahmet Yılmaz", date: "GÜNCEL" },
                            { name: "Temel İlkyardım Uzmanlığı", user: "TÜM ÜYELER", date: "GÜNCEL" },
                            { name: "Telsiz ve Haberleşme", user: "Ayşe Demir", date: "GÜNCEL" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#020617] p-4 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                <div>
                                    <h4 className="text-white font-bold text-sm tracking-wide">{item.name}</h4>
                                    <p className="text-neutral-500 text-xs mt-1 uppercase tracking-wider flex items-center gap-1">
                                        <Award size={12} className="text-blue-500" /> {item.user}
                                    </p>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] items-center flex font-bold px-2 py-1 uppercase tracking-widest rounded mt-3 sm:mt-0">
                                    {item.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
