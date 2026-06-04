"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Save, FileText, Map, FileCode2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDokumanlar() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [type, setType] = useState("PDF");
    const [size, setSize] = useState("");
    const [url, setUrl] = useState("");
    const [icon, setIcon] = useState("FileText");
    const [color, setColor] = useState("red");

    useEffect(() => {
        fetch("/api/documents")
            .then(res => res.json())
            .then(data => {
                setDocuments(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const newDoc = { title, desc, type, size, url, icon, color };

        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDoc)
            });
            const data = await res.json();
            if (data.success) {
                setDocuments([...documents, data.document]);
                // Formu sıfırla
                setTitle(""); setDesc(""); setType("PDF"); setSize(""); setUrl("");
            }
        } catch (error) {
            alert("Döküman eklenirken hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu dökümanı silmek istediğinize emin misiniz?")) return;
        
        try {
            await fetch("/api/documents", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (error) {
            alert("Döküman silinirken hata oluştu.");
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "Map": return <Map size={16} />;
            case "FileCode2": return <FileCode2 size={16} />;
            case "ShieldAlert": return <ShieldAlert size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <BookOpen className="text-red-500" size={28} /> Döküman Yönetimi
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Portal üzerinden üyelere sunulacak resmi kılavuz ve dökümanları buradan yönetebilirsiniz.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* YENİ DÖKÜMAN EKLEME FORMU */}
                <div className="lg:col-span-1 bg-[#050B14] border border-white/10 rounded-2xl p-6 h-fit">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                        <Plus size={16} className="text-red-500" /> Yeni Döküman Ekle
                    </h2>
                    
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Döküman Adı *</label>
                            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none" placeholder="Örn: Telsiz Kodları" />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Kısa Açıklama *</label>
                            <textarea required rows={3} value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none resize-none" placeholder="Döküman hakkında kısa bilgi..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Dosya Tipi</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none">
                                    <option value="PDF">PDF</option>
                                    <option value="XLSX">Excel (XLSX)</option>
                                    <option value="DOCX">Word (DOCX)</option>
                                    <option value="ZIP">Arşiv (ZIP)</option>
                                    <option value="LINK">Dış Bağlantı</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Boyut / Bilgi</label>
                                <input value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none" placeholder="Örn: 2.4 MB" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Döküman URL / Dosya Linki *</label>
                            <input required type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none" placeholder="https://..." />
                            <p className="text-[10px] text-neutral-600 mt-1">Dökümanı Google Drive veya benzeri bir buluta yükleyip paylaşım linkini buraya yapıştırın.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">İkon</label>
                                <select value={icon} onChange={e => setIcon(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none">
                                    <option value="FileText">Varsayılan Dosya</option>
                                    <option value="Map">Harita/Plan</option>
                                    <option value="FileCode2">Kod/Teknik</option>
                                    <option value="ShieldAlert">Güvenlik/Teçhizat</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 tracking-widest">Tema Rengi</label>
                                <select value={color} onChange={e => setColor(e.target.value)} className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none">
                                    <option value="red">Kırmızı (M1G)</option>
                                    <option value="blue">Mavi</option>
                                    <option value="orange">Turuncu</option>
                                    <option value="emerald">Yeşil</option>
                                    <option value="purple">Mor</option>
                                    <option value="neutral">Gri</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            <Save size={16} /> {saving ? "Ekleniyor..." : "Dökümanı Ekle"}
                        </button>
                    </form>
                </div>

                {/* DÖKÜMAN LİSTESİ */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center p-8 text-neutral-500">Yükleniyor...</div>
                    ) : documents.length === 0 ? (
                        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-12 text-center text-neutral-500 border-dashed">
                            <BookOpen className="mx-auto block mb-4 opacity-30" size={48} />
                            <p className="font-bold uppercase tracking-widest mb-2">Henüz Döküman Yok</p>
                            <p className="text-sm">Sol taraftaki formu kullanarak yeni döküman ekleyebilirsiniz.</p>
                        </div>
                    ) : (
                        documents.map((doc: any) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={doc.id} className="bg-[#050B14] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${doc.color}-600/10 text-${doc.color}-500`}>
                                        {getIcon(doc.icon)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm tracking-tight">{doc.title}</h3>
                                        <p className="text-neutral-500 text-xs mt-0.5 line-clamp-1">{doc.desc}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                                                {doc.type} ({doc.size})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg text-center transition-colors">
                                        Test Et
                                    </a>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
