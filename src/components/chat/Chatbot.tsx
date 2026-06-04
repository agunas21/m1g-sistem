"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, X, Send, Bot, ChevronRight, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const FAQ_DATA = [
    {
        category: "Genel",
        items: [
            { q: "M1G nedir?", a: "M1G Arama & Kurtarma, 2023 senesinde kurulmuş, tamamı gönüllülerden oluşan bir arama kurtarma, ekoloji ve insani yardım derneğidir." },
            { q: "M1G nerelerde faaliyet gösteriyor?", a: "Ulusal ve uluslararası alanda yaşamı tehdit eden felaketlerde, afet sonrasında enkaz altında kalmış insanlara ulaşmak için operasyonlar gerçekleştiriyoruz." },
            { q: "M1G'nin merkezi nerede?", a: "Sancar Maruflu Sivil Toplum Yerleşkesi, Bahçelievler Mah. 1851/10 Sok. No:3 Posta Kutusu 15 Karşıyaka/İzmir" },
        ]
    },
    {
        category: "Gönüllülük",
        items: [
            { q: "Nasıl gönüllü olabilirim?", a: "Web sitemizden 'Gönüllü Ol' sayfasına giderek başvuru formunu doldurabilirsiniz. Başvurunuz İnsan Kaynakları tarafından değerlendirilecektir." },
            { q: "Gönüllülük için ön koşullar var mı?", a: "AFAD online temel eğitim sertifikası öncelikli değerlendirme sebebidir ancak zorunlu değildir. Motivasyon ve gönüllülük ruhu yeterlidir." },
            { q: "Eğitimler ne zaman yapılıyor?", a: "Eğitim takvimimiz düzenli olarak güncellenmektedir. Portal üzerinden etkinlik takvimini takip edebilirsiniz." },
        ]
    },
    {
        category: "Bağış & Destek",
        items: [
            { q: "Nasıl bağış yapabilirim?", a: "Sayfamızın alt kısmındaki IBAN bilgileriyle bağış yapabilirsiniz. Ziraat Bankası: TR99 0001 0000 0000 0000 0000 00 - Alıcı: M1G Arama Kurtarma Derneği" },
            { q: "Kurumsal sponsor olabilir miyim?", a: "Evet! info@m1g.org.tr adresine mail atarak veya +90 544 727 60 75 numarasından bize ulaşabilirsiniz." },
        ]
    },
    {
        category: "Üyelik",
        items: [
            { q: "Üye portalına nasıl giriş yaparım?", a: "TC Kimlik No, e-posta veya telefon numaranızla giriş yapabilirsiniz. İlk şifreniz TC Kimlik Numaranızdır." },
            { q: "Şifremi unuttum ne yapmalıyım?", a: "Giriş ekranındaki 'Şifremi Unuttum' butonuna tıklayarak kayıtlı e-posta adresinize şifre sıfırlama linki alabilirsiniz." },
            { q: "Sertifikalarımı nereden görebilirim?", a: "Üye portalına giriş yaptıktan sonra 'Sertifikalarım' bölümünden tüm sertifikalarınızı görüntüleyebilir ve indirebilirsiniz." },
        ]
    },
    {
        category: "Acil Durum",
        items: [
            { q: "Acil durumda ne yapmalıyım?", a: "⚠️ Acil durumlarda hemen 112'yi arayın! M1G operasyon merkezi 7/24 aktiftir. Konum ve kişi bilgilerinizi hazır bulundurun." },
            { q: "İhbar hattınız var mı?", a: "Evet, +90 544 727 60 75 numarasından 7/24 bize ulaşabilirsiniz. Sayfamızdaki kırmızı acil ihbar butonunu da kullanabilirsiniz." },
        ]
    },
];

type Message = {
    id: string;
    sender: "bot" | "user";
    text: string;
    isMenu?: boolean;
    options?: { label: string; action: string; category?: string; idx?: number }[];
};

