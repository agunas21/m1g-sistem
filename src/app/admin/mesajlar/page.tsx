"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, Phone, MessageSquare, Calendar, CheckCircle2, Trash2, Clock, Inbox, Search } from "lucide-react";

export default function MessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread, read
    const [searchTerm, setSearchText] = useState("");

    useEffect(() => {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error("Mesajlar alınamadı:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "messages", id), { status: "read" });
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const deleteMessage = async (id: string) => {
        if (confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
            try {
                await deleteDoc(doc(db, "messages", id));
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const filteredMessages = messages.filter(m => {
        const matchesFilter = filter === "all" || m.status === filter;
        const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             m.message?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Mail className="text-red-500" size={32} />
                            İletişim Mesajları
                        </h1>
                        <p className="text-neutral-500 text-sm mt-1 font-medium tracking-wide uppercase">Gelen kutusu ve ziyaretçi talepleri</p>
                    </div>

                    <div className="flex items-center gap-2 bg-neutral-900/50 p-1.5 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'all' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Tümü
                        </button>
                        <button 
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter === 'unread' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Okunmamış
                        </button>
                    </div>
                </header>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input 
                        type="text"
                        placeholder="İsim, e-posta veya mesaj içeriğinde ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-500 animate-pulse">
                        <Clock className="mb-4" size={48} />
                        <p className="font-bold uppercase tracking-widest text-xs">Mesajlar Yükleniyor...</p>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/5">
                        <Inbox className="mx-auto text-neutral-700 mb-4" size={64} />
                        <p className="text-neutral-500 font-medium">Henüz mesaj bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`relative group bg-[#050B14] border rounded-2xl p-6 transition-all ${msg.status === 'unread' ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/5 opacity-80'}`}
                                >
                                    {msg.status === 'unread' && (
                                        <div className="absolute top-6 right-6 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-1 border-r border-white/5 pr-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm leading-tight">{msg.name}</h3>
                                                    <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">{msg.subject}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-neutral-400 text-xs">
                                                    <Mail size={14} className="text-neutral-600" />
                                                    <span className="truncate">{msg.email}</span>
                                                </div>
                                                {msg.phone && (
                                                    <div className="flex items-center gap-2 text-neutral-400 text-xs">
                                                        <Phone size={14} className="text-neutral-600" />
                                                        <span>{msg.phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase mt-4">
                                                    <Calendar size={12} />
                                                    <span>{msg.createdAt?.toDate().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare size={18} className="text-red-500/50 mt-1 shrink-0" />
                                                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1 flex md:flex-col justify-end gap-2">
                                            {msg.status === 'unread' && (
                                                <button 
                                                    onClick={() => markAsRead(msg.id)}
                                                    className="flex-1 md:flex-none py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Okundu İşaretle
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteMessage(msg.id)}
                                                className="flex-1 md:flex-none py-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Mesajı Sil
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
