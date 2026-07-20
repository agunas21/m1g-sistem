"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Activity, ShieldCheck, Zap, AlertTriangle, AlertCircle, Info, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MissionLedgerPanel({ operationId }: { operationId: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`/api/operations/${operationId}/events?limit=50`);
            const data = await res.json();
            if (res.ok) {
                setEvents(data.events.reverse()); // Show oldest top, newest bottom
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Polling for live events every 3 seconds
        const interval = setInterval(fetchEvents, 3000);
        return () => clearInterval(interval);
    }, [operationId]);

    // Auto-scroll to bottom when new events arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events]);

    if (loading) {
        return (
            <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl h-96 flex items-center justify-center">
                <span className="text-purple-400/50 text-xs uppercase tracking-widest animate-pulse">Ledger Yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-4 shadow-2xl h-96 flex flex-col font-mono relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-purple-400" /> Mission Ledger <span className="text-[9px] text-purple-400/50">LIVE</span>
                </h3>
                <span className="text-[9px] text-neutral-500">{events.length} LOGS</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar text-[11px]">
                {events.length === 0 ? (
                    <div className="text-center text-neutral-500 mt-10">Kayıt bulunamadı.</div>
                ) : (
                    events.map((event, i) => (
                        <div key={event.id} className={`p-2 rounded border border-white/5 ${event.isCorrection ? 'bg-red-500/10 border-red-500/20' : 'bg-black/30'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-neutral-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
                                {event.isCorrection && <AlertTriangle size={12} className="text-red-400" />}
                                {event.type === 'STATUS_CHANGE' && <Zap size={12} className="text-yellow-400" />}
                                {event.type === 'PERSONNEL_ASSIGNED' && <ShieldCheck size={12} className="text-green-400" />}
                                <span className="text-white font-bold">{event.actor?.fullName || 'SYSTEM'}</span>
                                <span className="text-neutral-500">→</span>
                                <span className={`font-bold ${event.isCorrection ? 'text-red-400' : 'text-purple-400'}`}>
                                    {event.type}
                                </span>
                            </div>
                            {event.payload?.message && (
                                <div className="pl-6 text-neutral-300">"{event.payload.message}"</div>
                            )}
                            {event.payload?.reason && event.isCorrection && (
                                <div className="pl-6 text-red-300/80 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> Düzeltme Sebebi: {event.payload.reason}
                                </div>
                            )}
                            <div className="pl-6 flex gap-2 mt-1">
                                <span className="text-[9px] text-neutral-600">CONF: %{(event.confidence * 100).toFixed(0)}</span>
                                <span className="text-[9px] text-neutral-600">SRC: {event.sourceType}</span>
                                {event.isDecision && <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">KARAR [IMP:{event.decisionImpactScore}]</span>}
                                {event.lat && <span className="text-[9px] text-blue-400">LOC: {event.lat.toFixed(4)}, {event.lng?.toFixed(4)}</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.5); }
            `}</style>
        </div>
    );
}
