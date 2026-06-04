"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from 'qrcode.react';
import { 
    Mail, MessageCircle, ShieldCheck, Search, UserPlus, FileText, Ban, UserMinus, 
    BellRing, UserCheck, XCircle, X, Phone, User, Droplet, MapPin, Award, 
    Briefcase, GraduationCap, Calendar, Activity, ChevronRight, PackageOpen, RefreshCw,
    KeyRound, ShieldAlert, Eye, Loader2, Download, CheckCircle, AlertCircle, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MaskedField } from "@/components/MaskedField";

export default function UyeYonetimi() {
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("Tümü");
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("genel");
    const [mounted, setMounted] = useState(false);
    const [baseUrl, setBaseUrl] = useState("http://localhost:3000");
    const [showNewMember, setShowNewMember] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [banReason, setBanReason] = useState("");
    const [showBanModal, setShowBanModal] = useState(false);
    const [showMedicalModal, setShowMedicalModal] = useState(false);
    const [medicalData, setMedicalData] = useState({ bloodType: "", emergencyContact: "" });
    const [currentUser, setCurrentUser] = useState<any>(null); // Giriş yapan kullanıcı

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
        // Mevcut kullanıcı bilgisini al (maskeleme kararı için)
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data && data.user) setCurrentUser(data.user); })
            .catch(() => {});

        fetch('/api/members')
            .then(res => res.json())
            .then(data => {
                const formattedMembers = data.map((m: any) => {
                    const isPasif = (m.dir && (m.dir.includes("PASİF") || m.dir.includes("İPTAL"))) || m.status === "Pasif";
                    return {
                        id: m.id,       // UUID veya string ID — artık sequential değil
                        realId: m.id,
                        kimlikToken: m.kimlikToken,
                        name: m.fullName || "İsimsiz",
                        email: m.email || `${m.id}@m1g.org.tr`,
                        phone: m.phone || "Belirtilmemiş",
                        role: getRole(m),
                        joinDate: m.joinDate || "01.01.2024",
                        certs: m.certs || [],
                        status: isPasif ? "Pasif" : "Aktif",
                        tcNo: m.tcNo || "Belirtilmemiş",
                        profession: m.profession || "Belirtilmemiş",
                        education: m.education || "Belirtilmemiş",
                        bloodType: m.bloodType || "Belirtilmemiş",
                        emergencyContact: m.emergencyContact || "Belirtilmemiş",
                        address: m.address || "Belirtilmemiş",
                        inventory: m.inventory || [],
                        operations: m.operations || [],
                        ftrRecords: m.ftrRecords || []
                    };
                });
                setMembers(formattedMembers);
            })
            .catch(console.error);
    }, []);

    // Yönetim Kurulu (Admin) ID'leri
    const adminIds = ['cgorgu', 'taksit', 'mtasli', 'mseyre', 'gakdor', 'agunas'];

    useEffect(() => {
        if (selectedMember) {
            setMedicalData({
                bloodType: selectedMember.bloodType || "",
                emergencyContact: selectedMember.emergencyContact || ""
            });
        }
    }, [selectedMember]);

    const getRole = (m: any) => {
        // Öncelik özel rollerde
        if (m.memberType && m.memberType !== "Üye" && m.memberType !== "Gönüllü") {
            return m.memberType;
        }
        if (adminIds.includes(m.id)) return "Yönetim Kurulu Üyesi";
        if (m.honorary === "Evet") return "Onur Üyesi";
        if (m.memberType === "Üye") return "Asil Üye";
        return "Gönüllü";
    };

    const roleColors: Record<string, string> = {
        "Yönetim Kurulu Başkanı": "bg-red-500/10 text-red-400 border-red-500/20",
        "Başkan Yardımcısı": "bg-orange-500/10 text-orange-400 border-orange-500/20",
        "Genel Sekreter": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "Sayman": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        "Yönetim Kurulu Üyesi": "bg-purple-500/10 text-purple-400 border-purple-500/20",
        "Denetim Kurulu Başkanı": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        "Denetim Kurulu Üyesi": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        "Disiplin Kurulu Başkanı": "bg-teal-500/10 text-teal-400 border-teal-500/20",
        "Disiplin Kurulu Üyesi": "bg-teal-500/10 text-teal-400 border-teal-500/20",
        "Onur Üyesi": "bg-amber-500/10 text-amber-400 border-amber-500/20",
        "Asil Üye": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "Gönüllü": "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    };

    const roleBadges: Record<string, string> = {
        "Yönetim Kurulu Başkanı": "bg-red-600",
        "Başkan Yardımcısı": "bg-orange-600",
        "Genel Sekreter": "bg-blue-600",
        "Sayman": "bg-emerald-600",
        "Yönetim Kurulu Üyesi": "bg-purple-600",
        "Denetim Kurulu Başkanı": "bg-indigo-600",
        "Denetim Kurulu Üyesi": "bg-indigo-600",
        "Disiplin Kurulu Başkanı": "bg-teal-600",
        "Disiplin Kurulu Üyesi": "bg-teal-600",
        "Onur Üyesi": "bg-amber-500",
        "Asil Üye": "bg-blue-600",
        "Gönüllü": "bg-neutral-600",
    };

    // JSON Veritabanından üyeleri yükleme (API'den dinamik çekilecek)
    const [members, setMembers] = useState<any[]>([]);

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search);
        
        const boardRoles = [
            "Yönetim Kurulu Başkanı", "Başkan Yardımcısı", "Sayman", "Yönetim Kurulu Üyesi", "Genel Sekreter",
            "Denetim Kurulu Başkanı", "Denetim Kurulu Üyesi", "Disiplin Kurulu Başkanı", "Disiplin Kurulu Üyesi"
        ];
        
        let matchesRole = false;
        if (filterRole === "Tümü") matchesRole = true;
        else if (filterRole === "Yönetim Kurulu Üyeleri") {
            matchesRole = boardRoles.includes(m.role);
        } else if (filterRole === "Gönüllüler") {
            matchesRole = m.role === "Gönüllü";
        } else if (filterRole === "Üyeler") {
            matchesRole = ["Asil Üye", "Onur Üyesi", "Üye"].includes(m.role);
        } else if (filterRole === "Pasif Üyeler") {
            matchesRole = m.status === "Pasif";
        }
        
        // Eğer Pasif Üyeler filtresinde değilsek, pasif üyeleri gizlemek isteyebiliriz ama
        // sistemde şimdilik "Tümü" seçildiğinde de çıkıyor. Bunu koruyalım.
        
        return matchesSearch && matchesRole;
    }).sort((a, b) => {
        // Pasif üyeler her zaman en alta
        if (a.status === "Pasif" && b.status !== "Pasif") return 1;
        if (a.status !== "Pasif" && b.status === "Pasif") return -1;
        return 0;
    });

    const handleMassEmail = () => {
        const emails = filteredMembers
            .filter(m => m.status !== 'Banlı' && m.status !== 'Pasif')
            .map(m => m.email)
            .filter(e => e && e !== "Belirtilmemiş")
            .join(",");
        if(emails) window.location.href = `mailto:${emails}?subject=M1G Operasyon Merkezi Bildirimi`;
        else alert("Seçili kriterde e-posta bulunamadı.");
    };

    const handleMassWhatsApp = () => {
        alert("Sistem M1G Resmi WhatsApp Haberleşme (API) modülüne bağlanıyor... Filtrelenen üyelere yayın yapılacak.");
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Ad Soyad", "E-posta", "Telefon", "Kan Grubu", "Durum", "Rol"];
        const rows = filteredMembers.map(m => [
            m.realId, m.name, m.email, m.phone, m.bloodType, m.status, m.role
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "m1g_personel_listesi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkCards = () => {
        window.open('/admin/toplu-kimlik', '_blank');
    };

    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

    const handleApprove = (id: number) => {
        setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
        alert("Güncelleme onaylandı ve karargaha işlendi.");
    };

    const handleReject = (id: number) => {
        setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
        alert("Güncelleme reddedildi.");
    };

    const toggleMemberStatus = (id: number) => {
        setMembers(members.map(m => {
            if (m.id === id) {
                const newStatus = m.status === 'Aktif' ? 'Pasif' : 'Aktif';
                if (selectedMember && selectedMember.id === id) {
                    setSelectedMember({ ...selectedMember, status: newStatus });
                }
                return { ...m, status: newStatus };
            }
            return m;
        }));
    };

    // ─── BAN / UNBAN ────────────────────────────────────────────────────
    const handleBan = async () => {
        if (!selectedMember) return;
        setActionLoading(true);
        try {
            await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: selectedMember.realId, action: 'ban', reason: banReason })
            });
            setMembers(members.map(m => m.id === selectedMember.id ? { ...m, status: 'Banlı' } : m));
            setSelectedMember({ ...selectedMember, status: 'Banlı' });
            setShowBanModal(false); setBanReason("");
            alert(`⛔ ${selectedMember.name} banlandı.`);
        } finally { setActionLoading(false); }
    };

    const handleUnban = async () => {
        if (!selectedMember) return;
        setActionLoading(true);
        try {
            await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: selectedMember.realId, action: 'unban' })
            });
            setMembers(members.map(m => m.id === selectedMember.id ? { ...m, status: 'Aktif' } : m));
            setSelectedMember({ ...selectedMember, status: 'Aktif' });
            alert(`✅ ${selectedMember.name} banı kaldırıldı.`);
        } finally { setActionLoading(false); }
    };

    // ─── ADMIN ŞİFRE SIFIRLAMA ──────────────────────────────────────────
    const handleAdminResetPassword = async () => {
        if (!selectedMember) return;
        if (!confirm(`${selectedMember.name} için şifre TC numarasına sıfırlansın mı?`)) return;
        setActionLoading(true);
        try {
            await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: selectedMember.realId, action: 'reset_password' })
            });
            alert(`✅ ${selectedMember.name} şifresi TC numarasına sıfırlandı.`);
        } finally { setActionLoading(false); }
    };

    // ─── ADMIN PERSONEL SILME ───────────────────────────────────────────
    const handleDeleteMember = async () => {
        if (!selectedMember) return;
        if (!confirm(`⚠️ DİKKAT! ${selectedMember.name} isimli personeli sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/members?memberId=${selectedMember.realId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMembers(members.filter(m => m.id !== selectedMember.id));
                setSelectedMember(null);
                alert(`✅ Personel sistemden başarıyla tamamen silindi.`);
            } else {
                const err = await res.json();
                alert(`❌ Hata: ${err.error || 'Silme işlemi başarısız.'}`);
            }
        } catch (error) {
            console.error(error);
            alert('❌ Sunucu bağlantı hatası.');
        } finally { setActionLoading(false); }
    };

    // ─── YENİ ÜYE EKLEME ────────────────────────────────────────────────
    const handleNewMember = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setActionLoading(true);
        const fd = new FormData(e.currentTarget);
        const payload: Record<string, string> = {};
        fd.forEach((v, k) => { payload[k] = v as string; });
        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ ${payload.fullName} sisteme eklendi!\nHoş geldin maili gönderildi (simülasyon).\n\nGiriş bilgileri:\n- TC / E-posta / Telefon ile giriş\n- İlk şifre: TC Kimlik No`);
                setShowNewMember(false);
                // Sayfayı yenile
                window.location.reload();
            } else {
                alert('❌ ' + (data.error || 'Kayıt başarısız.'));
            }
        } finally { setActionLoading(false); }
    };

    const renderDrawer = () => {
        if (!selectedMember || !mounted) return null;

        const drawerContent = (
            <AnimatePresence>
                {selectedMember && (
                    <div className="portal-root">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                            onClick={() => setSelectedMember(null)}
                        />
                        <motion.div 
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full max-w-xl bg-[#050B14] border-l border-white/10 z-[9999] shadow-2xl overflow-y-auto flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="shrink-0 p-6 md:p-8 bg-neutral-900/50 border-b border-white/5 relative">
                                <button onClick={() => setSelectedMember(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white">
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-5 mt-4">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg ${roleBadges[selectedMember.role]}`}>
                                        {selectedMember.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{selectedMember.name}</h2>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${roleColors[selectedMember.role]}`}>
                                                {selectedMember.role}
                                            </span>
                                            <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                                                selectedMember.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                selectedMember.status === 'Banlı' ? 'bg-red-600/20 text-red-400 border-red-500/30 animate-pulse' :
                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                                {selectedMember.status}
                                            </span>
                                        </div>

                                        {/* ADMIN AKSIYONLARI */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {selectedMember.status !== 'Banlı' ? (
                                                <button onClick={() => setShowBanModal(true)}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-colors">
                                                    <Ban size={11} /> Banla
                                                </button>
                                            ) : (
                                                <button onClick={handleUnban}
                                                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-colors">
                                                    <UserCheck size={11} /> Ban Kaldır
                                                </button>
                                            )}
                                            <button onClick={handleAdminResetPassword}
                                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-colors">
                                                <KeyRound size={11} /> Şifre Sıfırla
                                            </button>
                                            <button onClick={() => toggleMemberStatus(selectedMember.id)}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-colors">
                                                <RefreshCw size={11} /> Durum Değiştir
                                            </button>
                                            <button onClick={handleDeleteMember}
                                                className="px-3 py-1.5 bg-red-600/25 hover:bg-red-600/45 text-red-400 border border-red-500/35 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 transition-colors">
                                                <Trash2 size={11} /> Üyeyi Sil
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Navigation */}
                            <div className="shrink-0 flex flex-wrap border-b border-white/5 bg-[#020617] px-2 md:px-6 relative gap-y-2 pb-2 pt-2">
                                {['genel', 'kimlik', 'tibbi', 'aidat', 'sertifikalar', 'zimmet', 'operasyon'].map((tab) => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-shrink-0 px-4 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                                    >
                                        {tab === 'genel' ? 'Genel Bilgiler' : tab === 'kimlik' ? 'Dijital Kimlik' : tab === 'tibbi' ? 'Tıbbi Profil' : tab === 'aidat' ? 'Aidat Takip' : tab === 'sertifikalar' ? 'Eğitim & Yetkinlik' : tab === 'zimmet' ? 'Zimmet Takibi' : 'Op. Geçmişi'}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Drawer Content */}
                            <div className="p-6 md:p-8 flex-1">
                                {activeTab === 'genel' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Telefon — maskeli (Super Admin hariç) */}
                                            <MaskedField
                                                label="Telefon"
                                                maskedValue={selectedMember.phone
                                                    ? selectedMember.phone.replace(/\d(?=\d{3})/g, '*').slice(0, 4) + '****' + selectedMember.phone.slice(-3)
                                                    : 'Belirtilmemiş'
                                                }
                                                memberId={selectedMember.realId}
                                                field="phone"
                                                isSuperAdmin={currentUser?.isSuperAdmin === true}
                                                rawValue={selectedMember.phone}
                                                icon={<Phone size={16} />}
                                            />
                                            {/* E-posta — maskeli (Super Admin hariç) */}
                                            <MaskedField
                                                label="E-Posta"
                                                maskedValue={selectedMember.email
                                                    ? '*****@' + (selectedMember.email.split('@')[1] || 'm1g.org.tr')
                                                    : 'Belirtilmemiş'
                                                }
                                                memberId={selectedMember.realId}
                                                field="email"
                                                isSuperAdmin={currentUser?.isSuperAdmin === true}
                                                rawValue={selectedMember.email}
                                                icon={<Mail size={16} />}
                                            />
                                            {/* TC Kimlik No — maskeli (Super Admin hariç) */}
                                            <MaskedField
                                                label="T.C. Kimlik No"
                                                maskedValue={selectedMember.tcNo && selectedMember.tcNo !== 'Belirtilmemiş'
                                                    ? selectedMember.tcNo.slice(0, 5) + '****' + selectedMember.tcNo.slice(-2)
                                                    : 'Belirtilmemiş'
                                                }
                                                memberId={selectedMember.realId}
                                                field="tcNo"
                                                isSuperAdmin={currentUser?.isSuperAdmin === true}
                                                rawValue={selectedMember.tcNo}
                                                icon={<User size={16} />}
                                            />
                                            <InfoCard icon={<Calendar size={16} className="text-orange-500" />} label="Doğum Tarihi" value={selectedMember.birthDate || "Belirtilmemiş"} />
                                            <InfoCard icon={<Droplet size={16} className="text-red-500" />} label="Kan Grubu" value={selectedMember.bloodType} />
                                            <InfoCard icon={<Briefcase size={16} />} label="Meslek" value={selectedMember.profession} />
                                            <InfoCard icon={<GraduationCap size={16} />} label="Eğitim Durumu" value={selectedMember.education} />
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                                <AlertCircle size={16} className="text-orange-500" />
                                                <span className="text-[10px] uppercase font-bold tracking-widest">Acil Durum İrtibatı</span>
                                            </div>
                                            <div className="text-white font-medium text-sm">{selectedMember.emergencyContact}</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 text-neutral-400 mb-2">
                                                <MapPin size={16} />
                                                <span className="text-[10px] uppercase font-bold tracking-widest">Açık Adres</span>
                                            </div>
                                            <div className="text-white font-medium text-sm">{selectedMember.address}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="bg-[#020617] p-4 rounded-xl border border-white/5 text-center">
                                                <Calendar size={24} className="text-blue-500 mx-auto mb-2 opacity-50" />
                                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Kayıt Tarihi</div>
                                                <div className="text-white font-mono">{selectedMember.joinDate}</div>
                                            </div>
                                            <div className="bg-[#020617] p-4 rounded-xl border border-white/5 text-center">
                                                <Activity size={24} className="text-emerald-500 mx-auto mb-2 opacity-50" />
                                                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Hazırlık Skoru</div>
                                                <div className="text-emerald-400 font-bold text-xl">95/100</div>
                                            </div>
                                        </div>

                                        {/* ÜYELİK TİPİ (ROLE) DEĞİŞTİRME */}
                                        <div className="mt-6 bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 bg-red-600/20 rounded-bl-xl border-b border-l border-red-500/20">
                                                <span className="text-[8px] text-red-400 font-black uppercase tracking-widest">Sadece Yönetim</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-400 mb-4">
                                                <ShieldCheck size={16} className="text-purple-500" />
                                                <span className="text-[10px] uppercase font-bold tracking-widest">Yetki ve Üyelik Tipi Ata</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <select 
                                                    value={selectedMember.role}
                                                    onChange={(e) => {
                                                        const newRole = e.target.value;
                                                        const newMembers = members.map(m => m.id === selectedMember.id ? { ...m, role: newRole } : m);
                                                        setMembers(newMembers);
                                                        setSelectedMember({ ...selectedMember, role: newRole });
                                                        
                                                        fetch('/api/members', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ memberId: selectedMember.realId, action: 'update_role', role: newRole })
                                                        }).catch(console.error);
                                                    }}
                                                    className="flex-1 bg-[#020617] border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                                                >
                                                    <option value="Gönüllü">Gönüllü</option>
                                                    <option value="Asil Üye">Asil Üye</option>
                                                    <option value="Onur Üyesi">Onur Üyesi</option>
                                                    <option value="Lojistik Sorumlusu">Lojistik Sorumlusu</option>
                                                    <option value="Denetim Kurulu Üyesi">Denetim Kurulu Üyesi</option>
                                                    <option value="Denetim Kurulu Başkanı">Denetim Kurulu Başkanı</option>
                                                    <option value="Disiplin Kurulu Üyesi">Disiplin Kurulu Üyesi</option>
                                                    <option value="Disiplin Kurulu Başkanı">Disiplin Kurulu Başkanı</option>
                                                    <option value="Yönetim Kurulu Üyesi">Yönetim Kurulu Üyesi</option>
                                                    <option value="Sayman">Sayman</option>
                                                    <option value="Genel Sekreter">Genel Sekreter</option>
                                                    <option value="Başkan Yardımcısı">Başkan Yardımcısı</option>
                                                    <option value="Yönetim Kurulu Başkanı">Yönetim Kurulu Başkanı</option>
                                                </select>
                                                <button className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center">
                                                    Ata
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-neutral-500 mt-2">Not: Bu değişiklik üyenin portal erişim yetkilerini ve ana sayfadaki konumunu etkiler.</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'kimlik' && (
                                    <div className="space-y-6">
                                        {/* Mini Preview */}
                                        <div className="w-full bg-gradient-to-br from-[#020617] to-[#0a1628] rounded-2xl border border-white/10 overflow-hidden shadow-xl relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-600 to-red-800" />
                                            <div className="p-6 pl-8 flex items-center gap-5">
                                                <div className="w-16 h-16 bg-neutral-800 border border-white/10 rounded-xl flex items-center justify-center">
                                                    <span className="text-2xl font-black text-white/30">{selectedMember.name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-white font-black uppercase tracking-wide text-sm">{selectedMember.name}</h3>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-600/90 text-white text-[9px] font-black uppercase tracking-widest rounded">{selectedMember.role}</span>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-[10px] text-neutral-500 font-mono">TC: {selectedMember.tcNo}</p>
                                                        <p className="text-[10px] text-red-400 font-bold">Kan Grubu: {selectedMember.bloodType}</p>
                                                        <p className="text-[10px] text-neutral-500 font-mono">M1G-{selectedMember.id.toString().padStart(4,'0')}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2 rounded-lg shrink-0">
                                                    <QRCodeSVG value={`${baseUrl}/kimlik/${selectedMember.kimlikToken}`} size={64} level="M" fgColor="#000" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tam Ekran Butonu */}
                                        <a
                                            href={`${baseUrl}/kimlik/${selectedMember.kimlikToken}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-3 w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(239,68,68,0.3)]"
                                        >
                                            <Eye size={18} /> Kimlik Kartını Görüntüle &amp; İndir
                                        </a>

                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                            <p className="text-amber-400 text-[11px] leading-relaxed">
                                                <strong className="block text-amber-300 uppercase tracking-widest text-[10px] mb-1">⚠ Yönetim Notu</strong>
                                                Kimlik kartı sadece yönetim tarafından erişilebilir. Ön ve arka yüzü PNG olarak 300 DPI baskıya hazır şekilde indirilebilir. Fiziki baskı yönetim kurulu kararıyla yapılır.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'tibbi' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white font-bold tracking-tight">Tıbbi Profil ve Acil Durum</h3>
                                            <button 
                                                onClick={() => setShowMedicalModal(true)}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase font-bold text-neutral-400 transition-colors border border-white/5">
                                                Düzenle
                                            </button>
                                        </div>
                                        <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 bg-red-600/10 rounded-bl-2xl">
                                                <Droplet size={24} className="text-red-500" />
                                            </div>
                                            <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Kan Grubu</div>
                                            <div className="text-2xl font-black text-white">{selectedMember.bloodType || "Bilinmiyor"}</div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="bg-[#020617] border border-white/5 p-5 rounded-2xl">
                                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <AlertCircle size={14} className="text-orange-500" /> Alerjiler
                                                </div>
                                                <div className="text-white text-sm font-medium">{selectedMember.allergies || "Bilinen bir alerjisi yoktur."}</div>
                                            </div>
                                            <div className="bg-[#020617] border border-white/5 p-5 rounded-2xl">
                                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Activity size={14} className="text-purple-500" /> Kronik Hastalıklar
                                                </div>
                                                <div className="text-white text-sm font-medium">{selectedMember.chronicIllnesses || "Bilinen bir kronik hastalığı yoktur."}</div>
                                            </div>
                                            <div className="bg-[#020617] border border-white/5 p-5 rounded-2xl">
                                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Phone size={14} className="text-emerald-500" /> Acil Durumda Ulaşılacak Kişi
                                                </div>
                                                <div className="text-white text-sm font-medium mb-1">{selectedMember.emergencyContactName || selectedMember.emergencyContact || "Tanımlanmamış"}</div>
                                                {selectedMember.emergencyContactPhone && (
                                                    <div className="text-emerald-400 font-mono text-sm">{selectedMember.emergencyContactPhone}</div>
                                                )}
                                            </div>
                                            
                                            {/* FTR / Saha Tıbbi Kayıtları */}
                                            <div className="bg-[#020617] border border-white/5 p-5 rounded-2xl">
                                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Activity size={14} className="text-red-500 animate-pulse" /> FTR &amp; Saha Tıbbi Kayıt Takip Havuzu
                                                </div>
                                                <div className="space-y-3">
                                                    {selectedMember.ftrRecords && selectedMember.ftrRecords.length > 0 ? (
                                                        selectedMember.ftrRecords.map((rec: any, idx: number) => (
                                                            <div key={idx} className="bg-white/5 border border-white/5 p-3.5 rounded-xl space-y-1">
                                                                <div className="flex justify-between items-center text-[10px] text-neutral-500">
                                                                    <span className="font-bold text-red-400">{rec.date}</span>
                                                                    <span className="font-mono text-[9px]">{rec.operationId}</span>
                                                                 </div>
                                                                 <p className="text-xs text-white font-extrabold">{rec.operationName}</p>
                                                                 <p className="text-xs text-neutral-300 leading-relaxed font-mono mt-1 bg-black/40 p-2.5 rounded-lg border border-white/5">🩺 {rec.note}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-neutral-500 text-xs italic py-2">Saha operasyonlarında raporlanmış bir tıbbi/fiziksel burkulma veya yaralanma kaydı bulunmuyor.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'aidat' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-white font-bold tracking-tight">Aidat Takip Sistemi</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center">
                                                <div className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest mb-1">2026 Yılı</div>
                                                <div className="text-xl font-black text-emerald-400">ÖDENDİ</div>
                                            </div>
                                            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-center">
                                                <div className="text-[10px] text-red-500/70 font-bold uppercase tracking-widest mb-1">Gecikmiş Borç</div>
                                                <div className="text-xl font-black text-red-400">0 ₺</div>
                                            </div>
                                        </div>
                                        <div className="bg-[#020617] border border-white/5 rounded-2xl overflow-hidden">
                                            <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                                                <span className="text-xs font-bold text-white uppercase tracking-widest">Ödeme Geçmişi</span>
                                                <button className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1 hover:text-emerald-400">
                                                    + Ödeme Ekle
                                                </button>
                                            </div>
                                            <div className="divide-y divide-white/5">
                                                <div className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                                    <div>
                                                        <div className="text-white font-bold text-sm">2026 Yıllık Aidat</div>
                                                        <div className="text-neutral-500 text-[10px] font-mono mt-0.5">14.02.2026 - Kredi Kartı</div>
                                                    </div>
                                                    <div className="text-emerald-400 font-bold">1200 ₺</div>
                                                </div>
                                                <div className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                                    <div>
                                                        <div className="text-white font-bold text-sm">2025 Yıllık Aidat</div>
                                                        <div className="text-neutral-500 text-[10px] font-mono mt-0.5">05.01.2025 - Havale</div>
                                                    </div>
                                                    <div className="text-emerald-400 font-bold">1000 ₺</div>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-white/10">
                                            <Mail size={14} /> Otomatik Hatırlatma Gönder
                                        </button>
                                    </div>
                                )}

                                {activeTab === 'sertifikalar' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-white font-bold tracking-tight">Geçerli Sertifikalar</h3>
                                            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-white transition-colors">
                                                + Sertifika Ekle
                                            </button>
                                        </div>
                                        {selectedMember.certs.length > 0 ? (
                                            selectedMember.certs.map((cert: string, idx: number) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg"><Award size={20} /></div>
                                                        <div>
                                                            <div className="text-white font-bold text-sm">{cert}</div>
                                                            <div className="text-emerald-500 text-[10px] uppercase tracking-widest font-bold mt-1">Geçerli</div>
                                                        </div>
                                                    </div>
                                                    <button className="text-neutral-500 hover:text-white transition-colors"><ChevronRight size={20} /></button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                <FileText size={32} className="mx-auto text-neutral-600 mb-3" />
                                                <p className="text-neutral-500 text-sm">Üyeye ait kayıtlı sertifika bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'zimmet' && (
                                    <div className="space-y-4">
                                        {selectedMember.inventory && selectedMember.inventory.length > 0 ? (
                                            selectedMember.inventory.map((inv: any, idx: number) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><PackageOpen size={20} /></div>
                                                        <div>
                                                            <div className="text-white font-bold text-sm">{inv.item}</div>
                                                            <div className="text-neutral-500 text-[10px] mt-1">{inv.date} - {inv.status}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                <PackageOpen size={32} className="mx-auto text-neutral-600 mb-3" />
                                                <p className="text-neutral-500 text-sm">Üyeye zimmetli ekipman bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'operasyon' && (
                                    <div className="space-y-4">
                                        {selectedMember.operations && selectedMember.operations.length > 0 ? (
                                            <div className="relative border-l border-white/10 ml-4 space-y-6 pb-4">
                                                {selectedMember.operations.map((op: any, idx: number) => (
                                                    <div key={idx} className="relative pl-6">
                                                        <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[6.5px] top-1 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                                        <div className="text-[10px] text-neutral-500 font-mono mb-1">{op.date}</div>
                                                        <div className="text-white font-bold text-sm">{op.name}</div>
                                                        <div className="text-red-400 text-[10px] uppercase tracking-widest font-bold mt-1">+{op.points} Puan / {op.type}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                                                <Activity size={32} className="mx-auto text-neutral-600 mb-3" />
                                                <p className="text-neutral-500 text-sm">Operasyon/Eğitim geçmişi bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
        
        return createPortal(drawerContent, document.body);
    };

    const handleSaveMedical = async () => {
        if (!selectedMember) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: selectedMember.realId,
                    action: 'update_profile',
                    bloodType: medicalData.bloodType,
                    emergencyContact: medicalData.emergencyContact
                })
            });
            if (res.ok) {
                const newMembers = members.map(m => {
                    if (m.id === selectedMember.id) {
                        return { 
                            ...m, 
                            bloodType: medicalData.bloodType, 
                            emergencyContact: medicalData.emergencyContact,
                            emergencyContactName: medicalData.emergencyContact.split('-')[0]?.trim() || "",
                            emergencyContactPhone: medicalData.emergencyContact.split('-')[1]?.trim() || ""
                        };
                    }
                    return m;
                });
                setMembers(newMembers);
                setSelectedMember({ 
                    ...selectedMember, 
                    bloodType: medicalData.bloodType, 
                    emergencyContact: medicalData.emergencyContact,
                    emergencyContactName: medicalData.emergencyContact.split('-')[0]?.trim() || "",
                    emergencyContactPhone: medicalData.emergencyContact.split('-')[1]?.trim() || ""
                });
                setShowMedicalModal(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {renderDrawer()}

            {/* HAREKAT YÖNETİM HEADER */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tight flex items-center gap-3">
                    <ShieldCheck className="text-red-500" size={28} /> Personel & Üye Yönetimi
                </h1>
                <p className="text-neutral-500 text-sm md:text-lg font-light italic">Global 360° profil ve yetkilendirme sistemi.</p>
            </div>

            {/* ONAY BEKLEYEN BİLDİRİMLER */}
            {pendingApprovals.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 p-5 md:p-6 rounded-2xl shadow-xl">
                    <h2 className="text-sm md:text-lg font-bold text-orange-400 mb-5 uppercase tracking-widest flex items-center gap-2 border-b border-orange-500/20 pb-3">
                        <BellRing className="animate-bounce" size={18} /> Profil Güncelleme Onayları ({pendingApprovals.length})
                    </h2>
                    <div className="space-y-3">
                        {pendingApprovals.map(req => (
                            <div key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#020617] p-4 rounded-xl border border-white/5 gap-4">
                                <div>
                                    <h4 className="text-white font-bold">{req.name}</h4>
                                    <p className="text-neutral-400 text-xs">{req.request}</p>
                                    <span className="text-neutral-600 text-[10px] mt-1 block">{req.date}</span>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button onClick={() => handleApprove(req.id)} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                        <UserCheck size={14} /> Onayla
                                    </button>
                                    <button onClick={() => handleReject(req.id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                        <XCircle size={14} /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TOPLU İLETİŞİM KONSOLU */}
            <div className="bg-[#050B14] border border-white/5 p-5 md:p-6 rounded-2xl shadow-xl">
                <h2 className="text-sm md:text-lg font-bold text-white mb-5 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                    <RadioIcon className="text-red-500" size={18} /> Akıllı Aksiyon Konsolu
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleMassEmail}
                        className="bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 p-4 rounded-xl flex items-center gap-4 transition-all group"
                    >
                        <div className="bg-blue-600/10 p-3 rounded-lg text-blue-500 group-hover:scale-110 transition-transform"><Mail size={20} /></div>
                        <div className="text-left">
                            <h3 className="text-white font-bold uppercase tracking-wider text-xs md:text-sm">Filtrelenenlere E-Posta</h3>
                            <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">Resmi bildirim sistemi.</p>
                        </div>
                    </button>

                    <button
                        onClick={handleMassWhatsApp}
                        className="bg-red-600/5 hover:bg-red-600/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4 transition-all group"
                    >
                        <div className="bg-red-600 p-3 rounded-lg text-white group-hover:scale-110 shadow-[0_0_15px_rgba(234,29,44,0.3)] transition-transform">
                            <MessageCircle size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-red-400 font-bold uppercase tracking-wider text-xs md:text-sm">Acil Görev Emri (API)</h3>
                            <p className="text-[10px] text-red-500/60 truncate max-w-[150px]">Anlık telsiz ve SMS yayını.</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600/5 hover:bg-emerald-600/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-4 transition-all group"
                    >
                        <div className="bg-emerald-600 p-3 rounded-lg text-white group-hover:scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform">
                            <Download size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs md:text-sm">Personel Verisi (CSV)</h3>
                            <p className="text-[10px] text-emerald-500/60 truncate max-w-[150px]">Tüm bilgileri Excel'e aktar.</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={handleBulkCards}
                        className="bg-purple-600/5 hover:bg-purple-600/10 border border-purple-500/20 p-4 rounded-xl flex items-center gap-4 transition-all group"
                    >
                        <div className="bg-purple-600 p-3 rounded-lg text-white group-hover:scale-110 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-transform">
                            <Award size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-purple-400 font-bold uppercase tracking-wider text-xs md:text-sm">Toplu Kimlik Yazdır</h3>
                            <p className="text-[10px] text-purple-500/60 truncate max-w-[150px]">Tüm kartları baskıya gönder.</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* FİLTRELEME VE YÖNETİM TABLOSU */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">

                <div className="p-5 border-b border-white/5 bg-black/40 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                            <input
                                type="text"
                                placeholder="İsim, telefon veya e-posta ara..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-red-500 outline-none transition-colors"
                            />
                        </div>
                        <button onClick={() => setShowNewMember(true)} className="w-full md:w-auto px-6 py-2.5 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors">
                            <UserPlus size={16} /> Yeni Personel
                        </button>
                    </div>

                    {/* Akıllı Statü Filtreleri */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest mr-2">Filtre:</span>
                        {['Tümü', 'Yönetim Kurulu Üyeleri', 'Gönüllüler', 'Üyeler', 'Pasif Üyeler'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    filterRole === role 
                                    ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-neutral-400">
                        <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-5 font-bold">Personel / İletişim</th>
                                <th className="px-6 py-5 font-bold">Statü / Kayıt Tarihi</th>
                                <th className="px-6 py-5 font-bold">Özet Profil Bilgisi</th>
                                <th className="px-6 py-5 font-bold text-right">Eylem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMembers.map((member, index) => (
                                <tr key={`${member.id}-${index}`} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedMember(member)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${roleBadges[member.role]}`}>
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm group-hover:text-red-400 transition-colors">{member.name}</h4>
                                                <div className="flex flex-col text-[11px] mt-1 space-y-0.5">
                                                    <span className="text-neutral-500">{member.email}</span>
                                                    <span className="text-neutral-400 flex items-center gap-1"><Phone size={10} className="text-emerald-500" /> {member.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 inline-flex text-[9px] uppercase font-bold tracking-wider rounded-full border mb-1 ${roleColors[member.role]}`}>
                                            {member.role}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                            member.status === 'Aktif' ? 'bg-emerald-500' :
                                            member.status === 'Banlı' ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                                        }`}></span>
                                            <span className="text-[10px] text-neutral-400">{member.status} • Katılım: {member.joinDate}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {(member.profession || member.education) ? (
                                            <div className="flex flex-col gap-1 text-[11px]">
                                                <span className="text-neutral-300 flex items-center gap-1"><Briefcase size={12} className="text-neutral-500"/> {member.profession}</span>
                                                <span className="text-neutral-400 flex items-center gap-1"><GraduationCap size={12} className="text-neutral-500"/> {member.education}</span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-600 italic text-xs">Eksik Profil</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setSelectedMember(member)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2"
                                            >
                                                Profili İncele <ChevronRight size={14} />
                                            </button>
                                            {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
                                                <button 
                                                    onClick={async () => {
                                                        if (confirm(`⚠️ DİKKAT! ${member.name} isimli personeli sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
                                                             try {
                                                                 const res = await fetch(`/api/members?memberId=${member.realId}`, {
                                                                     method: 'DELETE'
                                                                 });
                                                                 if (res.ok) {
                                                                     setMembers(members.filter(m => m.id !== member.id));
                                                                     if (selectedMember && selectedMember.id === member.id) {
                                                                         setSelectedMember(null);
                                                                     }
                                                                     alert(`✅ Personel sistemden başarıyla tamamen silindi.`);
                                                                 } else {
                                                                     const err = await res.json();
                                                                     alert(`❌ Hata: ${err.error || 'Silme işlemi başarısız.'}`);
                                                                 }
                                                             } catch (err) {
                                                                 console.error(err);
                                                                 alert('❌ Sunucu bağlantı hatası.');
                                                             }
                                                        }
                                                    }}
                                                    className="p-2 bg-red-600/15 hover:bg-red-600/35 text-red-400 border border-red-500/25 rounded-lg transition-all"
                                                    title="Üyeyi Sil"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-white/5">
                    {filteredMembers.map((member, index) => (
                        <div key={`${member.id}-${index}`} className="p-5 space-y-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedMember(member)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${roleBadges[member.role]}`}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm tracking-tight">{member.name}</h4>
                                        <span className={`px-2 py-0.5 inline-block text-[9px] uppercase font-bold tracking-wider rounded-full border mt-1 ${roleColors[member.role]}`}>
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                                <span className={`w-3 h-3 rounded-full ${member.status === 'Aktif' ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg`}></span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-neutral-600 block mb-1">İletişim</span>
                                    <span className="text-[11px] text-neutral-300 flex items-center gap-1">
                                        <Phone size={10} className="text-emerald-500" /> {member.phone}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase font-bold text-neutral-600 block mb-1">Meslek</span>
                                    <span className="text-[11px] text-neutral-400">{member.profession}</span>
                                </div>
                            </div>

                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={() => setSelectedMember(member)}
                                    className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-2"
                                >
                                    360° Profil Görüntüle <ChevronRight size={12} />
                                </button>
                                {(currentUser?.isAdmin || currentUser?.isSuperAdmin) && (
                                    <button 
                                        onClick={async () => {
                                            if (confirm(`⚠️ DİKKAT! ${member.name} isimli personeli sistemden tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
                                                try {
                                                    const res = await fetch(`/api/members?memberId=${member.realId}`, {
                                                        method: 'DELETE'
                                                    });
                                                    if (res.ok) {
                                                        setMembers(members.filter(m => m.id !== member.id));
                                                        if (selectedMember && selectedMember.id === member.id) {
                                                            setSelectedMember(null);
                                                        }
                                                        alert(`✅ Personel sistemden başarıyla tamamen silindi.`);
                                                    } else {
                                                        const err = await res.json();
                                                        alert(`❌ Hata: ${err.error || 'Silme işlemi başarısız.'}`);
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('❌ Sunucu bağlantı hatası.');
                                                }
                                            }
                                        }}
                                        className="px-4 bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-all"
                                        title="Üyeyi Sil"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="p-16 text-center text-neutral-500">
                        <Search className="mx-auto w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm">Kriterlere uygun personel bulunamadı.</p>
                    </div>
                )}
            </div>

            {/* ═══ BAN MODAL ═══ */}
            {mounted && showBanModal && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBanModal(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-[#0a0f1c] border border-red-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl"><Ban size={24} className="text-red-500" /></div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Üye Banlama</h3>
                                <p className="text-neutral-500 text-xs">{selectedMember?.name}</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl mb-4">
                            <p className="text-[11px] text-red-400/80">
                                <strong>Uyarı:</strong> Banlanan üye sisteme giriş yapamaz ve toplu e-postalara dahil edilmez. Ban yönetici tarafından kaldırılana kadar aktif kalır.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs text-neutral-400 font-bold mb-2 uppercase tracking-widest">Ban Sebebi</label>
                            <textarea
                                rows={3} value={banReason} onChange={e => setBanReason(e.target.value)}
                                placeholder="Ban sebebini yazınız (isteğe bağlı)..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowBanModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-white/10">
                                İptal
                            </button>
                            <button onClick={handleBan} disabled={actionLoading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Banla
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* ═══ TIBBİ VE ACİL DURUM MODAL ═══ */}
            {mounted && showMedicalModal && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMedicalModal(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-[#0a0f1c] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl"><Droplet size={24} className="text-red-500" /></div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Tıbbi Profil Düzenle</h3>
                                <p className="text-neutral-500 text-xs">{selectedMember?.name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs text-neutral-400 font-bold mb-2 uppercase tracking-widest">Kan Grubu</label>
                                <select 
                                    value={medicalData.bloodType} onChange={e => setMedicalData({...medicalData, bloodType: e.target.value})}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 appearance-none"
                                >
                                    <option value="">Belirtilmemiş</option>
                                    <option value="A Rh(+)">A Rh(+)</option>
                                    <option value="A Rh(-)">A Rh(-)</option>
                                    <option value="B Rh(+)">B Rh(+)</option>
                                    <option value="B Rh(-)">B Rh(-)</option>
                                    <option value="0 Rh(+)">0 Rh(+)</option>
                                    <option value="0 Rh(-)">0 Rh(-)</option>
                                    <option value="AB Rh(+)">AB Rh(+)</option>
                                    <option value="AB Rh(-)">AB Rh(-)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 font-bold mb-2 uppercase tracking-widest">Acil Durumda Aranacak Kişi (Ad - Telefon)</label>
                                <input 
                                    type="text" 
                                    value={medicalData.emergencyContact} onChange={e => setMedicalData({...medicalData, emergencyContact: e.target.value})}
                                    placeholder="Örn: Ahmet Yılmaz - 0555 123 45 67"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowMedicalModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border border-white/10">
                                İptal
                            </button>
                            <button onClick={handleSaveMedical} disabled={actionLoading}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Kaydet
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* ═══ YENİ ÜYE MODAL ═══ */}
            {mounted && showNewMember && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewMember(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-[#0a0f1c] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto"
                    >
                        <button onClick={() => setShowNewMember(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-xl"><UserPlus size={24} className="text-emerald-500" /></div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Yeni Üye Tanımla</h3>
                                <p className="text-neutral-500 text-xs">Sisteme yeni üye kaydı oluştur</p>
                            </div>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl mb-6">
                            <p className="text-[11px] text-blue-400/80">
                                Üye oluşturulduğunda <strong>hoş geldin e-postası</strong> gönderilir. İlk şifre <strong>TC Kimlik Numarası</strong> olarak tanımlanır.
                            </p>
                        </div>

                        <form onSubmit={handleNewMember} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Üye ID</label>
                                    <input name="id" required placeholder="Örn: ahmetyilmaz" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">TC Kimlik No</label>
                                    <input name="tcNo" required placeholder="11 haneli" maxLength={11} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-red-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Ad Soyad</label>
                                <input name="fullName" required placeholder="AHMET YILMAZ" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm uppercase focus:outline-none focus:border-red-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">E-posta</label>
                                    <input name="email" type="email" required placeholder="user@mail.com" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Telefon</label>
                                    <input name="phone" required placeholder="05XX XXX XX XX" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Meslek</label>
                                    <input name="profession" placeholder="Mühendis, Doktor..." className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Eğitim</label>
                                    <select name="education" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 appearance-none">
                                        <option value="Lisans">Lisans</option>
                                        <option value="Ön Lisans">Ön Lisans</option>
                                        <option value="Yüksek Lisans">Yüksek Lisans</option>
                                        <option value="Doktora">Doktora</option>
                                        <option value="Lise">Lise</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Cinsiyet</label>
                                    <select name="gender" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 appearance-none">
                                        <option value="ERKEK">Erkek</option>
                                        <option value="KADIN">Kadın</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Üye Tipi / Görev</label>
                                    <select name="memberType" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 appearance-none">
                                        <option value="Gönüllü">Gönüllü</option>
                                        <option value="Üye">Asil Üye</option>
                                        <option value="Onur Üyesi">Onur Üyesi</option>
                                        <option value="Yönetim Kurulu Başkanı">Yönetim Kurulu Başkanı</option>
                                        <option value="Başkan Yardımcısı">Başkan Yardımcısı</option>
                                        <option value="Genel Sekreter">Genel Sekreter</option>
                                        <option value="Sayman">Sayman</option>
                                        <option value="Yönetim Kurulu Üyesi">Yönetim Kurulu Üyesi</option>
                                        <option value="Lojistik Sorumlusu">Lojistik Sorumlusu</option>
                                        <option value="Denetim Kurulu Üyesi">Denetim Kurulu Üyesi</option>
                                        <option value="Denetim Kurulu Başkanı">Denetim Kurulu Başkanı</option>
                                        <option value="Disiplin Kurulu Üyesi">Disiplin Kurulu Üyesi</option>
                                        <option value="Disiplin Kurulu Başkanı">Disiplin Kurulu Başkanı</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" disabled={actionLoading}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors mt-6 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                Üye Oluştur & Mail Gönder
                            </button>
                        </form>
                    </motion.div>
                </div>,
                document.body
            )}

        </div>
    );
}

const RadioIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" /></svg>
);

const AlertCircleIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
);

const InfoCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-start gap-3">
        <div className="mt-0.5 text-neutral-400">{icon}</div>
        <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-0.5">{label}</div>
            <div className="text-white text-xs font-medium">{value}</div>
        </div>
    </div>
);
