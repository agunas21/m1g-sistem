"use client";

import { useEffect, useState } from "react";
import { Radio, AlertTriangle, RefreshCw } from "lucide-react";

export default function SeismicTracker() {
    const [earthquakes, setEarthquakes] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchLive = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/afad");

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setEarthquakes(data.slice(0, 10));
                    setError(false);
                    setLastUpdated(new Date());
                } else {
                    setError(true);
                }
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("AFAD Live Seismic Fetch Error", err);
            setError(true);
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => {
        // Sadece sayfa ilk açıldığında bir kez AFAD'ı çeker
        fetchLive();

        // 1 dakikada (60000ms) bir otomatik yenile
        const interval = setInterval(fetchLive, 60000);
        return () => clearInterval(interval);
    }, []);

    // Format date string (AFAD UTC to GMT+3 TR Time)
    const formatTime = (dateStr: string) => {
        if (!dateStr) return "N/A";
        try {
            const dateObj = new Date((dateStr.includes('Z') ? dateStr : dateStr + "Z"));
            const trTime = new Date(dateObj.getTime() + (3 * 60 * 60 * 1000));

            const yyyy = trTime.getUTCFullYear();
            const mm = String(trTime.getUTCMonth() + 1).padStart(2, '0');
            const dd = String(trTime.getUTCDate()).padStart(2, '0');
            const hh = String(trTime.getUTCHours()).padStart(2, '0');
            const min = String(trTime.getUTCMinutes()).padStart(2, '0');
            const ss = String(trTime.getUTCSeconds()).padStart(2, '0');

            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="bg-[#050B14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">

            {/* OTONOM TAKİP HEADER */}
            <div className="bg-[#0e1628] px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-t border-blue-500/30 gap-4 sm:gap-0">
                <div className="flex items-center gap-3">
                    <span className="font-black text-white bg-blue-600 px-2 py-0.5 rounded text-xs tracking-widest hidden sm:inline-block">AFAD</span>
                    <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-blue-500'} animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                    <span className={`text-[12px] uppercase tracking-widest font-black ${error ? 'text-red-500' : 'text-blue-400'}`}>
                        AFAD ANA MERKEZ {error ? 'BAĞLANTISI KOPTU' : 'SENKRONİZE'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                        <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
                        {isRefreshing ? <span className="text-blue-500">Haberleşiliyor...</span> : (lastUpdated ? `Son: ${lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Bekleniyor...')}
                    </div>
                    <button 
                        onClick={fetchLive}
                        disabled={isRefreshing}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Yenile
                    </button>
                </div>
            </div>

            {/* TABLO */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-[#020617] text-neutral-500 uppercase tracking-widest text-[11px] border-b border-white/10">
                        <tr>
                            <th className="px-6 py-5 font-bold">Zaman (Local)</th>
                            <th className="px-6 py-5 font-bold">Lokasyon</th>
                            <th className="px-6 py-5 font-bold text-center">Derinlik</th>
                            <th className="px-6 py-5 font-bold text-center">Şiddet (Mw)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs sm:text-sm tracking-wider">
                        {earthquakes.length > 0 ? earthquakes.map((eq: any, idx: number) => {
                            const mag = Number(eq.magnitude);
                            const isRedCode = mag >= 4.0;
                            const isOrangeCode = mag >= 3.0;

                            return (
                                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-neutral-400 font-bold">{formatTime(eq.date)}</td>
                                    <td className="px-6 py-4 font-black text-white uppercase tracking-wide">{eq.location}</td>
                                    <td className="px-6 py-4 text-center">{eq.depth} km</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1.5 rounded font-black text-[11px] uppercase tracking-widest border flex items-center justify-center w-max mx-auto gap-1 ${isRedCode ? 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : isOrangeCode ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {isRedCode && <AlertTriangle size={12} />} {mag.toFixed(1)} Mw
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center flex flex-col items-center justify-center">
                                    {error ? (
                                        <span className="inline-flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-4 py-2 border border-red-500/20 rounded">
                                            <AlertTriangle size={16} /> Canlı Veri Sunucularından Çekilemiyor
                                        </span>
                                    ) : (
                                        <span className="text-blue-500 animate-pulse font-bold tracking-widest uppercase text-xs">AFAD'dan canli veri aktariliyor...</span>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
