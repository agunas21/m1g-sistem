"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
    Activity, Users, Box, Play, Square, ScanBarcode, X, Check, CheckCircle,
    Clock, MapPin, Search, ArrowRightLeft, RefreshCw, Printer, ShieldCheck, Flame, 
    Compass, Battery, Package, AlertTriangle, Plus, Trash, Radio, Heart, ShieldAlert,
    MessageSquare, UserCheck, Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { offlineDB } from "@/lib/offline-db";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import OperationSummaryModal from "@/components/modals/OperationSummaryModal";
import TeamListPanel from "@/components/admin/operasyonlar/TeamListPanel";

const OperasyonHaritasi = dynamic(() => import("@/components/admin/OperasyonHaritasi"), { ssr: false });
const QRScannerModal = dynamic(() => import("@/components/admin/operasyonlar/QRScannerModal"), { ssr: false });

// Types
interface TeamMember {
    id: string;
    role: "Lider" | "Üye";
}

interface TeamDeployment {
    deployTime: string;
    returnTime: string | null;
    pulse: "Yeşil" | "Sarı" | "Kırmızı" | null;
    targetLocation?: string;
}

interface Team {
    id: string;
    name: string;
    status: "Sahada" | "Kampta";
    members: TeamMember[];
    equipment: string[];
    deployments: TeamDeployment[];
}

interface ActiveOperation {
    id: string;
    name: string;
    type: "Deprem" | "Yangın" | "Doğada Arama" | "Eğitim" | "Kamp";
    status: "Aktif" | "Tamamlandı";
    startTime: string;
    endTime: string | null;
    location: string;
    temperature: string;
    radioFrequency: string;
    teams: Team[];
    baseCamp: {
        members: string[]; 
        equipment: string[]; 
    };
    supplies: {
        ppeCount: number;
        mealsCount: number;
        firstAidKits: number;
    };
    logs: Array<{ time: string; message: string }>;
    isEvacuationActive: boolean;
    postMortemReport: {
        completed: boolean;
        notes: string;
        memberNotes: Record<string, string>;
        suppliesUsed?: {
            ppeCount: number;
            mealsCount: number;
            firstAidKits: number;
        };
    };
    pins?: Array<{
        id: string;
        name: string;
        type: "Kamp" | "Toplanma" | "Tehlike" | "Genel";
        location: [number, number];
    }>;
}

