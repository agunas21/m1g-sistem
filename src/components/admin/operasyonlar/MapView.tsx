import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

const OfflineMap = dynamic(() => import('@/components/map/OfflineMap'), { ssr: false, loading: () => <div className="h-96 flex items-center justify-center bg-[#050B14] text-neutral-500 border border-white/5 rounded-3xl z-0">Harita Yükleniyor...</div> });

export default function MapView({ selectedOp, membersData, setNewPinPos }: any) {
    const teams = selectedOp?.teams || [];
    const baseCamp = selectedOp?.baseCamp || { location: null, name: "" };

    return (
        <div className="bg-[#050B14] border border-white/5 rounded-3xl p-2 relative shadow-2xl h-96 w-full overflow-hidden no-print z-0">
            <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none">
                <MapPin size={14} className="text-red-500" />
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Canlı Saha Takibi (Aşama 2)</span>
            </div>
            <OfflineMap 
                teams={teams.map((t: any) => {
                    const lastDep = t.deployments?.[t.deployments?.length - 1];
                    const loc = lastDep?.targetLocation || t.location;
                    return {
                        id: t.id,
                        name: t.name,
                        status: t.status,
                        location: loc ? [loc.lat, loc.lng] : undefined
                    };
                })} 
                members={teams.flatMap((t: any) => 
                    (t.members || []).filter((m: any) => m.lastLocation).map((m: any) => ({
                        id: m.id,
                        name: membersData?.find((mem: any) => mem.id === m.id)?.fullName || m.id,
                        teamName: t.name,
                        role: m.role,
                        location: [m.lastLocation.lat, m.lastLocation.lng],
                        path: m.path?.map((p: any) => [p.lat, p.lng]) || []
                    }))
                ) || []}
                pins={selectedOp?.pins || []}
                baseCampLocation={baseCamp.location ? [baseCamp.location.lat, baseCamp.location.lng] : undefined}
                onMapClick={(lat: number, lng: number) => {
                    if(selectedOp?.status === 'Aktif') {
                        setNewPinPos([lat, lng]);
                    }
                }}
            />
        </div>
    );
}
