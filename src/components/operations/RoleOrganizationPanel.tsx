import React, { useState, useEffect } from 'react';
import { Network, Plus, Trash2, ShieldCheck, Activity, Antenna, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_ROLES = [
    { title: "Ekip Lideri", icon: ShieldCheck, color: "text-red-400" },
    { title: "Ekip Lider Yardımcısı", icon: ShieldCheck, color: "text-red-300" },
    { title: "Medikal / Sağlık Birim Lideri", icon: Activity, color: "text-green-400" },
    { title: "Güvenlik Birim Lideri", icon: ShieldCheck, color: "text-yellow-400" },
    { title: "Lojistik Birim Lideri", icon: Package, color: "text-amber-400" },
    { title: "İletişim Sorumlusu", icon: Antenna, color: "text-blue-400" },
    { title: "Kamp Sorumlusu", icon: Network, color: "text-purple-400" }
];

export default function RoleOrganizationPanel({ operationId, membersData, isAdmin, isActive = true }: any) {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleAssignRole = async (memberId: string, roleTitle: string) => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId, roleTitle })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Görev atandı.");
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

    // Helper to get assigned members for a specific role
    const getAssignedMembers = (roleTitle: string) => {
        return assignments.filter(a => a.roleTitle === roleTitle);
    };

    // Get unique custom roles created beyond defaults
    const customRoles = Array.from(new Set(
        assignments.filter(a => !DEFAULT_ROLES.find(dr => dr.title === a.roleTitle)).map(a => a.roleTitle)
    ));

    const allRoles = [...DEFAULT_ROLES.map(r => r.title), ...customRoles];

    if (loading) return <div className="text-neutral-500 text-xs animate-pulse">Görev şeması yükleniyor...</div>;

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Network size={16} className="text-purple-400" /> Operasyon Görev Şeması
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allRoles.map((roleTitle) => {
                    const assigned = getAssignedMembers(roleTitle);
                    const roleConfig = DEFAULT_ROLES.find(r => r.title === roleTitle);
                    const Icon = roleConfig ? roleConfig.icon : Network;
                    const colorClass = roleConfig ? roleConfig.color : "text-white";

                    return (
                        <div key={roleTitle} className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Icon size={14} className={colorClass} />
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${colorClass}`}>
                                    {roleTitle}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {assigned.length === 0 ? (
                                    <p className="text-[10px] text-neutral-500 italic">Atama yapılmadı.</p>
                                ) : (
                                    assigned.map((a: any) => (
                                        <div key={a.id} className="flex justify-between items-center bg-black/30 rounded p-2 text-xs border border-white/5">
                                            <span className="text-white font-bold">{a.member.fullName}</span>
                                            {(isAdmin && isActive) && (
                                                <button onClick={() => handleRemoveRole(a.id)} className="text-red-500 hover:text-red-400 p-1">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {(isAdmin && isActive) && (
                                <div className="pt-2 border-t border-white/10">
                                    <select 
                                        className="bg-black border border-white/10 rounded p-1.5 text-[10px] text-white w-full outline-none"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAssignRole(e.target.value, roleTitle);
                                                e.target.value = ""; // reset
                                            }
                                        }}
                                    >
                                        <option value="">+ Personel Ata</option>
                                        {membersData.map((m: any) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
