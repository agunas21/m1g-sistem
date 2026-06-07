"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Already installed check
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsReadyForInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const downloadApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsReadyForInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!isReadyForInstall || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-2xl p-4 z-[9999]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">M1G Uygulamasını Yükle</h3>
              <p className="text-neutral-400 text-xs mt-1">İnternetsiz (Offline) çalışabilmesi için telefonunuza veya bilgisayarınıza kurun.</p>
            </div>
          </div>
          <button onClick={() => setIsDismissed(true)} className="text-neutral-500 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>
        <button 
          onClick={downloadApp}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl transition-colors text-sm"
        >
          Hemen Yükle
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
