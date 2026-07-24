import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, ShieldCheck, Activity, Antenna, Package, Search, Warehouse } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';

const DEFAULT_ROLES = [
    { title: "Ekip Lideri", icon: ShieldCheck, color: "text-red-400" },
    { title: "Ekip Lider Yardımcısı", icon: ShieldCheck, color: "text-red-300" },
    { title: "Medikal / Sağlık Birim Lideri", icon: Activity, color: "text-green-400" },
    { title: "Güvenlik Birim Lideri", icon: ShieldCheck, color: "text-yellow-400" },
    { title: "Lojistik Birim Lideri", icon: Package, color: "text-amber-400" },
    { title: "Depocu / Lojistik Sorumlusu", icon: Warehouse, color: "text-amber-500" },
    { title: "İletişim Sorumlusu", icon: Antenna, color: "text-blue-400" },
    { title: "Kamp Sorumlusu", icon: Network, color: "text-purple-400" }
];

export default function RoleOrganizationPanel({ operationId, membersData, isAdmin, isActive = true }: any) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCustomRoleInput, setNewCustomRoleInput] = useState("");
    const [selectedKavkas, setSelectedKavkas] = useState("DIGER");
    const [localCustomRoles, setLocalCustomRoles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRoles = async () => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/roles`);
            const data = await res.json();
            if (res.ok) setAssignments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [operationId]);

    const handleAssignRole = async (memberId: string, roleTitle: string, kavkas?: string) => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, roleTitle, kavkasFunctionGroup: kavkas || (roleTitle.includes('Depocu') || roleTitle.includes('Lojistik') ? 'LOJISTIK' : undefined) })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${roleTitle} görevi başarıyla atandı.`);
                fetchRoles();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Atama sırasında hata oluştu.");
        }
    };

    const handleRemoveRole = async (roleId: string) => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/roles`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleId })
            });
            if (res.ok) {
                toast.success("Görev iptal edildi.");
                fetchRoles();
            } else {
                toast.error("Hata oluştu.");
            }
        } catch (error) {
            toast.error("İptal sırasında hata oluştu.");
        }
    };

    const getAssignedMembers = (roleTitle: string) => {
        return assignments.filter(a => a.roleTitle === roleTitle);
    };

    const customRoles = Array.from(new Set([
        ...assignments.filter(a => !DEFAULT_ROLES.find(dr => dr.title === a.roleTitle)).map(a => a.roleTitle),
        ...localCustomRoles.map(r => r.title)
    ]));

    const allRoles = [...DEFAULT_ROLES.map(r => r.title), ...customRoles];

    const handleAddCustomRole = () => {
        const trimmed = newCustomRoleInput.trim();
        if (trimmed && !allRoles.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
            setLocalCustomRoles(prev => [...prev, { title: trimmed, kavkas: selectedKavkas }]);
            setNewCustomRoleInput("");
        }
    };

    if (loading) return <div className="text-neutral-500 text-xs animate-pulse">Görev şeması yükleniyor...</div>;

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Network size={18} className="text-red-500" /> Operasyonel Görev Dağılım Şeması
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Personellerin operasyonel rollerini tanımlayın (Depocu, Lojistik, Lider vb.)</p>
                </div>
            </div>

            {/* Role List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_ROLES.map((role, idx) => {
                    const RoleIcon = role.icon;
                    const assigned = getAssignedMembers(role.title);
                    
                    return (
                        <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <RoleIcon size={16} className={role.color} />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{role.title}</span>
                                </div>
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-400 font-mono font-bold">
                                    {assigned.length} Atandı
                                </span>
                            </div>

                            {/* Assigned members list */}
                            <div className="space-y-1">
                                {assigned.length === 0 ? (
                                    <div className="text-[11px] text-neutral-600 italic">Henüz bu göreve atama yapılmadı.</div>
                                ) : (
                                    assigned.map(a => (
                                        <div key={a.id} className="flex justify-between items-center bg-white/5 p-2 rounded-xl text-xs">
                                            <span className="text-neutral-200 font-medium">{a.member?.fullName || a.memberId}</span>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleRemoveRole(a.id)}
                                                    className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                                                    title="Görevi İptal Et"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Assign Member Input */}
                            {isAdmin && isActive && (
                                <div className="pt-2 border-t border-white/5">
                                    <SearchableSelect 
                                        options={membersData.map((m: any) => ({ value: m.id, label: m.fullName }))}
                                        placeholder={`+ ${role.title} Ata...`}
                                        onChange={(val) => {
                                            if (val) handleAssignRole(val, role.title);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Custom created roles */}
                {customRoles.map((roleTitle, idx) => {
                    const assigned = getAssignedMembers(roleTitle);
                    return (
                        <div key={`custom-${idx}`} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{roleTitle}</span>
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-400 font-mono font-bold">
                                    {assigned.length} Atandı
                                </span>
                            </div>

                            <div className="space-y-1">
                                {assigned.length === 0 ? (
                                    <div className="text-[11px] text-neutral-600 italic">Henüz atanmadı.</div>
                                ) : (
                                    assigned.map(a => (
                                        <div key={a.id} className="flex justify-between items-center bg-white/5 p-2 rounded-xl text-xs">
                                            <span className="text-neutral-200 font-medium">{a.member?.fullName || a.memberId}</span>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleRemoveRole(a.id)}
                                                    className="text-neutral-500 hover:text-red-400 p-1"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {isAdmin && isActive && (
                                <div className="pt-2 border-t border-white/5">
                                    <SearchableSelect 
                                        options={membersData.map((m: any) => ({ value: m.id, label: m.fullName }))}
                                        placeholder={`+ ${roleTitle} Ata...`}
                                        onChange={(val) => {
                                            if (val) handleAssignRole(val, roleTitle);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Custom Role Section */}
            {isAdmin && isActive && (
                <div className="pt-4 border-t border-white/5 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Özel Görev Unvanı Ekle (Örn: Lojistik Tesis Sorumlusu)..."
                        value={newCustomRoleInput}
                        onChange={(e) => setNewCustomRoleInput(e.target.value)}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500"
                    />
                    <button 
                        onClick={handleAddCustomRole}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                        <Plus size={14} /> Görev Tanımı Ekle
                    </button>
                </div>
            )}
        </div>
    );
}