export default function Chatbot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [bankInfo, setBankInfo] = useState({
        bankName: "Ziraat Bankası",
        iban: "TR99 0001 0000 0000 0000 0000 00"
    });

    useEffect(() => {
        fetch("/api/settings/public")
            .then(res => res.json())
            .then(data => {
                if (data.bankName || data.iban) {
                    setBankInfo({
                        bankName: data.bankName || "Ziraat Bankası",
                        iban: data.iban || "TR99 0001 0000 0000 0000 0000 00"
                    });
                }
            })
            .catch(console.error);
    }, []);


    const dynamicFaq = FAQ_DATA.map(cat => {
        if (cat.category === "Bağış & Destek") {
            return {
                ...cat,
                items: cat.items.map(item => {
                    if (item.q.includes("bağış")) {
                        return { ...item, a: `Sayfamızın alt kısmındaki IBAN bilgileriyle bağış yapabilirsiniz. ${bankInfo.bankName}: ${bankInfo.iban} - Alıcı: M1G Arama Kurtarma Derneği` };
                    }
                    return item;
                })
            };
        }
        return cat;
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            showMainMenu();
        }
    }, [isOpen]);

    if (pathname?.startsWith("/admin")) return null;

    const addBotMsg = (text: string, options?: Message["options"]) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            sender: "bot",
            text,
            isMenu: !!options,
            options,
        }]);
    };

    const addUserMsg = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            sender: "user",
            text,
        }]);
    };

    const showMainMenu = () => {
        addBotMsg(
            "Merhaba! Ben M1G Asistanı 🤖\nSize nasıl yardımcı olabilirim? Aşağıdan bir konu seçin:",
            FAQ_DATA.map(cat => ({ label: cat.category, action: "category", category: cat.category }))
        );
    };

    const showCategory = (categoryName: string) => {
        const cat = dynamicFaq.find(c => c.category === categoryName);
        if (!cat) return;
        addBotMsg(
            `📂 **${categoryName}** — Bir soru seçin:`,
            [
                ...cat.items.map((item, idx) => ({ label: item.q, action: "answer", category: categoryName, idx })),
                { label: "← Ana Menüye Dön", action: "main" }
            ]
        );
    };

    const showAnswer = (categoryName: string, idx: number) => {
        const cat = dynamicFaq.find(c => c.category === categoryName);
        if (!cat || !cat.items[idx]) return;
        addBotMsg(cat.items[idx].a);
        setTimeout(() => {
            addBotMsg("Başka bir sorunuz var mı?", [
                { label: "Aynı kategoride devam et", action: "category", category: categoryName },
                { label: "Ana Menüye Dön", action: "main" },
            ]);
        }, 500);
    };

    const handleOptionClick = (opt: NonNullable<Message["options"]>[number]) => {
        addUserMsg(opt.label);
        setTimeout(() => {
            if (opt.action === "main") showMainMenu();
            else if (opt.action === "category" && opt.category) showCategory(opt.category);
            else if (opt.action === "answer" && opt.category && opt.idx !== undefined) showAnswer(opt.category, opt.idx);
        }, 300);
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        const userText = input.trim();
        addUserMsg(userText);
        setInput("");

        // Simple keyword search in FAQ
        const lowerText = userText.toLowerCase();
        const results: { q: string; a: string; cat: string }[] = [];
        dynamicFaq.forEach(cat => {
            cat.items.forEach(item => {
                if (item.q.toLowerCase().includes(lowerText) || item.a.toLowerCase().includes(lowerText) ||
                    lowerText.split(" ").some(w => w.length > 2 && (item.q.toLowerCase().includes(w) || item.a.toLowerCase().includes(w)))) {
                    results.push({ ...item, cat: cat.category });
                }
            });
        });

        setTimeout(() => {
            if (results.length > 0) {
                addBotMsg(results[0].a);
                if (results.length > 1) {
                    addBotMsg("İlgili başka sorular da bulundu:", results.slice(0, 3).map((r, i) => ({
                        label: r.q, action: "answer", category: r.cat, idx: dynamicFaq.find(c => c.category === r.cat)?.items.findIndex(item => item.q === r.q)
                    })));
                }
            } else {
                addBotMsg("Bu konuda SSS'de bilgi bulamadım. Yönetim ekibimize iletmek ister misiniz? 📧 info@m1g.org.tr | 📞 +90 544 727 60 75");
                setTimeout(() => {
                    addBotMsg("Başka bir konuda yardımcı olabilir miyim?", [
                        { label: "Ana Menüye Dön", action: "main" },
                    ]);
                }, 500);
            }
        }, 600);
    };

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 3, type: "spring" }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-2xl transition-all ${isOpen ? "hidden" : "bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10"
                    }`}
            >
                <MessageSquareText size={28} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 left-6 md:left-6 z-50 w-80 sm:w-[370px] h-[520px] max-h-[80vh] bg-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-neutral-950 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center text-red-500">
                                    <Bot size={18} />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-bold tracking-wide">M1G SSS Asistan</h3>
                                    <p className="text-neutral-500 text-[10px] flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sık Sorulan Sorular
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className="max-w-[90%]">
                                        <div
                                            className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${msg.sender === "user"
                                                    ? "bg-red-600 text-white rounded-tr-sm"
                                                    : "bg-neutral-800 text-neutral-200 rounded-tl-sm border border-white/5"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        {/* Quick-reply options */}
                                        {msg.isMenu && msg.options && (
                                            <div className="mt-2 flex flex-col gap-1.5">
                                                {msg.options.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleOptionClick(opt)}
                                                        className="text-left text-[12px] px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-red-600/20 hover:border-red-500/30 hover:text-white transition-all flex items-center gap-2"
                                                    >
                                                        <ChevronRight size={12} className="text-red-500 shrink-0" />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="bg-neutral-950 p-3 border-t border-white/5 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Soru yazın veya anahtar kelime girin..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:hover:bg-red-600"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
