import React from 'react';
import { Wifi, WifiOff, AlertTriangle, LogOut } from 'lucide-react';

export type ConnectionStatus = "connected" | "offline_queued" | "session_expired";

interface ConnectionBadgeProps {
    status: ConnectionStatus;
    queuedCount?: number;
    className?: string;
}

export function ConnectionBadge({ status, queuedCount = 0, className = "" }: ConnectionBadgeProps) {
    const configs = {
        connected: {
            bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
            dot: "bg-emerald-500",
            icon: Wifi,
            label: "Bağlantı Aktif"
        },
        offline_queued: {
            bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
            dot: "bg-amber-500 animate-pulse",
            icon: WifiOff,
            label: queuedCount > 0 
                ? `Bağlantı yok — ${queuedCount} veri bekliyor, otomatik gönderilecek`
                : "Bağlantı yok — veriler bekliyor, otomatik gönderilecek"
        },
        session_expired: {
            bg: "bg-red-500/10 border-red-500/30 text-red-400",
            dot: "bg-red-500",
            icon: LogOut,
            label: "Oturum süresi doldu — tekrar giriş yapın"
        }
    };

    const config = configs[status] || configs.connected;
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold font-mono ${config.bg} ${className}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            <Icon size={14} />
            <span>{config.label}</span>
        </div>
    );
}
