"use client";

import { User, Droplet, Phone, MapPin, Award, CheckCircle, Camera, Lock, KeyRound, Upload, FileText, Eye, Loader2, ShieldAlert, BadgeInfo, Briefcase, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

function parseToInputDate(dateStr: string): string {
    if (!dateStr) return "";
    if (dateStr.includes('-')) return dateStr;
    if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    return "";
}

function parseToStorageDate(dateStr: string): string {
    if (!dateStr) return "";
    if (dateStr.includes('.')) return dateStr;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            return `${day}.${month}.${year}`;
        }
    }
    return dateStr;
}

export default function ProfilPage() {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [certLoading, setCertLoading] = useState(false);
    const { user } = useAuth();

    const [profile, setProfile] = useState({
        name: "", role: "", bloodType: "", phone: "",
        address: "", profession: "", avatar: "", trainings: "", emergencyContactName: "", emergencyContactPhone: "",
        birthDate: ""
    });
    
    const [kimlikId, setKimlikId] = useState<string | null>(null);

    // Şifre değiştirme
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword]         = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Sertifika yükleme
    const [certName, setCertName]     = useState("");
    const [certFile, setCertFile]     = useState("");
    const [certificates, setCertificates] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetch('/api/members')
                .then(res => res.json())
                .then(data => {
                    const index = data.findIndex((m: any) => m.id === (user as any).uid || m.id === (user as any).username);
                    const memberRaw: any = index >= 0 ? data[index] : null;
                    
                    if (memberRaw) {
                        setKimlikId(memberRaw.kimlikToken || null);
                        
                        let emName = "";
                        let emPhone = "";
                        if (memberRaw.emergencyContact) {
                            const parts = memberRaw.emergencyContact.split('-');
                            if (parts.length > 1) {
                                emName = parts[0].trim();
                                emPhone = parts.slice(1).join('-').trim();
                            } else {
                                emName = memberRaw.emergencyContact;
                            }
                        }
                        
                        let roleText = "Gönüllü";
                        if (memberRaw.memberType && memberRaw.memberType !== "Üye" && memberRaw.memberType !== "Gönüllü") {
                            roleText = memberRaw.memberType;
                        } else if (['cgorgu', 'taksit', 'mtasli', 'mseyre', 'gakdor', 'agunas'].includes(memberRaw.id)) {
                            roleText = "Yönetim Kurulu Üyesi";
                        } else if (memberRaw.honorary === "Evet") {
                            roleText = "Onur Üyesi";
                        } else if (memberRaw.memberType === "Üye") {
                            roleText = "Asil Üye";
                        }

                        setProfile({
                            name:      memberRaw.fullName || "İsimsiz",
                            role:      roleText,
                            bloodType: memberRaw.bloodType || "Belirtilmemiş",
                            phone:     memberRaw.phone || "Belirtilmemiş",
                            address:   memberRaw.address || "Belirtilmemiş",
                            profession: memberRaw.profession || "Belirtilmemiş",
                            avatar:    memberRaw.avatar || "",
                            trainings: memberRaw.certs ? memberRaw.certs.join(", ") : "",
                            emergencyContactName: emName,
                            emergencyContactPhone: emPhone,
                            birthDate: parseToInputDate(memberRaw.birthDate || "")
                        });
                        setCertificates(memberRaw.certificates || []);
                    }
                })
                .catch(console.error);
        }
    }, [user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success && data.url) {
                    setProfile({ ...profile, avatar: data.url });
                } else {
                    alert('Fotoğraf yüklenemedi: ' + (data.error || 'Bilinmeyen hata'));
                }
            } catch (err) {
                console.error(err);
                alert('Sunucuya bağlanılamadı.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const emergencyContactStr = profile.emergencyContactName ? `${profile.emergencyContactName} - ${profile.emergencyContactPhone}` : "";
            
            await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_profile',
                    memberId: (user as any)?.uid,
                    phone: profile.phone, 
                    bloodType: profile.bloodType, 
                    address: profile.address, 
                    profession: profile.profession,
                    emergencyContact: emergencyContactStr,
                    avatar: profile.avatar,
                    birthDate: parseToStorageDate(profile.birthDate)
                })
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            alert('Hata oluştu, tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Yeni şifreler eşleşmiyor.');
            return;
        }
        if (newPassword.length < 6) {
            alert('Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: (user as any)?.uid,
                    currentPassword,
                    newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('✅ ' + data.message);
                setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
            } else {
                alert('❌ ' + data.error);
            }
        } catch {
            alert('Sunucu hatası.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCertUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!certName || !certFile) {
            alert('Sertifika adı ve dosyası gereklidir.');
            return;
        }
        setCertLoading(true);
        try {
            const res = await fetch('/api/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberId: (user as any)?.uid,
                    action: 'upload_certificate',
                    certName,
                    certFile,
                    uploadedBy: 'member'
                })
            });
            if (res.ok) {
                const data = await res.json();
                setCertificates(data.member?.certificates || []);
                setCertName(""); setCertFile("");
                alert('✅ Sertifika başarıyla yüklendi.');
            } else {
                alert('Yükleme başarısız.');
            }
        } catch {
            alert('Sunucu hatası.');
        } finally {
            setCertLoading(false);
        }
    };

    const handleCertFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCertLoading(true);
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success && data.url) {
                    setCertFile(data.url);
                } else {
                    alert('Sertifika dosyası yüklenemedi: ' + (data.error || 'Bilinmeyen hata'));
                    e.target.value = ''; // Reset input
                }
            } catch (err) {
                console.error(err);
                alert('Sunucuya bağlanılamadı.');
                e.target.value = ''; // Reset input
            } finally {
                setCertLoading(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20">
            {/* BAŞLIK */}
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-2">
                    <User className="text-red-500" size={28} /> Personel Kimliği
                </h1>
                <p className="text-neutral-400 text-sm md:text-lg font-light">
                    Kişisel bilgilerinizi güncel tutunuz. Ad-soyad değişikliği yönetim tarafından yapılır.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SOL: FOTOĞRAF */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col items-center text-center shadow-xl">
                        <div className="relative group mb-6">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 md:border-4 border-neutral-800 relative z-10 bg-[#020617]">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-5xl font-black text-white/10">{profile.name?.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer">
                                <Camera className="text-white mb-2" size={20} />
                                <span className="text-[9px] text-white font-bold uppercase tracking-widest">Değiştir</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>

                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide mb-1">{profile.name}</h2>
                        <span className="inline-block px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-bold text-[10px] md:text-xs uppercase tracking-widest mb-6">
                            {profile.role}
                        </span>

                        {/* Dijital Kimlik Görüntüleme */}
                        {kimlikId && (
                            <div className="w-full border-t border-white/10 pt-6">
                                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-3">M1G Dijital Kimliğiniz</p>
                                <a href={`/kimlik/${kimlikId}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors uppercase tracking-widest">
                                    <BadgeInfo size={18} />
                                    Kimliğimi Görüntüle
                                </a>
                                <p className="text-[10px] text-neutral-500 mt-3 leading-relaxed">
                                    Fiziki baskıya uyumlu ID kartınızı indirebilir, yetkililere gösterebilirsiniz.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SAĞ: BİLGİLER */}
                <div className="lg:col-span-2 space-y-8">

                    {/* ─── OPERASYONEL BİLGİLER ─── */}
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                            Taktiksel ve Operasyonel Bilgiler
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* AD SOYAD — KİLİTLİ */}
                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Lock size={12} className="text-amber-500" /> Ad Soyad
                                    <span className="text-[9px] text-amber-500/60 normal-case font-normal">(yalnızca yönetim değiştirebilir)</span>
                                </label>
                                <input
                                    type="text" value={profile.name} disabled
                                    className="w-full bg-[#020617] border border-white/5 rounded-lg px-4 py-3 text-neutral-500 font-medium cursor-not-allowed opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Droplet size={14} className="text-red-500" /> Kan Grubu (Kritik)
                                </label>
                                <select name="bloodType" value={profile.bloodType} onChange={handleChange}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-black focus:outline-none focus:border-red-500 appearance-none text-red-500"
                                >
                                    {["A Rh(+)", "A Rh(-)", "B Rh(+)", "B Rh(-)", "0 Rh(+)", "0 Rh(-)", "AB Rh(+)", "AB Rh(-)"].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Phone size={14} className="text-neutral-500" /> GSM (Telefon)
                                </label>
                                <input type="tel" name="phone" value={profile.phone} onChange={handleChange}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <MapPin size={14} className="text-neutral-500" /> İkametgah İli / İlçesi
                                </label>
                                <input type="text" name="address" value={profile.address} onChange={handleChange}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Briefcase size={14} className="text-neutral-500" /> Meslek
                                </label>
                                <input type="text" name="profession" value={profile.profession} onChange={handleChange}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <Calendar size={14} className="text-neutral-500" /> Doğum Tarihi
                                </label>
                                <input type="date" name="birthDate" value={profile.birthDate} onChange={handleChange}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        </div>
                        
                        {/* AKRABA İLETİŞİM BİLGİLERİ */}
                        <div className="mt-8 border-t border-white/5 pt-6">
                            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert size={16} className="text-red-500" /> Acil Durumda Aranacak Yakını
                            </h4>
                            <p className="text-xs text-neutral-400 mb-4">Bu bilgiler dijital kimlik kartınızın ön yüzünde, acil durumlarda iletişim kurulabilmesi için yer alacaktır.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                        Yakının Adı Soyadı
                                    </label>
                                    <input type="text" name="emergencyContactName" value={profile.emergencyContactName} onChange={handleChange} placeholder="Örn: Ahmet Yılmaz"
                                        className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] text-neutral-400 font-bold mb-2 uppercase tracking-wide flex items-center gap-2">
                                        Yakının Telefonu
                                    </label>
                                    <input type="tel" name="emergencyContactPhone" value={profile.emergencyContactPhone} onChange={handleChange} placeholder="Örn: 0555 123 45 67"
                                        className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <button disabled={loading || saved} onClick={handleSave} type="button" 
                                className={`w-full md:w-auto px-10 py-4 text-white tracking-widest uppercase font-black rounded-xl transition-all shadow-xl flex justify-center items-center gap-3 text-sm
                                    ${saved ? 'bg-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'bg-red-600 hover:bg-red-700 shadow-[0_0_25px_rgba(234,29,44,0.2)]'}
                                `}>
                                {loading ? <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</> 
                                         : saved ? <><CheckCircle size={18} /> Kaydedildi</>
                                                 : <><CheckCircle size={18} /> Profili Güncelle</>}
                            </button>
                        </div>
                    </div>

                    {/* ─── SERTİFİKA YÜKLEME ─── */}
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                            <Award size={18} className="text-orange-500" /> Sertifikalarım
                        </h3>

                        {/* Mevcut Sertifikalar */}
                        {certificates.length > 0 ? (
                            <div className="space-y-3 mb-6">
                                {certificates.map((cert: any) => (
                                    <div key={cert.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                                <Award size={16} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{cert.name}</p>
                                                <p className="text-[10px] text-neutral-500">{new Date(cert.uploadedAt).toLocaleDateString("tr-TR")} • {cert.uploadedBy === "member" ? "Kendi yükledi" : "Yönetim atadı"}</p>
                                            </div>
                                        </div>
                                        {cert.file && (
                                            <a href={cert.file} target="_blank" rel="noopener noreferrer"
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors" title="Görüntüle"
                                            >
                                                <Eye size={14} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-white/5 rounded-xl mb-6">
                                <FileText size={28} className="mx-auto text-neutral-700 mb-2" />
                                <p className="text-neutral-600 text-xs">Henüz yüklenmiş sertifika yok.</p>
                            </div>
                        )}

                        {/* Yeni Sertifika Yükle */}
                        <form onSubmit={handleCertUpload} className="bg-black/20 border border-white/5 p-5 rounded-xl space-y-4">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <Upload size={12} /> Yeni Sertifika Yükle
                            </h4>
                            <input
                                type="text" placeholder="Sertifika Adı (Örn: AFAD Temel Eğitim)" required
                                value={certName} onChange={(e) => setCertName(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                            />
                            <div>
                                <input type="file" accept="image/*,.pdf" onChange={handleCertFileSelect}
                                    className="w-full bg-[#020617] border border-white/5 rounded-lg px-3 py-2 text-neutral-400 focus:outline-none text-[11px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20 cursor-pointer"
                                />
                                <p className="text-[9px] text-neutral-600 mt-1">JPG, PNG veya PDF. Sertifika görseli veya taranmış belge.</p>
                            </div>
                            {certFile && (
                                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                                    <CheckCircle size={12} /> Dosya yüklendi, göndermeye hazır.
                                </div>
                            )}
                            <button type="submit" disabled={certLoading}
                                className="px-6 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {certLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                Sertifika Yükle
                            </button>
                        </form>
                    </div>

                    {/* ─── ŞİFRE DEĞİŞTİRME ─── */}
                    <div className="bg-[#050B14] border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-4">
                            <KeyRound size={18} className="text-blue-500" /> Şifre Değiştir
                        </h3>

                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-[11px] text-neutral-500 font-bold mb-1.5 uppercase tracking-widest">Mevcut Şifre</label>
                                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Mevcut şifreniz"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-neutral-500 font-bold mb-1.5 uppercase tracking-widest">Yeni Şifre</label>
                                <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="En az 6 karakter"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] text-neutral-500 font-bold mb-1.5 uppercase tracking-widest">Yeni Şifre Tekrar</label>
                                <input type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    className={`w-full bg-[#020617] border rounded-lg px-4 py-3 text-white text-sm focus:outline-none ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : 'border-white/10 focus:border-blue-500'}`}
                                    placeholder="Yeni şifrenizi tekrar girin"
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><ShieldAlert size={10} /> Şifreler eşleşmiyor.</p>
                                )}
                            </div>
                            <button type="submit" disabled={passwordLoading}
                                className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                                Şifreyi Güncelle
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