const formatDuration = (startTimeStr: string, endTimeStr: string | null = null) => {
    if (!startTimeStr) return "00:00:00";
    
    let normalizedStart = startTimeStr.replace(' ', 'T');
    if (!normalizedStart.endsWith('Z')) normalizedStart += 'Z';
    let parsedTime = Date.parse(normalizedStart);
    
    if (isNaN(parsedTime)) return "00:00:00";

    let end = Date.now();
    if (endTimeStr) {
        let normalizedEnd = endTimeStr.replace(' ', 'T');
        if (!normalizedEnd.endsWith('Z')) normalizedEnd += 'Z';
        end = Date.parse(normalizedEnd);
    }
    
    const diffMs = Math.max(0, end - parsedTime);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export default function Operasyonlar() {
    const { isAdmin } = useAuth();
    const [operations, setOperations] = useState<ActiveOperation[]>([]);
    const [selectedOp, setSelectedOp] = useState<ActiveOperation | null>(null);
    const [membersData, setMembersData] = useState<any[]>([]);
    const [inventoryData, setInventoryData] = useState<any[]>([]);
    
    // UI states
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showNewOp, setShowNewOp] = useState(false);
    const isOnline = useNetworkStatus();
    const [isOffline, setIsOffline] = useState(false);
    const [offlineQueueCount, setOfflineQueueCount] = useState(0);
    const [tick, setTick] = useState(0);
    const [radarWarnings, setRadarWarnings] = useState<string[]>([]);
    const [showQrModal, setShowQrModal] = useState(false);

    // Form states for new operation
    const [newOpData, setNewOpData] = useState({
        name: "",
        type: "Deprem" as "Deprem" | "Yangın" | "Doğada Arama" | "Eğitim" | "Kamp",
        location: "",
        radioFrequency: "145.550",
        personnelCount: 10
    });

    // Unified command bar input
    const [commandInput, setCommandInput] = useState("");
    const [commandResults, setCommandResults] = useState<{ members: any[]; items: any[] }>({ members: [], items: [] });

    // Modals & Popups
    const [debriefTeamId, setDebriefTeamId] = useState<string | null>(null);
    const [newTeamName, setNewTeamName] = useState("");
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);

    // Target Location deployment states
    const [deployTeamIdForTarget, setDeployTeamIdForTarget] = useState<string | null>(null);
    const [deployTargetLocation, setDeployTargetLocation] = useState("");

    // Modal state for PDF Report
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [finishedOperation, setFinishedOperation] = useState<ActiveOperation | null>(null);

    // Debriefing Closure screen states
    const [showClosureModal, setShowClosureModal] = useState(false);
    const [closureTab, setClosureTab] = useState<"teams" | "logistics" | "medical">("teams");
    const [closureFtrNotes, setClosureFtrNotes] = useState("");
    const [closureMemberNotes, setClosureMemberNotes] = useState<Record<string, string>>({});
    const [closureDamagedItems, setClosureDamagedItems] = useState<Record<string, "Depoda" | "Kayıp" | "Hasarlı">>({});
    // Hasar fotoğrafları: key=eqId, value={file, previewUrl, uploadedUrl}
    const [closureDamagePhotos, setClosureDamagePhotos] = useState<Record<string, { file?: File; previewUrl?: string; uploadedUrl?: string; uploading?: boolean }>>({});

    // Map Pinning State
    const [newPinPos, setNewPinPos] = useState<[number, number] | null>(null);
    const [newPinName, setNewPinName] = useState("");
    const [newPinType, setNewPinType] = useState<"Kamp" | "Toplanma" | "Tehlike" | "Genel">("Kamp");

    // Manual Log text
    const [manualLogText, setManualLogText] = useState("");

    // Weather loading state
    const [weatherLoading, setWeatherLoading] = useState(false);

    // Siren audio refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    // Initialize audio context and run alarm sirens
    const startSirenNode = () => {
        if (typeof window === "undefined") return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContextClass();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                ctx.resume();
            }
            
            if (oscillatorRef.current) return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            
            let high = true;
            const interval = setInterval(() => {
                if (!oscillatorRef.current) {
                    clearInterval(interval);
                    return;
                }
                const now = ctx.currentTime;
                osc.frequency.cancelScheduledValues(now);
                osc.frequency.setValueAtTime(high ? 900 : 500, now);
                osc.frequency.linearRampToValueAtTime(high ? 500 : 900, now + 0.4);
                high = !high;
            }, 450);
            
            oscillatorRef.current = osc;
            gainRef.current = gain;
        } catch (e) {
            console.error("Audio synthesis error", e);
        }
    };

    const stopSirenNode = () => {
        try {
            if (oscillatorRef.current) {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
                oscillatorRef.current = null;
            }
            if (gainRef.current) {
                gainRef.current.disconnect();
                gainRef.current = null;
            }
        } catch (e) {
            console.error("Audio stop error", e);
        }
    };

    // Watch for alarm state shifts
    useEffect(() => {
        if (selectedOp?.isEvacuationActive) {
            startSirenNode();
        } else {
            stopSirenNode();
        }
        return () => {
            stopSirenNode();
        };
    }, [selectedOp?.isEvacuationActive]);

    // Setup network and ticker
    useEffect(() => {
        setMounted(true);
        setIsOffline(!isOnline);
        
        // Sadece isOnline true olduğunda ve offline queue'da eleman varsa sync yap
        if (isOnline) {
            syncOfflineQueue();
        }

        // --- Supabase Realtime (WebSockets) ---
        const channel = supabase.channel('operations-channel');
        channel.on('broadcast', { event: 'location_update' }, (payload) => {
            const { memberId, lat, lng, battery } = payload.payload;
            
            setSelectedOp((prev: any) => {
                if (!prev) return prev;
                let updated = false;
                const newTeams = prev.teams?.map((t: any) => {
                    const mIndex = t.members?.findIndex((m: any) => m.id === memberId);
                    if (mIndex >= 0) {
                        updated = true;
                        const members = [...t.members];
                        
                        // Hız Anomalisi ve Geofence Kontrolü
                        const oldLoc = members[mIndex].lastLocation;
                        if (oldLoc) {
                            const R = 6371;
                            const dLat = (lat - oldLoc.lat) * (Math.PI/180);
                            const dLon = (lng - oldLoc.lng) * (Math.PI/180);
                            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                      Math.cos(oldLoc.lat * (Math.PI/180)) * Math.cos(lat * (Math.PI/180)) * 
                                      Math.sin(dLon/2) * Math.sin(dLon/2); 
                            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                            
                            const timeDiffHours = (Date.now() - oldLoc.timestamp) / (1000 * 60 * 60);
                            if (timeDiffHours > 0) {
                                const speed = dist / timeDiffHours;
                                if (speed > 150) {
                                    setRadarWarnings(w => {
                                        const msg = `🚨 [GPS Anomalisi] ${memberId} ${Math.round(speed)}km/h hızla yer değiştirdi (Işınlanma)!`;
                                        if (w.includes(msg)) return w;
                                        return [...w, msg].slice(-5);
                                    });
                                }
                            }
                        }

                        members[mIndex] = {
                            ...members[mIndex],
                            lastLocation: { lat, lng, timestamp: Date.now(), battery },
                            path: [...(members[mIndex].path || []), { lat, lng, timestamp: Date.now() }]
                        };
                        return { ...t, members };
                    }
                    return t;
                });
                return updated ? { ...prev, teams: newTeams } : prev;
            });
        }).subscribe();

        const checkQueue = async () => {
            const queue = await offlineDB.getPendingLogs();
            setOfflineQueueCount(queue.length);
        };
        checkQueue();
        
        const timer = setInterval(() => {
            setTick(t => t + 1);
            checkQueue();
        }, 3000);

        fetchData();

        // Haritada canlı takip için operasyonları arka planda 5 saniyede bir güncelle
        const liveInterval = setInterval(async () => {
            if (!isOnline) return;
            try {
                const opRes = await fetch("/api/settings/operations/active?t=" + Date.now());
                if (opRes.ok) {
                    const opData = await opRes.json();
                    setOperations(opData.operations || []);
                    
                    setSelectedOp((prev: any) => {
                        if (!prev) return prev;
                        const updated = (opData.operations || []).find((o: any) => o.id === prev.id);
                        return updated || prev;
                    });
                }
            } catch (e) {
                // Silently ignore errors
            }
        }, 5000);

        return () => {
            clearInterval(timer);
            if (liveInterval) clearInterval(liveInterval);
            supabase.removeChannel(channel);
        };
    }, [isOnline]);

    // Filter command results for adding member/equipment
    useEffect(() => {
        if (!commandInput.trim()) {
            setCommandResults({ members: [], items: [] });
            return;
        }
        const query = commandInput.toLowerCase();
        
        // Members not already inside baseCamp or inside teams
        const matchedMembers = membersData.filter(m => {
            if (m.status === 'Banlı' || m.status === 'Pasif') return false;
            const inOp = selectedOp?.baseCamp?.members?.includes(m.id) || 
                         selectedOp?.teams?.some(t => t.members.some(mem => mem.id === m.id));
            return !inOp && (m.fullName.toLowerCase().includes(query) || m.id.toLowerCase().includes(query));
        });

        // Items not already inside baseCamp or assigned to teams
        const matchedItems = inventoryData.filter(i => {
            const inOp = selectedOp?.baseCamp?.equipment?.includes(i.id) || 
                         selectedOp?.teams?.some(t => t.equipment.includes(i.id));
            return !inOp && (i.name.toLowerCase().includes(query) || i.id.toLowerCase().includes(query));
        });

        setCommandResults({ members: matchedMembers, items: matchedItems });
    }, [commandInput, membersData, inventoryData, selectedOp]);

    // Fetch master database records with safe schema sanitization fallbacks
    const fetchData = async () => {
        try {
            const [opsRes, memRes, invRes] = await Promise.all([
                fetch("/api/settings/operations/active?t=" + Date.now()),
                fetch("/api/members?t=" + Date.now()),
                fetch("/api/inventory?t=" + Date.now())
            ]);
            const ops = await opsRes.json();
            const mem = await memRes.json();
            const inv = await invRes.json();
            
            const operationsList = (Array.isArray(ops) ? ops : []).map((op: any) => ({
                ...op,
                teams: (op.teams || []).map((t: any) => ({
                    ...t,
                    members: t.members || [],
                    equipment: t.equipment || [],
                    deployments: t.deployments || []
                })),
                baseCamp: {
                    members: op.baseCamp?.members || [],
                    equipment: op.baseCamp?.equipment || []
                },
                supplies: op.supplies || { 
                    ppeCount: 0, 
                    mealsCount: 0, 
                    firstAidKits: 0
                },
                postMortemReport: op.postMortemReport || { completed: false, notes: '', memberNotes: {} },
                logs: op.logs || [],
                radioFrequency: op.radioFrequency || '',
                temperature: op.temperature || ''
            }));

            setOperations(operationsList);
            setMembersData(Array.isArray(mem) ? mem : []);
            setInventoryData(Array.isArray(inv) ? inv : []);

            if (selectedOp) {
                const refreshed = operationsList.find(o => o.id === selectedOp.id);
                if (refreshed) {
                    setSelectedOp(refreshed);
                }
            } else if (operationsList.length > 0) {
                setSelectedOp(operationsList[0]);
            }
        } catch (e) {
            console.error("Data loading error", e);
        }
    };

    const saveOperation = async (updatedOp: ActiveOperation) => {
        if (!isOnline || isOffline) {
            // Çevrimdışıysak localforage'e at
            const queue = await offlineDB.getPendingLogs();
            
            // Eğer bu operasyon için zaten pending bir kayıt varsa onu güncelle
            // PendingLog formatına uyduruyoruz:
            const pendingData = {
                operationId: updatedOp.id,
                type: 'UPDATE_OPERATION',
                category: 'OPERATION',
                message: JSON.stringify(updatedOp)
            };
            
            await offlineDB.addPendingLog(pendingData);
            
            setOperations(operations.map(o => o.id === updatedOp.id ? updatedOp : o));
            setSelectedOp(updatedOp);
            
            const newQueue = await offlineDB.getPendingLogs();
            setOfflineQueueCount(newQueue.length);
            return;
        }

        try {
            const res = await fetch("/api/settings/operations/active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedOp)
            });
            if (res.ok) {
                setOperations(operations.map(o => o.id === updatedOp.id ? updatedOp : o));
                setSelectedOp(updatedOp);
            }
        } catch (e) {
            console.error("Active operation save failed", e);
        }
    };

    const syncOfflineQueue = async () => {
        const queue = await offlineDB.getPendingLogs();
        if (queue.length === 0) return;

        // Queue'daki en güncel operasyon verilerini al (aynı operasyon için son güncellemeyi baz alıyoruz)
        // message içinde stringify edilmiş ActiveOperation var
        for (const pending of queue) {
            if (pending.type === 'UPDATE_OPERATION') {
                try {
                    const op = JSON.parse(pending.message);
                    await fetch("/api/settings/operations/active", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(op)
                    });
                    await offlineDB.removePendingLog(pending.id);
                } catch (e) {
                    console.error("Failed to sync offline op", pending.operationId, e);
                }
            }
        }
        
        const finalQueue = await offlineDB.getPendingLogs();
        if (finalQueue.length === 0) {
             setOfflineQueueCount(0);
        }
        fetchData();
    };

    // Trigger weather lookup automatically
    const fetchWeather = async (locName: string) => {
        if (!locName.trim()) return;
        setWeatherLoading(true);
        try {
            const res = await fetch(`/api/weather?location=${encodeURIComponent(locName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.temperature && selectedOp) {
                    const updated = {
                        ...selectedOp,
                        location: locName,
                        temperature: data.temperature,
                        logs: [
                            ...selectedOp.logs,
                            { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Hava durumu güncellendi: ${locName} (${data.temperature})` }
                        ]
                    };
                    await saveOperation(updated);
                }
            }
        } catch (e) {
            console.error("Weather service lookup failed", e);
        } finally {
            setWeatherLoading(false);
        }
    };

    // Emergency Evacuation Siren
    const triggerEvacuationAlert = async () => {
        if (!selectedOp) return;
        const currentTimestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const wasActive = !!selectedOp.isEvacuationActive;
        const nextState = !wasActive;

        let logMsg = "";
        let updatedTeams = [...selectedOp.teams];

        if (nextState) {
            logMsg = `🚨 ACİL ALARM: Sektör tahliye sireni devreye girdi! Timler kampa geri çekiliyor.`;
            updatedTeams = selectedOp.teams.map(t => {
                if (t.status === "Sahada") {
                    const lastDep = t.deployments[t.deployments.length - 1];
                    if (lastDep && !lastDep.returnTime) {
                        const updatedDeps = [...t.deployments];
                        updatedDeps[updatedDeps.length - 1] = {
                            ...lastDep,
                            returnTime: currentTimestampStr,
                            pulse: "Kırmızı"
                        };
                        return { ...t, status: "Kampta" as const, deployments: updatedDeps };
                    }
                }
                return t;
            });
        } else {
            logMsg = `✅ ALARM SONLANDIRILDI: Tehlike geçti. Arama operasyonu normale döndü.`;
        }

        const updated = {
            ...selectedOp,
            isEvacuationActive: nextState,
            teams: updatedTeams,
            logs: [
                ...selectedOp.logs,
                { time: currentTimestampStr, message: logMsg }
            ]
        };
        await saveOperation(updated);
    };

    // Create custom operations
    const handleCreateCustomOp = async (e: React.FormEvent) => {
        e.preventDefault();
        const newId = `OP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

        const newOp: ActiveOperation = {
            id: newId,
            name: newOpData.name || "Yeni Operasyon",
            type: newOpData.type,
            status: "Aktif",
            startTime: timestampStr,
            endTime: null,
            location: newOpData.location,
            temperature: "",
            radioFrequency: newOpData.radioFrequency,
            teams: [],
            baseCamp: { members: [], equipment: [] },
            supplies: calculateInitialSupplies(newOpData.type, newOpData.personnelCount),
            logs: [
                { time: timestampStr, message: `Operasyon kaydı oluşturuldu. Tür: ${newOpData.type}` }
            ],
            isEvacuationActive: false,
            postMortemReport: { completed: false, notes: "", memberNotes: {} }
        };

        await saveOperation(newOp);
        setNewOpData({ name: "", type: "Deprem", location: "", radioFrequency: "145.550", personnelCount: 10 });
        setShowNewOp(false);
        setSelectedOp(newOp);

        if (newOp.type === "Eğitim" || newOp.type === "Kamp") {
            fetchWeather(newOp.location);
        }
    };

    const calculateInitialSupplies = (type: string, personnelCount: number = 10) => {
        let firstAidRatio = 1;
        if (type === "Deprem" || type === "Yangın") {
            firstAidRatio = 3; // Ağır travma ve yanıklar için daha fazla ilk yardım seti
        } else if (type === "Doğada Arama") {
            firstAidRatio = 2;
        }

        return {
            ppeCount: personnelCount * 1,
            mealsCount: personnelCount * 2,
            firstAidKits: Math.ceil(personnelCount / firstAidRatio)
        };
    };

    // Panic Mode
    const handlePanicStart = async () => {
        const panicId = `OP-PANIC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const panicOp: ActiveOperation = {
            id: panicId,
            name: `ACİL DEPREM AFET SEVKİYATI`,
            type: "Deprem",
            status: "Aktif",
            startTime: timestampStr,
            endTime: null,
            location: "Afet Saha Koordinasyonu",
            temperature: "",
            radioFrequency: "145.550",
            teams: [],
            baseCamp: { members: [], equipment: [] },
            supplies: calculateInitialSupplies("Deprem", 25), // Panik modu: 25 kişilik hızlı lojistik
            logs: [
                { time: timestampStr, message: "⚠️ PANİK GÖNDERİM MODU AKTİFLEŞTİRİLDİ!" }
            ],
            isEvacuationActive: false,
            postMortemReport: { completed: false, notes: "", memberNotes: {} }
        };

        await saveOperation(panicOp);
        setSelectedOp(panicOp);
        alert("Acil afet komut paneli hazırlandı!");
    };

    // Open closure modal / screen instead of direct archiving
    const handleOpenClosureModal = () => {
        if (!selectedOp) return;
        setClosureFtrNotes(selectedOp.postMortemReport?.notes || "");
        setClosureMemberNotes(selectedOp.postMortemReport?.memberNotes || {});
        setClosureDamagedItems({});
        setClosureTab("teams");
        setShowClosureModal(true);
    };

    // Confirm final closure submission and apply database releases/damages
    const handleConfirmFinalClosure = async () => {
        if (!selectedOp) return;
        const currentTimestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

        // 1. Gather all equipment allocated to teams or base camp
        const allOpEquipmentIds: string[] = [];
        selectedOp.teams.forEach(t => t.equipment.forEach(id => allOpEquipmentIds.push(id)));
        selectedOp.baseCamp.equipment.forEach(id => allOpEquipmentIds.push(id));

        // 2. Perform bulk releases & damage updates on inventory items
        for (const eqId of allOpEquipmentIds) {
            const finalStatus = closureDamagedItems[eqId] || "Depoda";
            // Mocking updateInventoryStatus logic here
        }

        // Save FTR medical logs permanently to members' database profiles
        for (const mId of Object.keys(closureMemberNotes)) {
            const noteVal = closureMemberNotes[mId];
            if (noteVal && noteVal.trim() !== "") {
                try {
                    await fetch("/api/members", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            memberId: mId,
                            action: "add_ftr_record",
                            operationId: selectedOp.id,
                            operationName: selectedOp.name,
                            note: noteVal
                        })
                    });
                } catch (e) {
                    console.error("FTR note save failed for member", mId, e);
                }
            }
        }

        // Calculate supplies used
        const totalPersonnel = selectedOp.teams.reduce((acc, t) => acc + t.members.length, 0) + selectedOp.baseCamp.members.length;
        const initialSupplies = calculateInitialSupplies(selectedOp.type, Math.max(totalPersonnel, 10)); // Default to 10 if nobody added yet
        const suppliesUsed = {
            ppeCount: Math.max(0, initialSupplies.ppeCount - (selectedOp.supplies?.ppeCount || 0)),
            mealsCount: Math.max(0, initialSupplies.mealsCount - (selectedOp.supplies?.mealsCount || 0)),
            firstAidKits: Math.max(0, initialSupplies.firstAidKits - (selectedOp.supplies?.firstAidKits || 0)),
        };

        const updated: ActiveOperation = {
            ...selectedOp,
            status: "Tamamlandı" as const,
            endTime: currentTimestampStr,
            postMortemReport: {
                completed: true,
                notes: closureFtrNotes,
                memberNotes: closureMemberNotes,
                suppliesUsed
            },
            logs: [
                ...selectedOp.logs,
                { time: currentTimestampStr, message: "Operasyon Kapanış Raporu ve FTR Tıbbi Kayıtları onaylanıp arşivlendi." }
            ]
        };

        const res = await fetch('/api/settings/operations/active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });

        if (res.ok) {
            alert("Operasyon başarıyla kapatıldı ve arşive kaldırıldı!");
            setFinishedOperation(updated);
            setShowClosureModal(false);
            setShowSummaryModal(true);
            setSelectedOp(null);
            fetchData();
        }
    };

    // Supplies incrementor
    const handleQuickSupply = async (key: keyof ActiveOperation["supplies"], val: number) => {
        if (!selectedOp) return;
        const currentSupplies = { ...selectedOp.supplies };
        currentSupplies[key] = Math.max(0, currentSupplies[key] + val);

        const updated = {
            ...selectedOp,
            supplies: currentSupplies,
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Lojistik güncelleme: ${key} miktarı değiştirildi (${val > 0 ? '+' : ''}${val})` }
            ]
        };
        await saveOperation(updated);
    };

    // Add manual log entries
    const addManualLog = async () => {
        if (!selectedOp || !manualLogText.trim()) return;
        const newLog = {
            time: new Date().toISOString().replace('T', ' ').substring(0, 16),
            message: `[Telsiz]: ${manualLogText}`
        };
        const updated = { ...selectedOp, logs: [...selectedOp.logs, newLog] };
        await saveOperation(updated);
        setManualLogText("");
    };

    // Frequency update
    const updateFrequency = async (val: string) => {
        if (!selectedOp) return;
        const updated = {
            ...selectedOp,
            radioFrequency: val
        };
        await saveOperation(updated);
    };

    // Team Actions
    const handleAddTeam = async () => {
        if (!selectedOp || !newTeamName.trim()) return;
        
        const newTeam: Team = {
            id: `TEAM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: newTeamName,
            status: "Kampta",
            members: [],
            equipment: [],
            deployments: []
        };

        const updated = {
            ...selectedOp,
            teams: [...selectedOp.teams, newTeam],
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Yeni kurtarma timi oluşturuldu: ${newTeam.name}` }
            ]
        };
        await saveOperation(updated);
        setNewTeamName("");
        setShowAddTeamModal(false);
    };

    const handleRemoveTeam = async (teamId: string) => {
        if (!selectedOp) return;
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!team) return;

        if (confirm(`"${team.name}" ekibini ve sevk verilerini silmek istediğinize emin misiniz?`)) {
            const returnedMembers = team.members.map(m => m.id);
            const returnedEquip = team.equipment;

            const updatedTeams = selectedOp.teams.filter(t => t.id !== teamId);
            const updatedBaseCamp = {
                members: Array.from(new Set([...selectedOp.baseCamp.members, ...returnedMembers])),
                equipment: Array.from(new Set([...selectedOp.baseCamp.equipment, ...returnedEquip]))
            };

            const updated = {
                ...selectedOp,
                teams: updatedTeams,
                baseCamp: updatedBaseCamp,
                logs: [
                    ...selectedOp.logs,
                    { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Tim silindi: ${team.name}. Personel ve malzemeler Base Kampına çekildi.` }
                ]
            };
            await saveOperation(updated);
        }
    };

    const handleHardDeleteTeam = async (teamId: string) => {
        if (!selectedOp) return;
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!team) return;

        if (confirm(`KRİTİK UYARI: "${team.name}" ekibini ve sevk kayıtlarını KALICI olarak yok etmek istediğinize emin misiniz? Personeller ve malzemeler Base havuzuna iade edilmeyecektir (Ekipman durumları depoda olarak sıfırlanacaktır).`)) {
            // Reset equipment status to Depoda in inventory
            for (const eqId of team.equipment) {
                await updateInventoryStatus(eqId, "Depoda", null);
            }

            const updatedTeams = selectedOp.teams.filter(t => t.id !== teamId);
            const updated = {
                ...selectedOp,
                teams: updatedTeams,
                logs: [
                    ...selectedOp.logs,
                    { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `⚠️ [Admin Hard Delete]: ${team.name} ekibi ve sevk kayıtları veritabanından kalıcı olarak silindi.` }
                ]
            };
            await saveOperation(updated);
        }
    };

    const handleDeployTeam = async (teamId: string, targetLoc: string) => {
        if (!selectedOp) return;
        const currentTimestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    status: "Sahada" as const,
                    deployments: [
                        ...t.deployments,
                        { deployTime: currentTimestampStr, returnTime: null, pulse: null, targetLocation: targetLoc || "Genel Sektör" }
                    ]
                };
            }
            return t;
        });

        const teamName = selectedOp.teams.find(t => t.id === teamId)?.name || teamId;
        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            logs: [
                ...selectedOp.logs,
                { time: currentTimestampStr, message: `🚀 Tim sahaya sevk edildi: ${teamName} (Bölge: ${targetLoc || "Genel Sektör"})` }
            ]
        };
        await saveOperation(updated);
    };

    const initiateReturnToCamp = (teamId: string) => {
        setDebriefTeamId(teamId);
    };

    const submitDebrief = async (pulse: "Yeşil" | "Sarı" | "Kırmızı") => {
        if (!selectedOp || !debriefTeamId) return;
        const currentTimestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        const team = selectedOp.teams.find(t => t.id === debriefTeamId);
        if (!team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === debriefTeamId) {
                const updatedDeps = [...t.deployments];
                if (updatedDeps.length > 0 && !updatedDeps[updatedDeps.length - 1].returnTime) {
                    updatedDeps[updatedDeps.length - 1] = {
                        ...updatedDeps[updatedDeps.length - 1],
                        returnTime: currentTimestampStr,
                        pulse
                    };
                }
                return {
                    ...t,
                    status: "Kampta" as const,
                    deployments: updatedDeps
                };
            }
            return t;
        });

        const pulseColor = pulse === "Yeşil" ? "Zinde" : pulse === "Sarı" ? "Yıpranmış" : "Tükenmiş";
        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            logs: [
                ...selectedOp.logs,
                { time: currentTimestampStr, message: `⛺ Tim kampa dönüş yaptı: ${team.name}. Debriefing Nabız: ${pulseColor}` }
            ]
        };
        await saveOperation(updated);
        setDebriefTeamId(null);
    };

    // Add elements to Base Camp or Teams
    const handleCommandSubmit = async (val: string) => {
        if (!selectedOp || !val.trim()) return;
        
        const cleanVal = val.trim();
        const query = cleanVal.toLowerCase();

        // 1. Check inventory data exact match
        const matchedItem = inventoryData.find(i => i.id.toLowerCase() === query);
        if (matchedItem) {
            // Add to base camp
            const inOp = selectedOp.baseCamp.equipment.includes(matchedItem.id) ||
                         selectedOp.teams.some(t => t.equipment.includes(matchedItem.id));
            if (inOp) {
                alert("Bu ekipman zaten operasyona sevk edilmiş!");
            } else {
                const updated = {
                    ...selectedOp,
                    baseCamp: {
                        ...selectedOp.baseCamp,
                        equipment: [...selectedOp.baseCamp.equipment, matchedItem.id]
                    },
                    logs: [...selectedOp.logs, { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Lojistik Sevk: ${matchedItem.name} Base kamp deposuna giriş yaptı.` }]
                };
                await saveOperation(updated);
                await updateInventoryStatus(matchedItem.id, "Zimmetli", selectedOp.id);
            }
            setCommandInput("");
            return;
        }

        // 2. Check member data exact match
        const matchedMember = membersData.find(m => m.id.toLowerCase() === query);
        if (matchedMember) {
            const inOp = selectedOp.baseCamp.members.includes(matchedMember.id) ||
                         selectedOp.teams.some(t => t.members.some(mem => mem.id === matchedMember.id));
            if (inOp) {
                alert("Bu personel zaten yoklamada ekli!");
            } else {
                const updated = {
                    ...selectedOp,
                    baseCamp: {
                        ...selectedOp.baseCamp,
                        members: [...selectedOp.baseCamp.members, matchedMember.id]
                    },
                    logs: [...selectedOp.logs, { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `Yoklama: ${matchedMember.fullName} Base kampına giriş yaptı.` }]
                };
                await saveOperation(updated);
            }
            setCommandInput("");
            return;
        }

        // Auto select closest match
        if (commandResults.members.length > 0) {
            handleSelectAutocomplete("member", commandResults.members[0].id);
        } else if (commandResults.items.length > 0) {
            handleSelectAutocomplete("item", commandResults.items[0].id);
        } else {
            alert(`Kayıt bulunamadı: "${cleanVal}"`);
        }
    };

    const handleSelectAutocomplete = async (type: "member" | "item", id: string) => {
        if (!selectedOp) return;
        const currentTimestampStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
        if (type === "member") {
            const member = membersData.find(m => m.id === id);
            const updated = {
                ...selectedOp,
                baseCamp: {
                    ...selectedOp.baseCamp,
                    members: [...selectedOp.baseCamp.members, id]
                },
                logs: [...selectedOp.logs, { time: currentTimestampStr, message: `Yoklama Girişi: ${member?.fullName} base kampına giriş yaptı.` }]
            };
            await saveOperation(updated);
        } else {
            const item = inventoryData.find(i => i.id === id);
            const updated = {
                ...selectedOp,
                baseCamp: {
                    ...selectedOp.baseCamp,
                    equipment: [...selectedOp.baseCamp.equipment, id]
                },
                logs: [...selectedOp.logs, { time: currentTimestampStr, message: `Malzeme Girişi: ${item?.name} base deposuna girdi.` }]
            };
            await saveOperation(updated);
            await updateInventoryStatus(id, "Zimmetli", selectedOp.id);
        }
        setCommandInput("");
    };

    const updateInventoryStatus = async (eqId: string, status: string, assignedTo: string | null) => {
        const item = inventoryData.find(i => i.id === eqId);
        if (!item) return;
        const updated = { ...item, status, assignedTo };
        try {
            await fetch("/api/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });
            setInventoryData(prev => prev.map(i => i.id === eqId ? updated : i));
        } catch(e) {
            console.error("Inventory status update error", e);
        }
    };

    // Assigning assets from Base Camp to Teams
    const assignMemberToTeam = async (teamId: string, memberId: string, role: "Lider" | "Üye") => {
        if (!selectedOp) return;
        const member = membersData.find(m => m.id === memberId);
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!member || !team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    members: [...t.members, { id: memberId, role }]
                };
            }
            return t;
        });

        const updatedBaseMembers = selectedOp.baseCamp.members.filter(id => id !== memberId);

        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            baseCamp: {
                ...selectedOp.baseCamp,
                members: updatedBaseMembers
            },
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${member.fullName}, ${team.name} ekibine '${role}' olarak atandı.` }
            ]
        };
        await saveOperation(updated);
    };

    const setTeamLeader = async (teamId: string, memberId: string) => {
        if (!selectedOp) return;
        const member = membersData.find(m => m.id === memberId);
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!member || !team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                const updatedMembers = t.members.map(m => {
                    if (m.id === memberId) return { ...m, role: "Lider" as "Lider" };
                    return { ...m, role: "Üye" as "Üye" }; // Demote others
                });
                return { ...t, members: updatedMembers };
            }
            return t;
        });

        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${member.fullName}, ${team.name} ekibine yeni lider olarak atandı.` }
            ]
        };
        await saveOperation(updated);
    };

    const assignEquipmentToTeam = async (teamId: string, eqId: string) => {
        if (!selectedOp) return;
        const item = inventoryData.find(i => i.id === eqId);
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!item || !team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    equipment: [...t.equipment, eqId]
                };
            }
            return t;
        });

        const updatedBaseEq = selectedOp.baseCamp.equipment.filter(id => id !== eqId);

        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            baseCamp: {
                ...selectedOp.baseCamp,
                equipment: updatedBaseEq
            },
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${item.name} ekipmanı, ${team.name} ekibine devredildi.` }
            ]
        };
        await saveOperation(updated);
    };

    // Remove assets from teams back to Base Camp
    const removeMemberFromTeam = async (teamId: string, memberId: string) => {
        if (!selectedOp) return;
        const member = membersData.find(m => m.id === memberId);
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    members: t.members.filter(m => m.id !== memberId)
                };
            }
            return t;
        });

        const updatedBaseMembers = [...selectedOp.baseCamp.members];
        if (!updatedBaseMembers.includes(memberId)) updatedBaseMembers.push(memberId);

        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            baseCamp: {
                ...selectedOp.baseCamp,
                members: updatedBaseMembers
            },
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${member?.fullName || memberId}, ${team.name} ekibinden çıkarılıp Base Kampına alındı.` }
            ]
        };
        await saveOperation(updated);
    };

    const removeEquipmentFromTeam = async (teamId: string, eqId: string) => {
        if (!selectedOp) return;
        const item = inventoryData.find(i => i.id === eqId);
        const team = selectedOp.teams.find(t => t.id === teamId);
        if (!team) return;

        const updatedTeams = selectedOp.teams.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    equipment: t.equipment.filter(e => e !== eqId)
                };
            }
            return t;
        });

        const updatedBaseEq = [...selectedOp.baseCamp.equipment];
        if (!updatedBaseEq.includes(eqId)) updatedBaseEq.push(eqId);

        const updated = {
            ...selectedOp,
            teams: updatedTeams,
            baseCamp: {
                ...selectedOp.baseCamp,
                equipment: updatedBaseEq
            },
            logs: [
                ...selectedOp.logs,
                { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${item?.name || eqId} ekipmanı, ${team.name} ekibinden Base deposuna geri çekildi.` }
            ]
        };
        await saveOperation(updated);
    };

    // Remove assets completely from operation
    const discardMemberFromOp = async (memberId: string) => {
        if (!selectedOp) return;
        const mName = membersData.find(m => m.id === memberId)?.fullName || memberId;
        if (confirm(`"${mName}" yoklamadan çıkartılacaktır. Onaylıyor musunuz?`)) {
            const updated = {
                ...selectedOp,
                baseCamp: {
                    ...selectedOp.baseCamp,
                    members: selectedOp.baseCamp.members.filter(id => id !== memberId)
                },
                logs: [...selectedOp.logs, { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${mName} operasyon sevk kadrosundan çıkarıldı.` }]
            };
            await saveOperation(updated);
        }
    };

    const discardEquipmentFromOp = async (eqId: string) => {
        if (!selectedOp) return;
        const eqName = inventoryData.find(i => i.id === eqId)?.name || eqId;
        if (confirm(`"${eqName}" depoya iade edilecektir. Onaylıyor musunuz?`)) {
            const updated = {
                ...selectedOp,
                baseCamp: {
                    ...selectedOp.baseCamp,
                    equipment: selectedOp.baseCamp.equipment.filter(id => id !== eqId)
                },
                logs: [...selectedOp.logs, { time: new Date().toISOString().replace('T', ' ').substring(0, 16), message: `${eqName} depoya geri iade edildi.` }]
            };
            await saveOperation(updated);
            await updateInventoryStatus(eqId, "Depoda", null);
        }
    };

    // QR scanner modal integration
    // Smart supply slips suggestions (Orman Yangın vs. Deprem)
    const renderSupplySlipSuggestions = () => {
        if (!selectedOp) return null;

        const totalActivePeople = selectedOp.teams.reduce((acc, t) => acc + t.members.length, 0) + selectedOp.baseCamp.members.length;

        if (selectedOp.type === "Yangın" || selectedOp.type === "Deprem") {
            return (
                <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-2xl space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                        <Flame size={16} /> Ağır Afet Lojistik İkmal Önerisi
                    </div>
                    <p className="text-[10px] text-neutral-400">Deprem ve yangın operasyonlarında ağır KKD donanımı ve travma odaklı ilk yardım setleri kritik öneme sahiptir.</p>
                    <ul className="text-xs space-y-1 text-neutral-300 font-mono">
                        <li>• Kritik KKD Donanımı: <span className="text-white font-bold">En az {Math.max(5, totalActivePeople * 1)} adet (Kişi Başı)</span></li>
                        <li>• Ağır Travma İlk Yardım Kiti: <span className="text-white font-bold">{Math.ceil(totalActivePeople / 3)} Adet Minimum</span></li>
                        <li>• Kumanya (Öğün): <span className="text-white font-bold">{totalActivePeople * 2} Öğün Asgari Tüketim</span></li>
                    </ul>
                </div>
            );
        } else {
            return (
                <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs uppercase tracking-wider">
                        <Compass size={16} /> Doğa/Eğitim İkmal Önerisi
                    </div>
                    <p className="text-[10px] text-neutral-400">Doğa aramaları ve kamp eğitimlerinde standart ilk yardım ve iaşe planlaması yeterlidir.</p>
                    <ul className="text-xs space-y-1 text-neutral-300 font-mono">
                        <li>• Standart KKD Donanımı: <span className="text-white font-bold">{totalActivePeople * 1} adet</span></li>
                        <li>• İlk Yardım Çantası: <span className="text-white font-bold">{Math.ceil(totalActivePeople / 2)} Adet Minimum</span></li>
                        <li>• İaşe (Kumanya): <span className="text-white font-bold">{totalActivePeople * 2} Öğün Asgari</span></li>
                    </ul>
                </div>
            );
        }
    };

    // Calculate dynamic team working times
    const calculateTeamWorkingHours = (team: Team) => {
        let totalMs = 0;
        team.deployments.forEach(d => {
            const start = Date.parse(d.deployTime.replace(' ', 'T'));
            if (!isNaN(start)) {
                const end = d.returnTime ? Date.parse(d.returnTime.replace(' ', 'T')) : Date.now();
                totalMs += Math.max(0, end - start);
            }
        });
        return (totalMs / (1000 * 60 * 60)).toFixed(1);
    };

    // Render post-mortem FTR report view
    const renderPostMortemFtr = () => {
        if (!selectedOp || selectedOp.status !== "Tamamlandı") return null;

        const isReportLocked = selectedOp.postMortemReport.completed;

        const uniqueMembers = new Set<string>();
        selectedOp.teams.forEach(t => t.members.forEach(m => uniqueMembers.add(m.id)));
        selectedOp.baseCamp.members.forEach(id => uniqueMembers.add(id));

        const uniqueEquip = new Set<string>();
        selectedOp.teams.forEach(t => t.equipment.forEach(e => uniqueEquip.add(e)));
        selectedOp.baseCamp.equipment.forEach(e => uniqueEquip.add(e));

        return (
            <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6 print-card">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" size={22} /> Operasyon Kapanış & FTR Raporu
                        </h3>
                        <p className="text-xs text-neutral-500">Afet bittikten sonra kilitlenmiş nihai debriefing raporu.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-neutral-500 uppercase block font-bold">Toplam Tim Süresi</span>
                        <span className="text-xl font-black text-white block mt-1">
                            {selectedOp.teams.reduce((acc, t) => acc + Number(calculateTeamWorkingHours(t)), 0).toFixed(1)} Saat
                        </span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-neutral-500 uppercase block font-bold">Lojistik Kayıt Sayısı</span>
                        <span className="text-xl font-black text-purple-400 block mt-1">{uniqueEquip.size} Parça Ekipman</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-neutral-500 uppercase block font-bold">Katılımcı Personel</span>
                        <span className="text-xl font-black text-emerald-400 block mt-1">{uniqueMembers.size} Personel</span>
                    </div>
                </div>

                <div className="space-y-2 text-xs">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Genel Değerlendirme Raporu</span>
                    <p className="text-neutral-300 leading-relaxed whitespace-pre-line bg-black/25 p-3 rounded-xl border border-white/5">
                        {selectedOp.postMortemReport.notes || "Girilmiş bir genel değerlendirme notu bulunmuyor."}
                    </p>
                </div>

                <div className="space-y-3 text-xs">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Personel Tıbbi & Fiziksel Durum Takipleri</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from(uniqueMembers).map(mId => {
                            const mem = membersData.find(m => m.id === mId);
                            const notesVal = selectedOp.postMortemReport.memberNotes[mId] || "Zinde / Rapor edilmedi";
                            return (
                                <div key={mId} className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                    <span className="text-xs text-white font-bold block">{mem?.fullName || mId}</span>
                                    <span className="text-[10px] text-neutral-400 font-mono block mt-1 bg-black/30 p-2 rounded border border-white/5">
                                        🩺 {notesVal}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };
    if (!mounted) return null;

    return (
        <div className="space-y-6 pb-20 select-none">
            {mounted && <QRScannerModal isScannerOpen={isScannerOpen} setIsScannerOpen={setIsScannerOpen} onCommandSubmit={handleCommandSubmit} mounted={mounted} />}

            {/* Print Override */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                        font-family: sans-serif;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .print-card {
                        border: 1px solid #000 !important;
                        background: transparent !important;
                        color: black !important;
                        padding: 15px !important;
                        margin-bottom: 15px !important;
                        border-radius: 4px !important;
                    }
                    .print-card * {
                        color: black !important;
                    }
                }
            `}} />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 no-print border-b border-white/5 pb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Activity className="text-red-500 " size={28} /> Afet Komuta & Sevk Masası
                        </h1>
                        {isOffline && (
                            <span className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest ">
                                Çevrimdışı Mod
                            </span>
                        )}
                    </div>
                    <p className="text-neutral-500 text-sm font-light italic">Toplum yararına hızlı, makro sevk ve hiyerarşi yönetim ekranı.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePanicStart}
                        className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-500/20 "
                    >
                        <ShieldAlert size={16} /> ACİL AFET MODUNU AÇ
                    </button>
                    <button 
                        onClick={() => setShowNewOp(true)} 
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all"
                    >
                        <Plus size={16} /> Planlı Faaliyet Başlat
                    </button>
                </div>
            </div>

            {/* DUAL PANE - OPERATIONS LIST SIDEBAR AND COMMAND WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
                
                {/* Operations side panel */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                        <Clock size={16} className="text-blue-500" /> Aktif Operasyonlar
                    </h2>
                    
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {operations.filter(op => op.status === "Aktif").map(op => {
                            const isPanic = op.id.includes("PANIC");
                            const isActive = true;
                            return (
                                <div 
                                    key={op.id} 
                                    onClick={() => setSelectedOp(op)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOp?.id === op.id ? 'bg-red-600/10 border-red-500/30' : 'bg-black/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                                                isPanic ? 'bg-red-500/20 text-red-500 border-red-500/20' : 'bg-white/5 text-white border-white/10'
                                            }`}>
                                                {isPanic ? 'PANİK' : op.type}
                                            </span>
                                            <span className="text-[10px] text-neutral-500 font-mono">{op.id}</span>
                                        </div>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${
                                            isActive 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ' 
                                            : 'bg-neutral-800 text-neutral-500 border-white/10'
                                        }`}>
                                            {op.status}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm leading-snug mb-2">{op.name}</h3>
                                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 border-t border-white/5 pt-2">
                                        <span className="flex items-center gap-1"><Users size={12} /> {op.teams?.length || 0} Tim</span>
                                        <span className="flex items-center gap-1 text-red-400 font-bold">{op.status === "Aktif" ? "DEVAM" : "BİTTİ"}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3 mt-6">
                        <Clock size={16} className="text-neutral-600" /> Geçmiş Operasyonlar
                    </h2>
                    
                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 opacity-70">
                        {operations.filter(op => op.status === "Tamamlandı").map(op => {
                            return (
                                <div 
                                    key={op.id} 
                                    onClick={() => setSelectedOp(op)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all bg-black/50 border-white/5 hover:border-white/20`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-neutral-500/20 text-neutral-400 text-[10px] font-bold uppercase rounded-md border border-neutral-500/20">{op.type}</span>
                                                <span className="text-[10px] font-medium text-neutral-600 font-mono">{op.endTime?.substring(0,10)}</span>
                                            </div>
                                            <h3 className="font-bold text-neutral-300 text-sm leading-tight">{op.name}</h3>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Operations main workspace */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedOp ? (
                        <div className="space-y-6">
                            
                            {/* Selected Operation Header HUD */}
                            <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20">{selectedOp.type}</span>
                                            <span className="text-xs text-neutral-500 font-mono">{selectedOp.id} • {selectedOp.startTime}</span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white tracking-tight">{selectedOp.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedOp.status === "Aktif" && (
                                            <button 
                                                onDoubleClick={triggerEvacuationAlert} 
                                                className={`px-4 py-2.5 ${selectedOp.isEvacuationActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] border border-white/10`}
                                                title="ÇİFT TIKLA: Saha Tahliye Alarmını Aç / Kapat"
                                            >
                                                <ShieldAlert size={14} /> {selectedOp.isEvacuationActive ? 'ALARM KAPAT (ÇİFT TIK)' : '🚨 TAHLİYE SİRENİ (ÇİFT TIK)'}
                                            </button>
                                        )}
                                        {selectedOp.status === "Aktif" && (
                                            <button onClick={() => setShowQrModal(true)} className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-indigo-500/20">
                                                <ScanBarcode size={14} /> TİM BAĞLANTI QR
                                            </button>
                                        )}
                                        {selectedOp.status === "Aktif" ? (
                                            <button onClick={handleOpenClosureModal} className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-red-500/20">
                                                <Square size={14} /> Faaliyeti Bitir
                                            </button>
                                        ) : (
                                            <button onClick={() => { setFinishedOperation(selectedOp); setShowSummaryModal(true); }} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-blue-500/20 transition-all">
                                                Raporu Görüntüle
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button 
                                                onClick={async () => {
                                                    if (confirm("Kritik: Bu operasyonu veritabanından kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz!")) {
                                                        const res = await fetch(`/api/settings/operations/active?id=${selectedOp.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            alert("Operasyon silindi.");
                                                            setSelectedOp(null);
                                                            fetchData();
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900 border border-red-900/30 text-red-400 hover:text-white rounded-xl text-xs font-bold uppercase transition-all"
                                                title="Operasyonu veritabanından kalıcı olarak sil"
                                            >
                                                Kalıcı Olarak Sil
                                            </button>
                                        )}
                                        <button onClick={() => window.print()} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-white/10 transition-colors">
                                            <Printer size={14} /> Yazdır (PDF)
                                        </button>
                                    </div>
                                </div>

                                {selectedOp.isEvacuationActive && (
                                    <div className="bg-red-600 text-white px-5 py-3.5 rounded-2xl flex items-center justify-between border border-red-500/30  text-xs font-extrabold tracking-wider uppercase shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert size={20} />
                                            <span>⚠️ TAHLİYE ALARMI AKTİF: Tüm ekipler kampa çekildi! Tahliyeleri onaylayın.</span>
                                        </div>
                                        <button onDoubleClick={triggerEvacuationAlert} className="px-3 py-1 bg-white text-red-600 rounded font-black text-[10px]">SİRENİ SUSTUR</button>
                                    </div>
                                )}

                                {/* Komuta Merkezi Radarı (Geofence / Anomaly) */}
                                {radarWarnings.length > 0 && (
                                    <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-red-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                                                <Activity size={14} /> Sistem Radar Uyarıları
                                            </h3>
                                            <button onClick={() => setRadarWarnings([])} className="text-red-500 hover:text-white text-[10px] font-bold uppercase">Temizle</button>
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {radarWarnings.map((w, idx) => (
                                                <div key={idx} className="bg-red-500/10 text-red-300 text-xs py-1.5 px-3 rounded font-mono border border-red-500/20">
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Environmental, Frequency and TICKING Clocks HUD */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Weather conditions (Shown only for Eğitim or Kamp) */}
                                    {(selectedOp.type === "Eğitim" || selectedOp.type === "Kamp") ? (
                                        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 relative">
                                            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Eğitim/Kamp Konumu (Hava Durumu)</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Konum girin... (Örn: Kemalpaşa)"
                                                    value={selectedOp.location}
                                                    disabled={selectedOp.status !== "Aktif" || weatherLoading}
                                                    onBlur={(e) => fetchWeather(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && fetchWeather((e.target as HTMLInputElement).value)}
                                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500 font-bold flex-1"
                                                />
                                                {weatherLoading ? (
                                                    <RefreshCw size={12} className="animate-spin text-neutral-400" />
                                                ) : (
                                                    <span className="text-white text-xs font-bold font-mono">{selectedOp.temperature || "Bulunamadı"}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Faaliyet Lokasyonu</span>
                                                <span className="text-white text-xs font-semibold">{selectedOp.location || "Saha Koordinasyonu"}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Radio Frequency (Only simple input box) */}
                                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Telsiz Frekansı (MHz)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-neutral-500 font-mono">Frekans [</span>
                                            <input 
                                                type="text"
                                                placeholder="145.550"
                                                value={selectedOp.radioFrequency || ""}
                                                disabled={selectedOp.status !== "Aktif"}
                                                onChange={(e) => updateFrequency(e.target.value)}
                                                className="bg-transparent border-b border-white/10 text-xs text-white font-bold outline-none text-center focus:border-red-500 w-20"
                                            />
                                            <span className="text-[10px] text-neutral-500 font-mono">]</span>
                                        </div>
                                    </div>

                                    {/* TICKING clock for entire active duration */}
                                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 flex flex-col justify-center text-center">
                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Operasyon Süresi (Tıklıyor)</span>
                                        <span className="text-lg font-black font-mono tracking-wider text-red-400">{formatDuration(selectedOp.startTime, selectedOp.endTime)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ADVANCED LIVE TRACKING MAP */}
                            <div className="h-[500px] md:h-[600px] mb-6 rounded-2xl overflow-hidden border border-white/10 relative z-0">
                                <OperasyonHaritasi operationId={selectedOp.id} />
                            </div>                            {/* CORE SECTION - TEAMS REGISTRY AND BASE CAMP POOL */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                
                                {/* Timler listesi (Active Teams & Deployments) - 2 Columns wide */}
                                <div className="xl:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <Users size={16} className="text-red-400" /> Arama Kurtarma Timleri ({selectedOp.teams.length})
                                        </h3>
                                        {selectedOp.status === "Aktif" && (
                                            <button 
                                                onClick={() => setShowAddTeamModal(true)}
                                                className="px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                            >
                                                <Plus size={12} /> Yeni Tim Ekle
                                            </button>
                                        )}
                                    </div>

                                    <TeamListPanel selectedOp={selectedOp} membersData={membersData} inventoryData={inventoryData} isAdmin={isAdmin} setShowAddTeamModal={setShowAddTeamModal} calculateTeamWorkingHours={calculateTeamWorkingHours} formatDuration={formatDuration} initiateReturnToCamp={initiateReturnToCamp} setDeployTeamIdForTarget={setDeployTeamIdForTarget} setDeployTargetLocation={setDeployTargetLocation} handleRemoveTeam={handleRemoveTeam} handleHardDeleteTeam={handleHardDeleteTeam} removeMemberFromTeam={removeMemberFromTeam} setTeamLeader={setTeamLeader} assignMemberToTeam={assignMemberToTeam} removeEquipmentFromTeam={removeEquipmentFromTeam} assignEquipmentToTeam={assignEquipmentToTeam} />
                                </div>

                                {/* BASE CAMP POINT COLUMN (Personel & Equipment pool) */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                                        <Compass size={16} className="text-blue-400 animate-spin-slow" /> Kamp / Base Noktası (Havuz)
                                    </h3>

                                    <div className="bg-[#050B14] border border-white/5 rounded-3xl p-5 space-y-5">
                                        
                                        {/* Dynamic scanner input */}
                                        {selectedOp.status === "Aktif" && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">Barkod Okut / Arama</span>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                                                        <input 
                                                            type="text"
                                                            placeholder="Personel TC / Malzeme ID..."
                                                            value={commandInput}
                                                            onChange={(e) => setCommandInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleCommandSubmit(commandInput)}
                                                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-xs text-white outline-none focus:border-red-500"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => setIsScannerOpen(true)}
                                                        className="p-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-600/20 transition-colors"
                                                    >
                                                        <ScanBarcode size={16} />
                                                    </button>
                                                </div>

                                                {/* Autocomplete list dropdown */}
                                                <AnimatePresence>
                                                    {commandInput.trim().length > 0 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                            className="absolute bg-[#090f1d] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl p-2 w-64 divide-y divide-white/5"
                                                        >
                                                            {commandResults.members.map(m => (
                                                                <div 
                                                                    key={m.id} onClick={() => handleSelectAutocomplete("member", m.id)}
                                                                    className="px-2 py-1.5 hover:bg-white/5 rounded text-[11px] cursor-pointer text-white font-bold"
                                                                >
                                                                    👤 {m.fullName}
                                                                </div>
                                                            ))}
                                                            {commandResults.items.map(i => (
                                                                <div 
                                                                    key={i.id} onClick={() => handleSelectAutocomplete("item", i.id)}
                                                                    className="px-2 py-1.5 hover:bg-white/5 rounded text-[11px] cursor-pointer text-white font-bold"
                                                                >
                                                                    📦 {i.name}
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Unassigned personnel */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Dinlenen / Boştaki Personeller ({selectedOp.baseCamp.members.length})</span>
                                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                                {selectedOp.baseCamp.members.map(mId => {
                                                    const m = membersData.find(mem => mem.id === mId);
                                                    return (
                                                        <div key={mId} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-2 text-xs">
                                                            <span className="text-neutral-300 font-bold">{m?.fullName || mId}</span>
                                                            {selectedOp.status === "Aktif" && (
                                                                <button onClick={() => discardMemberFromOp(mId)} className="text-[10px] text-red-400">İade</button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {selectedOp.baseCamp.members.length === 0 && (
                                                    <p className="text-[10px] text-neutral-600 italic">Boşta personel bulunmuyor.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unassigned equipment */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Boştaki Malzemeler ({selectedOp.baseCamp.equipment.length})</span>
                                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                                {selectedOp.baseCamp.equipment.map(eqId => {
                                                    const item = inventoryData.find(i => i.id === eqId);
                                                    return (
                                                        <div key={eqId} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-lg p-2 text-xs">
                                                            <span className="text-neutral-300 font-mono">{item?.name || eqId}</span>
                                                            {selectedOp.status === "Aktif" && (
                                                                <button onClick={() => discardEquipmentFromOp(eqId)} className="text-[10px] text-red-400">İade</button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                {selectedOp.baseCamp.equipment.length === 0 && (
                                                    <p className="text-[10px] text-neutral-600 italic">Boşta malzeme bulunmuyor.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOJİSTİK VE LOGBOOK */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                
                                {/* Supply tracking & dynamically updating slip */}
                                <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                                        <Package className="text-amber-500" size={16} /> Lojistik Çıkış & Sarfiyat İkmal Yönetimi
                                    </h3>
                                    
                                    {renderSupplySlipSuggestions()}

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {[
                                            { key: "ppeCount" as const, label: "KKD Donanımı (Adet)" },
                                            { key: "mealsCount" as const, label: "Kumanya (Öğün)" },
                                            { key: "firstAidKits" as const, label: "İlk Yardım Seti (Adet)" }
                                        ].map(item => (
                                            <div key={item.key} className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex justify-between items-center">
                                                <div>
                                                    <span className="text-neutral-400 text-[10px] uppercase font-bold block">{item.label}</span>
                                                    <span className="text-white text-sm font-black font-mono">{selectedOp.supplies[item.key] || 0}</span>
                                                </div>
                                                {selectedOp.status === "Aktif" && (
                                                    <div className="flex gap-1.5">
                                                        <button onClick={() => handleQuickSupply(item.key, -5)} className="px-2 py-1 bg-black/40 text-neutral-400 border border-white/10 rounded font-bold hover:text-white">-5</button>
                                                        <button onClick={() => handleQuickSupply(item.key, 5)} className="px-2 py-1 bg-black/40 text-neutral-400 border border-white/10 rounded font-bold hover:text-white">+5</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Simplified Radio Logbook */}
                                <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
                                        <MessageSquare className="text-purple-400" size={16} /> Telsiz Logbook (Taktik Kayıtlar)
                                    </h3>

                                    {selectedOp.status === "Aktif" && (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text"
                                                placeholder="Telsiz anonsunu buraya not edin..."
                                                value={manualLogText}
                                                onChange={(e) => setManualLogText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addManualLog()}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-red-500"
                                            />
                                            <button 
                                                onClick={addManualLog}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase transition-colors shrink-0"
                                            >
                                                Ekle
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {selectedOp.logs?.slice().reverse().map((log, i) => (
                                            <div key={i} className="text-[11px] font-mono leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                                                <span className="text-red-400 font-bold">{log.time}:</span> <span className="text-neutral-300">{log.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Render Post-Mortem FTR report draft */}
                            {renderPostMortemFtr()}

                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl">
                            <Activity size={64} className="text-neutral-700 mb-4 " />
                            <h2 className="text-xl font-bold">Faaliyet Bulunmuyor</h2>
                            <p className="text-neutral-500 text-sm mt-1">Lütfen yeni bir faaliyet başlatın veya yan taraftan seçin.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FORM: NEW PLANNED OPERATION MODAL */}
            {showNewOp && (
                <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Planlı Faaliyet Başlat</h3>
                            <button onClick={() => setShowNewOp(false)} className="p-1.5 text-neutral-400 hover:text-white rounded-lg"><X size={18}/></button>
                        </div>
                        
                        <form onSubmit={handleCreateCustomOp} className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Faaliyet Adı</label>
                                <input 
                                    type="text" required placeholder="Örn: Bornova Deprem Arama Kurtarma Tatbikatı"
                                    value={newOpData.name} onChange={(e) => setNewOpData({ ...newOpData, name: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Faaliyet Türü</label>
                                <select 
                                    value={newOpData.type} onChange={(e) => setNewOpData({ ...newOpData, type: e.target.value as any })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer outline-none focus:border-red-500"
                                >
                                    <option value="Deprem">Deprem (Enkaz Arama)</option>
                                    <option value="Yangın">Yangın (Orman Yangın)</option>
                                    <option value="Doğada Arama">Doğada Arama</option>
                                    <option value="Eğitim">Eğitim</option>
                                    <option value="Kamp">Kamp</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Konum / Merkez</label>
                                <input 
                                    type="text" required placeholder="Örn: Kemalpaşa Ormanlık Alan"
                                    value={newOpData.location} onChange={(e) => setNewOpData({ ...newOpData, location: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Telsiz Frekansı (MHz)</label>
                                <input 
                                    type="text" required placeholder="145.550"
                                    value={newOpData.radioFrequency} onChange={(e) => setNewOpData({ ...newOpData, radioFrequency: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Katılımcı Sayısı (Kişi)</label>
                                <input 
                                    type="number" required min="1" max="1000" placeholder="10"
                                    value={newOpData.personnelCount || ""} onChange={(e) => setNewOpData({ ...newOpData, personnelCount: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider mt-4 shadow-lg transition-colors"
                            >
                                Faaliyeti Başlat
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* FORM: ADD NEW TEAM MODAL */}
            {showAddTeamModal && (
                <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Yeni Tim Oluştur</h3>
                            <button onClick={() => setShowAddTeamModal(false)} className="p-1 text-neutral-400 hover:text-white rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Tim Adı</label>
                                <input 
                                    type="text" placeholder="Örn: Alfa Timi, Bornova-A"
                                    value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                                />
                            </div>
                            <button 
                                onClick={handleAddTeam}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase tracking-wider"
                            >
                                Timi Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FORM: ADD PIN MODAL */}
            {newPinPos && (
                <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">İşaretçi (Pin) Ekle</h3>
                            <button onClick={() => setNewPinPos(null)} className="p-1 text-neutral-400 hover:text-white rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <input 
                                type="text" placeholder="İşaretçi Adı (Örn: Merkez Kamp)"
                                value={newPinName} onChange={(e) => setNewPinName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                            />
                            <select
                                value={newPinType} onChange={(e) => setNewPinType(e.target.value as any)}
                                className="w-full bg-[#050B14] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                            >
                                <option value="Kamp">Kamp</option>
                                <option value="Araç">Araç</option>
                                <option value="Tehlike">Tehlike/Yangın</option>
                                <option value="Toplanma">Toplanma</option>
                            </select>
                            <button 
                                onClick={async () => {
                                    if(!newPinName) return alert("İsim girmelisiniz.");
                                    try {
                                        await fetch('/api/settings/operations/active/pins', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                operationId: selectedOp?.id,
                                                name: newPinName,
                                                type: newPinType,
                                                lat: newPinPos[0],
                                                lng: newPinPos[1],
                                                createdBy: "Admin"
                                            })
                                        });
                                        setNewPinPos(null);
                                        setNewPinName("");
                                        fetchData();
                                    } catch(e) {
                                        alert("Hata oluştu.");
                                    }
                                }}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase tracking-wider"
                            >
                                İşaretçiyi Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: 10-SECOND PULSE CHECK DEBRIEF */}
            {debriefTeamId && (
                <div className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-6 text-center shadow-2xl"
                    >
                        <div>
                            <Heart size={44} className="text-red-500 mx-auto  mb-3" />
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Tim Nabız Yoklaması (Debriefing)</h3>
                            <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
                                Deplase olan ekibin kampa dönüş anındaki fiziksel/tıbbi yıpranma durumunu 1 saniyede kaydedin.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => submitDebrief("Yeşil")}
                                className="p-4 bg-emerald-500/10 border-2 border-emerald-500/20 hover:border-emerald-500/80 rounded-2xl flex flex-col items-center justify-center transition-all group"
                            >
                                <span className="w-4 h-4 rounded-full bg-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">Zinde / İyi</span>
                            </button>
                            
                            <button 
                                onClick={() => submitDebrief("Sarı")}
                                className="p-4 bg-amber-500/10 border-2 border-amber-500/20 hover:border-amber-500/80 rounded-2xl flex flex-col items-center justify-center transition-all group"
                            >
                                <span className="w-4 h-4 rounded-full bg-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black text-amber-400 uppercase tracking-wide">Yıpranmış</span>
                            </button>
                            
                            <button 
                                onClick={() => submitDebrief("Kırmızı")}
                                className="p-4 bg-red-500/10 border-2 border-red-500/20 hover:border-red-500/80 rounded-2xl flex flex-col items-center justify-center transition-all group "
                            >
                                <span className="w-4 h-4 rounded-full bg-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-black text-red-400 uppercase tracking-wide">Tükendi</span>
                            </button>
                        </div>

                        <button 
                            onClick={() => setDebriefTeamId(null)}
                            className="text-xs text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-wider"
                        >
                            İptal
                        </button>
                    </motion.div>
                </div>
            )}

            {/* MODAL: TARGET LOCATION PROMPT ON TEAM DEPLOY */}
            {deployTeamIdForTarget && (
                <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Hedef Sektör Belirtin</h3>
                            <button onClick={() => setDeployTeamIdForTarget(null)} className="p-1 text-neutral-400 hover:text-white rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <label className="block text-neutral-400 font-bold uppercase tracking-wider text-[9px]">Hedef Bölge / Çalışma Sektörü</label>
                                <input 
                                    type="text" placeholder="Örn: Enkaz-B3, Doğu Yamaç"
                                    value={deployTargetLocation} onChange={(e) => setDeployTargetLocation(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleDeployTeam(deployTeamIdForTarget, deployTargetLocation);
                                            setDeployTeamIdForTarget(null);
                                        }
                                    }}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-bold"
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    handleDeployTeam(deployTeamIdForTarget, deployTargetLocation);
                                    setDeployTeamIdForTarget(null);
                                }}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase tracking-wider"
                            >
                                Sahaya Sevk Et
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MANDATORY THREE-TAB DEBRIEFING CLOSURE REPORT */}
            {showClosureModal && selectedOp && (
                <div className="fixed inset-0 bg-black/90 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#050B14] border border-white/10 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl my-8"
                    >
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-emerald-400" /> Operasyon Kapanış & FTR Kaydı
                                </h3>
                                <p className="text-neutral-400 text-xs mt-1">Lütfen aşağıdaki kapanış formunu eksiksiz doldurun.</p>
                            </div>
                            <button onClick={() => setShowClosureModal(false)} className="p-1.5 text-neutral-400 hover:text-white rounded-lg"><X size={18}/></button>
                        </div>

                        {/* Closure Tabs selection row */}
                        <div className="flex gap-2 border-b border-white/5 pb-2">
                            {[
                                { key: "teams" as const, label: "Tim Süreleri" },
                                { key: "logistics" as const, label: "Kayıp/Hasarlı Ekipman" },
                                { key: "medical" as const, label: "FTR & Tıbbi Kayıtlar" }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setClosureTab(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                        closureTab === tab.key 
                                        ? 'bg-red-600 text-white shadow-lg' 
                                        : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Closure tab contents */}
                        <div className="min-h-[250px] text-xs">
                            {closureTab === "teams" && (
                                <div className="space-y-4">
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">TİM AKTİF SAHA ÇALIŞMA SÜRELERİ</span>
                                    <div className="space-y-2">
                                        {selectedOp.teams.map(t => (
                                            <div key={t.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 font-mono">
                                                <span className="text-white font-bold">{t.name}</span>
                                                <span className="text-neutral-400">Çalışma Süresi: <span className="text-white font-bold">{calculateTeamWorkingHours(t)} Saat</span></span>
                                            </div>
                                        ))}
                                        {selectedOp.teams.length === 0 && (
                                            <p className="text-neutral-500 italic py-4 text-center">Bu operasyonda kayıtlı tim bulunmuyor.</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <label className="block text-[10px] text-neutral-400 uppercase font-bold">Genel Değerlendirme & Kapanış Notları</label>
                                        <textarea 
                                            rows={3}
                                            placeholder="Afet sonlandırma raporu, operasyonel başarı durumlarını yazın..."
                                            value={closureFtrNotes}
                                            onChange={(e) => setClosureFtrNotes(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {closureTab === "logistics" && (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">SAHADAKİ EKİPMANLARIN HASAR/KAYIP DURUMLARI</span>
                                            <p className="text-[10px] text-neutral-500 mt-0.5">Zayiat veya hasar gören cihazları işaretleyin. "Hasarlı" seçilince fotoğraf çekebilirsiniz.</p>
                                        </div>
                                        <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full font-bold uppercase">📷 Kamera Aktif</span>
                                    </div>
                                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                        {(() => {
                                            const opItems: string[] = [];
                                            selectedOp.teams.forEach((t: any) => t.equipment?.forEach((id: string) => opItems.push(id)));
                                            selectedOp.baseCamp?.equipment?.forEach((id: string) => opItems.push(id));

                                            return opItems.map(eqId => {
                                                const item = inventoryData.find((i: any) => i.id === eqId);
                                                const currentMark = closureDamagedItems[eqId] || "Depoda";
                                                const photoState = closureDamagePhotos[eqId] || {};

                                                return (
                                                    <div key={eqId} className={`flex flex-col bg-white/5 border rounded-xl p-3 gap-3 transition-all ${
                                                        currentMark === "Hasarlı" ? "border-red-500/30 bg-red-500/5" :
                                                        currentMark === "Kayıp" ? "border-amber-500/30" : "border-white/5"
                                                    }`}>
                                                        {/* Malzeme başlığı + durum butonları */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div>
                                                                <span className="text-white font-bold block">{item?.name || eqId}</span>
                                                                <span className="text-[10px] text-neutral-500 font-mono">{eqId} • {item?.category}</span>
                                                            </div>
                                                            <div className="flex gap-1.5 shrink-0">
                                                                {[
                                                                    { val: "Depoda" as const, label: "Sağlam", color: "emerald" },
                                                                    { val: "Kayıp" as const, label: "Kayıp", color: "amber" },
                                                                    { val: "Hasarlı" as const, label: "Hasarlı 📷", color: "red" }
                                                                ].map(opt => (
                                                                    <button
                                                                        key={opt.val}
                                                                        onClick={() => {
                                                                            setClosureDamagedItems({ ...closureDamagedItems, [eqId]: opt.val });
                                                                            // Hasarlı'dan çıkınca fotoğraf state'ini temizle
                                                                            if (opt.val !== "Hasarlı") {
                                                                                setClosureDamagePhotos(prev => { const n = {...prev}; delete n[eqId]; return n; });
                                                                            }
                                                                        }}
                                                                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                                                                            currentMark === opt.val
                                                                            ? `bg-${opt.color}-600 text-white border-${opt.color}-500`
                                                                            : `bg-black/30 border-white/5 text-neutral-400 hover:border-${opt.color}-500/30 hover:text-${opt.color}-400`
                                                                        }`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Hasar Fotoğrafı Alanı — sadece Hasarlı seçilince göster */}
                                                        {currentMark === "Hasarlı" && (
                                                            <div className="border-t border-red-500/20 pt-3">
                                                                {photoState.uploadedUrl ? (
                                                                    // Yüklendi — önizleme + tekrar çek
                                                                    <div className="flex items-center gap-3">
                                                                        <a href={photoState.uploadedUrl} target="_blank" rel="noreferrer">
                                                                            <img
                                                                                src={photoState.uploadedUrl}
                                                                                alt="Hasar fotoğrafı"
                                                                                className="w-16 h-16 object-cover rounded-lg border border-red-500/30 hover:opacity-80 transition-opacity"
                                                                            />
                                                                        </a>
                                                                        <div>
                                                                            <p className="text-[10px] text-emerald-400 font-bold uppercase">✓ Fotoğraf Yüklendi</p>
                                                                            <p className="text-[9px] text-neutral-500 mt-0.5">Depo yöneticisi görseli görecek</p>
                                                                            <button
                                                                                onClick={() => setClosureDamagePhotos(prev => ({ ...prev, [eqId]: {} }))}
                                                                                className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase mt-1"
                                                                            >
                                                                                Yeniden Çek
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : photoState.previewUrl ? (
                                                                    // Seçildi ama henüz yüklenmedi
                                                                    <div className="flex items-center gap-3">
                                                                        <img
                                                                            src={photoState.previewUrl}
                                                                            alt="Önizleme"
                                                                            className="w-16 h-16 object-cover rounded-lg border border-amber-500/30"
                                                                        />
                                                                        <div>
                                                                            <p className="text-[10px] text-amber-400 font-bold uppercase">Fotoğraf Seçildi</p>
                                                                            <p className="text-[9px] text-neutral-500">{photoState.file?.name}</p>
                                                                            <button
                                                                                disabled={photoState.uploading}
                                                                                onClick={async () => {
                                                                                    if (!photoState.file) return;
                                                                                    setClosureDamagePhotos(prev => ({ ...prev, [eqId]: { ...prev[eqId], uploading: true } }));
                                                                                    try {
                                                                                        const fd = new FormData();
                                                                                        fd.append('file', photoState.file);
                                                                                        fd.append('itemId', eqId);
                                                                                        fd.append('operationId', selectedOp.id);
                                                                                        const res = await fetch('/api/inventory/damage-photo', { method: 'POST', body: fd });
                                                                                        const data = await res.json();
                                                                                        if (data.photoUrl) {
                                                                                            setClosureDamagePhotos(prev => ({ ...prev, [eqId]: { ...prev[eqId], uploadedUrl: data.photoUrl, uploading: false } }));
                                                                                        } else {
                                                                                            alert('Yükleme hatası: ' + (data.error ?? 'Bilinmeyen hata'));
                                                                                            setClosureDamagePhotos(prev => ({ ...prev, [eqId]: { ...prev[eqId], uploading: false } }));
                                                                                        }
                                                                                    } catch {
                                                                                        alert('Fotoğraf yüklenemedi.');
                                                                                        setClosureDamagePhotos(prev => ({ ...prev, [eqId]: { ...prev[eqId], uploading: false } }));
                                                                                    }
                                                                                }}
                                                                                className={`mt-1 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${
                                                                                    photoState.uploading
                                                                                    ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                                                                                    : 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                                                                                }`}
                                                                            >
                                                                                {photoState.uploading ? '⏳ Yükleniyor...' : '☁️ Supabase Storage\'a Yükle'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    // Henüz fotoğraf yok — kamera/galeri butonu
                                                                    <label
                                                                        htmlFor={`damage-photo-${eqId}`}
                                                                        className="flex items-center gap-2 cursor-pointer px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 border-dashed rounded-xl transition-all group"
                                                                    >
                                                                        <span className="text-2xl">📷</span>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-red-400 group-hover:text-red-300">Hasar Fotoğrafı Çek / Seç</p>
                                                                            <p className="text-[9px] text-neutral-500">Mobil: kamera açılır • Masaüstü: dosya seç</p>
                                                                        </div>
                                                                        <input
                                                                            type="file"
                                                                            id={`damage-photo-${eqId}`}
                                                                            accept="image/*"
                                                                            capture="environment"
                                                                            className="hidden"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (!file) return;
                                                                                const previewUrl = URL.createObjectURL(file);
                                                                                setClosureDamagePhotos(prev => ({
                                                                                    ...prev,
                                                                                    [eqId]: { file, previewUrl }
                                                                                }));
                                                                            }}
                                                                        />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                        {(() => {
                                            const opItemsCount = (selectedOp.baseCamp?.equipment?.length ?? 0) + selectedOp.teams.reduce((s: number, t: any) => s + (t.equipment?.length ?? 0), 0);
                                            return opItemsCount === 0 && (
                                                <p className="text-neutral-500 italic py-4 text-center">Bu operasyona atanmış envanter bulunmuyor.</p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {closureTab === "medical" && (
                                <div className="space-y-4">
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">SAHADAKİ PERSONELLERİN FİZİKSEL & TIBBİ RAPORLARI</span>
                                    <p className="text-[10px] text-neutral-500 font-light">Personel durumlarını yazın. Bu kayıtlar FTR (Fizik Tedavi & Rehabilitasyon) takip havuzuna kalıcı işlenecektir.</p>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                        {(() => {
                                            const uniqueMemIds = new Set<string>();
                                            selectedOp.teams.forEach(t => t.members.forEach(m => uniqueMemIds.add(m.id)));
                                            selectedOp.baseCamp.members.forEach(id => uniqueMemIds.add(id));

                                            return Array.from(uniqueMemIds).map(mId => {
                                                const mem = membersData.find(m => m.id === mId);
                                                const currentNote = closureMemberNotes[mId] || "";

                                                return (
                                                    <div key={mId} className="flex flex-col gap-1.5 bg-white/5 border border-white/5 p-3 rounded-xl">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-white font-bold">{mem?.fullName || mId}</span>
                                                            <span className="text-[9px] text-neutral-500 font-mono">{mId}</span>
                                                        </div>
                                                        <input 
                                                            type="text"
                                                            placeholder="Örn: Sağ el bileği hafif incindi / Zinde, hasarsız..."
                                                            value={currentNote}
                                                            onChange={(e) => setClosureMemberNotes({ ...closureMemberNotes, [mId]: e.target.value })}
                                                            className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-bold"
                                                        />
                                                    </div>
                                                );
                                            });
                                        })()}
                                        {(() => {
                                            const uniqueMemIdsCount = selectedOp.baseCamp.members.length + selectedOp.teams.reduce((s, t) => s + t.members.length, 0);
                                            return uniqueMemIdsCount === 0 && (
                                                <p className="text-neutral-500 italic py-4 text-center">Bu operasyona sevk edilmiş personel bulunmuyor.</p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Closure Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                            <button 
                                onClick={() => setShowClosureModal(false)}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-400 rounded-xl font-bold uppercase tracking-wider"
                            >
                                Vazgeç
                            </button>
                            <button 
                                onClick={handleConfirmFinalClosure}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg"
                            >
                                Kapanış Raporunu Onayla ve Operasyonu Kapat
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* MODAL: OPERATION PDF SUMMARY */}
            {showSummaryModal && finishedOperation && (
                <OperationSummaryModal 
                    operation={finishedOperation} 
                    onClose={() => setShowSummaryModal(false)} 
                />
            )}
            {/* TEAM QR CODE MODAL */}
            {showQrModal && selectedOp && (
                <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4">
                    <div className="bg-[#050B14] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
                        <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                            <X size={24} />
                        </button>
                        <h3 className="text-white font-black text-xl mb-1 uppercase tracking-tight">Sahaya Katılım</h3>
                        <p className="text-neutral-400 text-xs mb-6">Tim personelinin bu operasyona anında katılması için QR kodu okutması yeterlidir.</p>
                        
                        <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-xl">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/portal/operasyonlar/${selectedOp.id}`)}`} 
                                alt="Operation QR" 
                                className="w-48 h-48"
                            />
                        </div>
                        
                        <div className="bg-black/50 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                            <span className="text-neutral-500 font-mono text-xs truncate max-w-[200px]">
                                {`${window.location.origin}/portal/operasyonlar/${selectedOp.id}`}
                            </span>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/portal/operasyonlar/${selectedOp.id}`);
                                    alert("Link kopyalandı!");
                                }}
                                className="text-blue-500 text-xs font-bold uppercase hover:text-blue-400"
                            >
                                Kopyala
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
