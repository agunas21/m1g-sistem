"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
                    style={{ backgroundColor: '#000000' }}
                >
                    <style dangerouslySetInnerHTML={{__html: `
                        /* ── Beams ── */
                        .beam {
                            position: absolute;
                            top: -20%;
                            width: 3px;
                            height: 80vh;
                            border-radius: 9999px;
                            opacity: 0;
                            animation: beamFall linear infinite;
                            transform-origin: top center;
                        }
                        @keyframes beamFall {
                            0%   { transform: translateY(-100%) rotate(-30deg); opacity: 0; }
                            10%  { opacity: 1; }
                            90%  { opacity: 0.6; }
                            100% { transform: translateY(200vh) rotate(-30deg); opacity: 0; }
                        }

                        /* ── Fallback ── */
                        .splash-fallback { animation: fallbackFadeOut 3.5s forwards; }
                        @keyframes fallbackFadeOut {
                            0%   { opacity:1; visibility:visible; }
                            80%  { opacity:1; visibility:visible; }
                            99%  { opacity:0; visibility:visible; }
                            100% { opacity:0; visibility:hidden; pointer-events:none; }
                        }

                        /* ── Loader ── */
                        .loader-svg {
                            color: #ef4444;
                            filter: drop-shadow(0 0 8px rgba(239,68,68,0.6));
                        }
                        .dash { animation: dashArray 2s ease-in-out infinite, dashOffset 2s linear infinite; }
                        .spin {
                            animation: spinDashArray 2s ease-in-out infinite, spin 8s ease-in-out infinite, dashOffset 2s linear infinite;
                            transform-origin: center;
                        }
                        @keyframes dashArray {
                            0%   { stroke-dasharray: 0 1 359 0; }
                            50%  { stroke-dasharray: 0 359 1 0; }
                            100% { stroke-dasharray: 359 1 0 0; }
                        }
                        @keyframes spinDashArray {
                            0%   { stroke-dasharray: 270 90; }
                            50%  { stroke-dasharray: 0 360; }
                            100% { stroke-dasharray: 270 90; }
                        }
                        @keyframes dashOffset {
                            0%   { stroke-dashoffset: 365; }
                            100% { stroke-dashoffset: 5; }
                        }
                        @keyframes spin {
                            0%         { rotate: 0deg; }
                            12.5%, 25% { rotate: 270deg; }
                            37.5%, 50% { rotate: 540deg; }
                            62.5%, 75% { rotate: 810deg; }
                            87.5%, 100%{ rotate: 1080deg; }
                        }

                        /* ── Text fill ── */
                        .splash-text-container {
                            --text-stroke-color: rgba(255,255,255,0.15);
                            --animation-color: #ffffff;
                            --fs-size: clamp(0.65rem, 2.5vw, 2.2rem);
                            letter-spacing: clamp(0.5px, 0.2vw, 2px);
                            font-size: var(--fs-size);
                            font-weight: 900;
                            position: relative;
                            text-transform: uppercase;
                            color: transparent;
                            -webkit-text-stroke: 1px var(--text-stroke-color);
                            text-align: center;
                            white-space: nowrap;
                        }
                        .splash-hover-text {
                            position: absolute;
                            box-sizing: border-box;
                            color: var(--animation-color);
                            width: 0%;
                            inset: 0;
                            border-right: 3px solid var(--animation-color);
                            overflow: hidden;
                            animation: fillText 2s ease-in-out forwards;
                            animation-delay: 0.5s;
                            -webkit-text-stroke: 1px var(--animation-color);
                        }
                        @keyframes fillText {
                            0%   { width: 0%; }
                            100% { width: 100%; filter: drop-shadow(0 0 6px rgba(255,255,255,0.3)); }
                        }
                    `}} />

                    {/* ── Animated beams (CSS only, no canvas) ── */}
                    {[
                        { left: '8%',  delay: '0s',    dur: '3.5s', color: '#dc2626', blur: '6px',  w: '2px'  },
                        { left: '18%', delay: '0.6s',  dur: '4.2s', color: '#ef4444', blur: '8px',  w: '3px'  },
                        { left: '28%', delay: '1.1s',  dur: '3.8s', color: '#b91c1c', blur: '5px',  w: '2px'  },
                        { left: '38%', delay: '0.3s',  dur: '5s',   color: '#f87171', blur: '10px', w: '4px'  },
                        { left: '50%', delay: '1.4s',  dur: '3.2s', color: '#dc2626', blur: '6px',  w: '2px'  },
                        { left: '60%', delay: '0.8s',  dur: '4.5s', color: '#ef4444', blur: '8px',  w: '3px'  },
                        { left: '70%', delay: '0.2s',  dur: '3.9s', color: '#991b1b', blur: '5px',  w: '2px'  },
                        { left: '80%', delay: '1.7s',  dur: '4.1s', color: '#fca5a5', blur: '7px',  w: '2px'  },
                        { left: '90%', delay: '0.5s',  dur: '3.6s', color: '#dc2626', blur: '9px',  w: '4px'  },
                        { left: '55%', delay: '2s',    dur: '4.8s', color: '#ef4444', blur: '6px',  w: '2px'  },
                        { left: '33%', delay: '2.3s',  dur: '3.3s', color: '#b91c1c', blur: '8px',  w: '3px'  },
                        { left: '72%', delay: '1.9s',  dur: '4s',   color: '#f87171', blur: '5px',  w: '2px'  },
                    ].map((b, i) => (
                        <div
                            key={i}
                            className="beam"
                            style={{
                                left: b.left,
                                width: b.w,
                                animationDelay: b.delay,
                                animationDuration: b.dur,
                                background: `linear-gradient(to bottom, transparent, ${b.color}, transparent)`,
                                filter: `blur(${b.blur})`,
                                opacity: 0.85,
                            }}
                        />
                    ))}

                    {/* ── Radial glow center ── */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(185,28,28,0.18) 0%, transparent 70%)',
                        }}
                    />

                    {/* ── Content ── */}
                    <div className="splash-fallback z-10 flex flex-col items-center justify-center gap-10 relative">
                        {/* Logo + spinner */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="relative flex items-center justify-center"
                        >
                            <img
                                src="/m1g-logo.png"
                                alt="M1G Logo"
                                className="w-[65px] h-[65px] md:w-[80px] md:h-[80px] object-contain absolute z-10"
                            />
                            <svg className="loader-svg" viewBox="0 0 120 120" style={{ width: '140px', height: '140px' }}>
                                <circle
                                    cx="60" cy="60" r="57"
                                    fill="none" stroke="currentColor" strokeWidth="3"
                                    strokeLinecap="round" pathLength="360"
                                    className="dash spin"
                                />
                            </svg>
                        </motion.div>

                        {/* Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="flex flex-col items-center max-w-full overflow-hidden mt-4"
                        >
                            <div className="splash-text-container">
                                <span className="splash-hover-text">
                                    M1G ARAMA KURTARMA
                                </span>
                                M1G ARAMA KURTARMA
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
