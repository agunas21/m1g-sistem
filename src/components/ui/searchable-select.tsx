import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
    group?: string;
}

interface SearchableSelectProps {
    options: Option[];
    placeholder?: string;
    onSelect?: (value: string) => void;
    onChange?: (value: string) => void;
    value?: string;
    className?: string;
}

export function SearchableSelect({ 
    options, 
    placeholder = "Seçiniz...", 
    onSelect, 
    onChange, 
    value, 
    className = "" 
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (val: string) => {
        if (onSelect) onSelect(val);
        if (onChange) onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group options
    const groupedOptions = filteredOptions.reduce((acc, opt) => {
        const group = opt.group || 'default';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
    }, {} as Record<string, Option[]>);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div 
                className="bg-black border border-white/10 rounded p-1.5 text-[10px] text-white w-full cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? "text-white font-medium" : "text-neutral-400"}>{displayText}</span>
                <ChevronDown size={12} className="text-neutral-500" />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 w-full mt-1 bg-[#0a1120] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                    >
                        <div className="p-2 border-b border-white/5 flex items-center gap-2">
                            <Search size={12} className="text-neutral-500" />
                            <input 
                                type="text"
                                autoFocus
                                className="bg-transparent border-none outline-none text-[10px] text-white w-full placeholder-neutral-600"
                                placeholder="Kişi Ara..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="p-2 text-[10px] text-neutral-500 italic text-center">Sonuç bulunamadı</div>
                            ) : (
                                Object.entries(groupedOptions).map(([group, opts]) => (
                                    <div key={group}>
                                        {group !== 'default' && (
                                            <div className="px-2 py-1 text-[9px] font-bold text-neutral-500 uppercase tracking-widest bg-white/5 border-y border-white/5">
                                                {group}
                                            </div>
                                        )}
                                        {opts.map(opt => (
                                            <div 
                                                key={opt.value}
                                                className="p-2 text-[10px] text-white hover:bg-white/10 cursor-pointer transition-colors"
                                                onClick={() => handleSelect(opt.value)}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
