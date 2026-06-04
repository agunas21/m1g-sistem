"use client";

import { useState, useEffect } from "react";
import { FolderArchive, Download, File, Search, FileImage, FileText } from "lucide-react";

export default function SistemArsivi() {
    const [archives, setArchives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/archive").then(r => r.json()).then(d => {
            if(d.archives) setArchives(d.archives);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = archives.filter(a => 
        (a.originalName + a.uploadedBy + a.category).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                        <FolderArchive className="text-red-500" size={28} /> Sistem Arşivi
                    </h1>
                    <p className="text-neutral-500 text-sm md:text-lg font-light italic">Üyelerin yüklediği avatar, sertifika ve belgelerin merkezi depolama alanı.</p>
                </div>
            </div>

            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/5 bg-black/40 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            placeholder="Dosya adı, kullanıcı veya kategori ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-red-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400 min-w-[800px]">
                        <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5 font-bold">Dosya</th>
                                <th className="px-6 py-5 font-bold">Kategori / Tip</th>
                                <th className="px-6 py-5 font-bold">Boyut</th>
                                <th className="px-6 py-5 font-bold">Yükleyen</th>
                                <th className="px-6 py-5 font-bold">Tarih</th>
                                <th className="px-6 py-5 font-bold">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10"><FolderArchive className="animate-pulse mx-auto text-red-500 mb-2"/> Yükleniyor...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-neutral-500">Arşiv boş.</td></tr>
                            ) : filtered.map((file) => (
                                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {file.type.includes('image') ? (
                                                <div className="w-10 h-10 rounded border border-white/10 overflow-hidden bg-black flex-shrink-0">
                                                    <img src={file.url} alt="thumbnail" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded border border-white/10 bg-black flex items-center justify-center flex-shrink-0">
                                                    <FileText size={20} className="text-blue-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-bold text-xs truncate max-w-[150px]">{file.originalName}</p>
                                                <p className="text-[10px] text-neutral-500 mt-1 font-mono">{file.fileName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest block w-max mb-1">
                                            {file.category}
                                        </span>
                                        <span className="text-[10px] text-neutral-500">{file.type}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </td>
                                    <td className="px-6 py-4 text-white text-xs font-bold">
                                        {file.uploadedBy}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {new Date(file.uploadedAt).toLocaleDateString("tr-TR")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={file.url} download={file.originalName} target="_blank" rel="noreferrer" className="w-8 h-8 rounded bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white flex items-center justify-center transition-colors">
                                            <Download size={14} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
