"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileCode2, Map, ShieldAlert, FolderOpen, FileText } from "lucide-react";

export default function Dokumanlar() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/documents")
            .then(res => res.json())
            .then(data => {
                setDocuments(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "Map": return <Map size={24} />;
            case "FileCode2": return <FileCode2 size={24} />;
            case "ShieldAlert": return <ShieldAlert size={28} />;
            default: return <FileText size={24} />;
        }
    };

    const getColorClasses = (color: string) => {
        switch (color) {
            case "red": return "bg-red-600/10 text-red-500 group-hover:border-red-500/50";
            case "blue": return "bg-blue-600/10 text-blue-500 group-hover:border-blue-500/50";
            case "orange": return "bg-orange-600/10 text-orange-500 group-hover:border-orange-500/50";
            case "emerald": return "bg-emerald-600/10 text-emerald-500 group-hover:border-emerald-500/50";
            case "purple": return "bg-purple-600/10 text-purple-500 group-hover:border-purple-500/50";
            default: return "bg-neutral-600/10 text-neutral-500 group-hover:border-neutral-500/50";
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto h-full flex flex-col pt-8 pb-20">
            <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <BookOpen size={28} className="text-red-500" /> Döküman Arşivi
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Kılavuzlar ve operasyon protokolleri.</p>
            </div>

            {loading ? (
                <div className="text-center p-8 text-neutral-500">Yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc: any) => (
                        <div 
                            key={doc.id} 
                            onClick={() => doc.url && window.open(doc.url, "_blank")}
                            className="bg-[#050B14] border border-white/5 p-5 md:p-6 rounded-2xl shadow-xl hover:border-white/20 transition-colors cursor-pointer group flex flex-col h-full"
                        >
                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform ${getColorClasses(doc.color).split(" ").slice(0, 2).join(" ")}`}>
                                {getIcon(doc.icon)}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-2 uppercase tracking-tight">{doc.title}</h3>
                            <p className="text-neutral-500 text-xs md:text-sm mb-4 leading-relaxed line-clamp-3 flex-1">{doc.desc}</p>
                            <span className="self-start text-[10px] font-bold text-neutral-400 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                                {doc.type} ({doc.size})
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {!loading && documents.length === 0 && (
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-8 text-center text-neutral-500 border-dashed mt-8">
                    <FolderOpen className="mx-auto block mb-4 opacity-30" size={48} />
                    <p className="font-bold uppercase tracking-widest mb-2">Başka Belge Bulunamadı</p>
                    <p className="text-sm">Yöneticiler portalınıza yeni doküman eklediğinde bu alanda görünecektir.</p>
                </div>
            )}
        </div>
    );
}
