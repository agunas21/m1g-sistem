import { Users, Plus, Clock, Trash, MapPin, Compass } from "lucide-react";

export default function TeamListPanel({
    selectedOp,
    membersData,
    inventoryData,
    isAdmin,
    setShowAddTeamModal,
    calculateTeamWorkingHours,
    formatDuration,
    initiateReturnToCamp,
    setDeployTeamIdForTarget,
    setDeployTargetLocation,
    handleRemoveTeam,
    handleHardDeleteTeam,
    removeMemberFromTeam,
    setTeamLeader,
    assignMemberToTeam,
    removeEquipmentFromTeam,
    assignEquipmentToTeam
}: any) {
    const teams = selectedOp?.teams || [];
    const baseCamp = selectedOp?.baseCamp || { members: [], equipment: [] };

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {teams.map((team: any) => {
                const isDeployed = team.status === "Sahada";
                const workingHrs = calculateTeamWorkingHours(team);
                const teamMembers = team.members || [];
                const teamDeployments = team.deployments || [];
                const teamEquipment = team.equipment || [];
                
                const leader = teamMembers.find((m: any) => m.role === "Lider");
                const members = teamMembers.filter((m: any) => m.role !== "Lider");

                const lastDep = teamDeployments[teamDeployments.length - 1];
                const currentTarget = lastDep?.targetLocation || "Genel Sektör";
                
                return (
                    <div 
                        key={team.id}
                        className={`p-5 rounded-3xl border transition-all ${
                            isDeployed 
                            ? 'bg-red-950/10 border-red-500/30' 
                            : 'bg-white/5 border-white/5'
                        }`}
                    >
                        <div className="flex justify-between items-start border-b border-white/5 pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-white font-bold text-sm">{team.name}</h4>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                        isDeployed ? 'bg-red-500/20 text-red-400 border border-red-500/10 ' : 'bg-blue-500/20 text-blue-400 border border-blue-500/10'
                                    }`}>
                                        {team.status}
                                    </span>
                                    
                                    {/* Dynamic ticking stopwatch for active deployed/resting teams */}
                                    {isDeployed ? (
                                        <span className="text-[10px] font-bold text-red-500 font-mono flex items-center gap-1">
                                            <Clock size={10} className="animate-spin-slow" /> {formatDuration(lastDep?.deployTime)}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-blue-400 font-mono flex items-center gap-1">
                                            <Clock size={10} /> {formatDuration((lastDep && lastDep.returnTime) ? lastDep.returnTime : selectedOp?.startTime)}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[9px] text-neutral-500 font-mono mt-0.5 block">
                                    Tim ID: {team.id} • Deplase: {workingHrs} saat • Bölge: <span className="text-red-400 font-bold">{isDeployed ? currentTarget : 'Kampta'}</span>
                                </span>
                            </div>

                            {/* Team actions */}
                            {selectedOp?.status === "Aktif" && (
                                <div className="flex gap-2 flex-wrap items-center">
                                    {isDeployed ? (
                                        <button 
                                            onClick={() => initiateReturnToCamp(team.id)}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase"
                                        >
                                            ⛺ Kampa Çek / Debrief
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setDeployTeamIdForTarget(team.id);
                                                setDeployTargetLocation("");
                                            }}
                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-black uppercase"
                                        >
                                            🚀 Sahaya Çıkar
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleRemoveTeam(team.id)}
                                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
                                        title="Timi Sil"
                                    >
                                        <Trash size={12} />
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleHardDeleteTeam(team.id)}
                                            className="px-2 py-1 bg-red-950/40 hover:bg-red-900 border border-red-900/30 text-red-400 hover:text-white rounded text-[9px] font-black uppercase transition-colors"
                                            title="Timi Veritabanından Kalıcı Olarak Sil (Hard Delete)"
                                        >
                                            Kalıcı Yok Et
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Leader & Member Roster inside Team */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase block tracking-wider">Tim Personeli ({teamMembers.length})</span>
                                
                                {/* Leader row */}
                                {leader && (
                                    <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-red-500/10">
                                        <div className="flex items-center gap-2 font-bold text-red-400">
                                            <span className="text-[10px]">👑</span>
                                            <span>{membersData.find((m: any) => m.id === leader.id)?.fullName || leader.id} (Lider)</span>
                                        </div>
                                        {selectedOp?.status === "Aktif" && (
                                            <button onClick={() => removeMemberFromTeam(team.id, leader.id)} className="text-[10px] text-neutral-500 hover:text-red-400">Kaldır</button>
                                        )}
                                    </div>
                                )}

                                {/* Members rows */}
                                {members.map((m: any) => (
                                    <div key={m.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-neutral-300">{membersData.find((mem: any) => mem.id === m.id)?.fullName || m.id}</span>
                                        {selectedOp?.status === "Aktif" && (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setTeamLeader(team.id, m.id)} className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded hover:bg-red-500/20 font-bold">Lider Yap</button>
                                                <button onClick={() => removeMemberFromTeam(team.id, m.id)} className="text-[10px] text-neutral-500 hover:text-red-400">Kaldır</button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {teamMembers.length === 0 && (
                                    <p className="text-[10px] text-neutral-600 italic">Ekibe üye atanmadı.</p>
                                )}

                                {/* Add member button trigger */}
                                {selectedOp?.status === "Aktif" && (
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const role = teamMembers.length === 0 ? "Lider" : "Üye";
                                                assignMemberToTeam(team.id, e.target.value, role);
                                                e.target.value = "";
                                            }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400 p-1.5 mt-2 cursor-pointer outline-none"
                                    >
                                        <option value="">+ Personel Ekle (Base Havuzundan)</option>
                                        {(baseCamp.members || []).map((mId: string) => (
                                            <option key={mId} value={mId}>{membersData.find((m: any) => m.id === mId)?.fullName || mId}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Team Equipment Zimmet */}
                            <div className="space-y-2">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase block tracking-wider">Zimmetli Ekipmanlar ({teamEquipment.length})</span>
                                <div className="space-y-1">
                                    {teamEquipment.map((eqId: string) => {
                                        const item = inventoryData.find((i: any) => i.id === eqId);
                                        return (
                                            <div key={eqId} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                                                <span className="text-neutral-300 font-mono">{item?.name || eqId}</span>
                                                {selectedOp?.status === "Aktif" && (
                                                    <button onClick={() => removeEquipmentFromTeam(team.id, eqId)} className="text-[10px] text-neutral-500 hover:text-red-400">İade</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {teamEquipment.length === 0 && (
                                        <p className="text-[10px] text-neutral-600 italic">Zimmetli malzeme bulunmuyor.</p>
                                    )}
                                </div>

                                {/* Add equipment button trigger */}
                                {selectedOp?.status === "Aktif" && (
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                assignEquipmentToTeam(team.id, e.target.value);
                                                e.target.value = "";
                                            }
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg text-xs text-neutral-400 p-1.5 mt-2 cursor-pointer outline-none"
                                    >
                                        <option value="">+ Ekipman Ata (Base Havuzundan)</option>
                                        {(baseCamp.equipment || []).map((eqId: string) => (
                                            <option key={eqId} value={eqId}>{inventoryData.find((i: any) => i.id === eqId)?.name || eqId}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Last deployment status trace */}
                        {teamDeployments.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-neutral-500 flex flex-wrap gap-4 font-mono">
                                <span>Son Çıkış: {lastDep?.deployTime}</span>

                                {lastDep?.returnTime && (
                                    <>
                                        <span>Son Giriş: {lastDep.returnTime}</span>
                                        <span>Durum: <span className={
                                            lastDep.pulse === 'Yeşil' ? 'text-emerald-400 font-bold' :
                                            lastDep.pulse === 'Sarı' ? 'text-amber-400 font-bold' : 'text-red-500 font-bold'
                                        }>{lastDep.pulse || 'Bilinmiyor'}</span></span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {teams.length === 0 && (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-3xl">
                    <Users size={32} className="mx-auto text-neutral-600 mb-2" />
                    <p className="text-xs text-neutral-500">Kayıtlı tim bulunmuyor. Yeni bir tim ekleyin.</p>
                </div>
            )}
        </div>
    );
}
