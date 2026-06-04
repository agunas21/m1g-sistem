"use client";

import Link from "next/link";
import { ShieldAlert, Globe, MessageCircle, AtSign, Mail, MapPin, Phone, Truck, Mountain, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    const [logo, setLogo] = useState("/m1g-logo.png");
    const [bankInfo, setBankInfo] = useState({
        bankName: "Ziraat Bankası",
        iban: "TR99 0001 0000 0000 0000 0000 00"
    });
    const [socialMedia, setSocialMedia] = useState({
        website: "https://m1g.org.tr",
        whatsapp: "https://wa.me/905447276075",
        email: "mailto:info@m1g.org.tr",
        instagram: "",
        twitter: "",
        facebook: "",
        youtube: ""
    });

    useEffect(() => {
        fetch("/api/settings/public?t=" + Date.now())
            .then(res => res.json())
            .then(data => {
                if (data.bankName || data.iban) {
                    setBankInfo({
                        bankName: data.bankName || "Ziraat Bankası",
                        iban: data.iban || "TR99 0001 0000 0000 0000 0000 00"
                    });
                }
                if (data.socialMedia) {
                    setSocialMedia(prev => ({ ...prev, ...data.socialMedia }));
                }
                if (data.siteLogo) {
                    setLogo(data.siteLogo);
                }
            })
            .catch(console.error);
    }, []);

    if (pathname?.startsWith("/admin")) return null;

    return (
        <>
            {/* DONATION SECTION */}
            <section id="bagis" className="py-12 bg-neutral-950 border-t border-white/5 relative overflow-hidden scroll-mt-24">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center"></div>
                <div className="max-w-7xl mx-auto px-4 z-10 relative">
                    <div className="text-center mb-8 flex flex-col items-center">
                        <div className="flex gap-4 text-red-500 mb-3 opacity-80">
                            <Heart size={28} className="fill-red-500" />
                        </div>
                        <h2 className="text-2xl font-black tracking-widest text-white uppercase">Bir Hayat Kurtarmak İçin Destek Olun</h2>
                        <p className="text-neutral-400 mt-2">Bağışlarınızla daha fazla insana ulaşabiliriz.</p>
                    </div>
                    <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
                        <div className="bg-black/50 border border-white/10 px-6 py-6 rounded-xl text-neutral-300 font-medium w-full text-center shadow-lg">
                            <h3 className="text-red-500 font-bold mb-2">HESAP NUMARASI (TL)</h3>
                            <p className="text-sm text-neutral-400 mb-1">Banka: {bankInfo.bankName}</p>
                            <p className="font-mono text-lg text-white tracking-widest bg-white/5 py-2 rounded">{bankInfo.iban}</p>
                            <p className="text-xs text-neutral-500 mt-2">Alıcı: M1G Arama Kurtarma Derneği</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <Link href="/" className="flex items-center gap-3 mb-6 group">
                                <img src={logo} alt="M1G Logo" className="w-[60px] h-[60px] object-contain group-hover:rotate-180 transition-transform duration-1000" />
                                <div className="flex flex-col">
                                    <span className="text-2xl md:text-3xl font-black tracking-widest text-white uppercase leading-none">
                                        M1<span className="text-red-500">G</span>
                                    </span>
                                    <span className="text-xs text-neutral-400 font-bold tracking-[0.2em] uppercase mt-1">Arama Kurtarma</span>
                                </div>
                            </Link>
                            <p className="text-neutral-400 mb-6 max-w-sm leading-relaxed">
                                M1G (Arazi ve Dağ Sınıfı Araçları), Türkiye'nin en zorlu coğrafyalarında, off-road ve dağcılık donanımıyla, 7/24 ulaşılamaz denilen yerlerde hayat kurtarır.
                            </p>
                            <div className="flex flex-wrap gap-4 mt-6">
                                {socialMedia.website && (
                                    <a href={socialMedia.website} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-blue-600 hover:text-white transition-all">
                                        <Globe size={18} />
                                    </a>
                                )}
                                {socialMedia.whatsapp && (
                                    <a href={socialMedia.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-green-500 hover:text-white transition-all">
                                        <MessageCircle size={18} />
                                    </a>
                                )}
                                {socialMedia.email && (
                                    <a href={socialMedia.email.startsWith('mailto:') ? socialMedia.email : `mailto:${socialMedia.email}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-red-600 hover:text-white transition-all">
                                        <AtSign size={18} />
                                    </a>
                                )}
                                {socialMedia.instagram && (
                                    <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-pink-600 hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                    </a>
                                )}
                                {socialMedia.twitter && (
                                    <a href={socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-blue-400 hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                                    </a>
                                )}
                                {socialMedia.youtube && (
                                    <a href={socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:bg-red-500 hover:text-white transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-6">Hızlı Bağlantılar</h3>
                            <ul className="space-y-4">
                                <li><Link href="/hakkimizda" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> Hakkımızda</Link></li>
                                <li><Link href="/operasyonlar" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> Operasyonlar</Link></li>
                                <li><Link href="/etkinlikler" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> Etkinlikler</Link></li>
                                <li><Link href="/vizyon" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> Vizyon & Misyon</Link></li>
                                <li><Link href="/gonullu-ol" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> Gönüllü Ol</Link></li>
                                <li><Link href="/iletisim" className="text-neutral-400 hover:text-red-500 transition-colors flex items-center gap-2"><ArrowRight size={14} /> İletişim</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-6">İletişim</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-neutral-400">
                                    <MapPin className="text-red-500 shrink-0 mt-1" size={18} />
                                    <span className="text-sm">Sancar Maruflu Sivil Toplum Yerleşkesi, Bahçelievler Mah. 1851/10 Sok. No:3 Posta Kutusu 15 Karşıyaka/İzmir</span>
                                </li>
                                {socialMedia.whatsapp && (
                                    <li className="flex items-center gap-3 text-neutral-400">
                                        <Phone className="text-red-500 shrink-0" size={18} />
                                        <span className="text-sm">{socialMedia.whatsapp.replace('https://wa.me/', '+')}</span>
                                    </li>
                                )}
                                {socialMedia.email && (
                                    <li className="flex items-center gap-3 text-neutral-400">
                                        <Mail className="text-red-500 shrink-0" size={18} />
                                        <span className="text-sm">{socialMedia.email.replace('mailto:', '')}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-neutral-500 text-sm">
                            &copy; {new Date().getFullYear()} M1G Arama Kurtarma. Tüm hakları saklıdır.
                        </p>
                        <div className="flex gap-6 text-sm text-neutral-500">
                            <Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik</Link>
                            <Link href="/cerezler" className="hover:text-white transition-colors">Çerezler</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}

const ArrowRight = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
