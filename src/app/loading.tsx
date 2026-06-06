import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[99999]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Spinner */}
        <div className="w-20 h-20 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
        
        {/* Loading Text */}
        <div className="flex flex-col items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-[0.3em] animate-pulse">
                Sistem Yükleniyor
            </h2>
            <div className="flex items-center gap-1 opacity-60">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
