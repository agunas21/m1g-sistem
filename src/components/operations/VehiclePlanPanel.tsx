import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Trash2, UserPlus, ShieldAlert, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';

export default function VehiclePlanPanel({ operationId, membersData, isAdmin, isActive = true }: any) {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ plate: '', type: 'Pickup' });

    const fetchVehicles = async () => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/vehicles`);
            const data = await res.json();
            if (res.ok) setVehicles(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [operationId]);

    const handleAddVehicle = async () => {
        if (!newVehicle.plate) {
            toast.error("Plaka zorunludur!");
            return;
        }

        try {
            const res = await fetch(`/api/settings/operations/${operationId}/vehicles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVehicle)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Araç başarıyla eklendi.");
                setVehicles([...vehicles, data]);
                setShowAddModal(false);
                setNewVehicle({ plate: '', type: 'Pickup' });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Araç eklenirken hata oluştu.");
        }
    };

    const handleAssignMember = async (vehicleId: string, memberId: string, role: string) => {
        try {
            const res = await fetch(`/api/settings/operations/${operationId}/vehicles/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicleId, memberId, role })
            });
            if (res.ok) {
                toast.success("Personel araca atandı.");
                fetchVehicles();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch(error) {
            toast.error("Atama sırasında hata oluştu.");
        }
    };

    if (loading) return <div className="text-neutral-500 text-xs animate-pulse">Araç planı yükleniyor...</div>;

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Truck size={16} className="text-green-400" /> İntikal ve Araç Planı
                </h3>
                {(isAdmin && isActive) && (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-1 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5"
                    >
                        <Plus size={12} /> Araç Ekle
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 italic col-span-2">Henüz araca atanmış plan yok.</p>
                ) : (
                    vehicles.map((v) => (
                        <div key={v.id} className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white px-2 py-1 rounded text-black font-mono font-bold text-xs uppercase shadow-sm">
                                        {v.plate}
                                    </div>
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest">{v.type}</span>
                                </div>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                                    {v.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {v.assignments.map((a: any) => (
                                    <div key={a.id} className="flex justify-between items-center bg-black/30 rounded p-2 text-xs border border-white/5">
                                        <div className="flex items-center gap-2">
                                            {a.role === 'Sürücü' && <Navigation size={12} className="text-amber-400" />}
                                            {a.role === 'Araç Amiri' && <ShieldAlert size={12} className="text-red-400" />}
                                            {a.role === 'Ekip Üyesi' && <UserPlus size={12} className="text-blue-400" />}
                                            <span className="text-white font-bold">{a.member.fullName}</span>
                                        </div>
                                        <span className="text-[9px] text-neutral-500 uppercase">{a.role}</span>
                                    </div>
                                ))}
                            </div>

                            {(isAdmin && isActive) && (
                                <div className="pt-2 border-t border-white/10 flex gap-2">
                                    <SearchableSelect 
                                        options={[
                                            ...membersData.map((m: any) => ({ value: `${m.id}|Sürücü`, label: m.fullName, group: 'Sürücü Yap' })),
                                            ...membersData.map((m: any) => ({ value: `${m.id}|Araç Amiri`, label: m.fullName, group: 'Araç Amiri Yap' })),
                                            ...membersData.map((m: any) => ({ value: `${m.id}|Ekip Üyesi`, label: m.fullName, group: 'Ekip Üyesi Ekle' }))
                                        ]}
                                        placeholder="+ Personel Ata"
                                        onSelect={(val) => {
                                            const [mId, r] = val.split('|');
                                            handleAssignMember(v.id, mId, r);
                                        }}
                                        className="flex-1"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal for new vehicle */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="bg-[#0a1120] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-6"
                        >
                            <h3 className="text-white font-black uppercase tracking-wider text-sm flex items-center gap-2">
                                <Truck size={16} className="text-green-400" /> Araca Ekle
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Araç Plakası</label>
                                    <input 
                                        type="text" 
                                        value={newVehicle.plate} 
                                        onChange={e => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm font-mono font-bold focus:border-green-500 outline-none"
                                        placeholder="35 XYZ 123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">Araç Tipi</label>
                                    <select 
                                        value={newVehicle.type} 
                                        onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500"
                                    >
                                        <option value="Pickup">Pickup</option>
                                        <option value="Kamyonet">Kamyonet</option>
                                        <option value="Binek">Binek Araç</option>
                                        <option value="Treyler">Treyler</option>
                                        <option value="Minibüs">Minibüs</option>
                                        <option value="4x4 Off-Road">4x4 Off-Road</option>
                                        <option value="Ambulans">Ambulans</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleAddVehicle}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
