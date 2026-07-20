"use client";

import React, { useState } from 'react';
import { Terminal, Send, Command, MapPin, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SlashCommandConsole({ operationId, onEventCreated }: { operationId: string, onEventCreated?: () => void }) {
    const [command, setCommand] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Basic Slash Command Parser
    const parseCommand = (input: string) => {
        const text = input.trim();
        if (!text.startsWith('/')) return null;

        const parts = text.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        if (cmd === '/durum' || cmd === '/status') {
            return { type: 'STATUS_CHANGE', payload: { message: args }, isDecision: false };
        } else if (cmd === '/karar' || cmd === '/decision') {
            return { type: 'STRATEGIC_DECISION', payload: { message: args }, isDecision: true, decisionImpactScore: 5 };
        } else if (cmd === '/telsiz' || cmd === '/radio') {
            return { type: 'RADIO_COMM', payload: { message: args }, sourceType: 'RADIO', confidence: 0.8 };
        } else if (cmd === '/duzeltme' || cmd === '/fix') {
            return { type: 'CORRECTION', payload: { reason: args }, isCorrection: true };
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

        const parsed = parseCommand(command);
        
        let eventData: any = {
            type: 'TEXT_NOTE',
            payload: { message: command },
            sourceType: 'SYSTEM'
        };

        if (parsed) {
            eventData = { ...eventData, ...parsed };
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/operations/${operationId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            if (res.ok) {
                toast.success('Kayıt eklendi.');
                setCommand('');
                if (onEventCreated) onEventCreated();
            } else {
                toast.error('Kayıt eklenemedi.');
            }
        } catch (error) {
            toast.error('Bağlantı hatası.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500/50 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-3 ml-2">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-purple-400" /> Komut Konsolu
                </h3>
                <div className="flex gap-2 text-[9px] text-neutral-500 font-mono">
                    <span>/durum</span>
                    <span>/karar</span>
                    <span>/telsiz</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative ml-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
                    <Command size={14} />
                </div>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={submitting}
                    placeholder="/durum Ekip bölgeye ulaştı..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-9 pr-12 text-sm text-white outline-none focus:border-purple-500 font-mono transition-colors"
                />
                <button 
                    type="submit" 
                    disabled={submitting || !command.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500/20 text-purple-400 p-1.5 rounded-lg hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-purple-500/20 disabled:hover:text-purple-400"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
}
