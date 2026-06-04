"use client";

import { PhoneCall } from "lucide-react";
import { motion } from "framer-motion";

import { usePathname } from "next/navigation";

export default function FloatingEmergencyButton() {
    const pathname = usePathname();
    if (pathname?.startsWith("/admin")) return null;
    return (
        <motion.a
            href="tel:112"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.5, type: "spring" }}
            className="fixed bottom-6 right-6 z-50 bg-red-600 text-white rounded-full p-4 shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] hover:bg-red-500 transition-all group flex items-center gap-3 overflow-hidden"
        >
            <div className="relative">
                <PhoneCall size={28} className="animate-pulse" />
            </div>
            <span className="max-w-0 overflow-hidden font-bold tracking-wide whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out">
                ACİL İHBAR (112)
            </span>
        </motion.a>
    );
}
