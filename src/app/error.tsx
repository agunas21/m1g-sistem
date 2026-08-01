"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Sayfa Yüklenirken Bir Hata Oluştu</h2>
      <p className="text-neutral-400 text-xs font-mono max-w-md mb-6 bg-black/50 p-3 rounded-xl border border-white/10 break-all">
        {error?.message || "Beklenmeyen bir istemci hatası meydana geldi."}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-red-600/30"
      >
        <RefreshCw size={16} /> Sayfayı Yeniden Yükle
      </button>
    </div>
  );
}
