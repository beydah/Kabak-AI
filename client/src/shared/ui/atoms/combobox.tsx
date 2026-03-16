import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface ComboboxOption {
    label: string;
    value: string;
}

interface ComboboxProps {
    label?: string;
    value: string;
    options: ComboboxOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const F_Combobox: React.FC<ComboboxProps> = ({
    label,
    value,
    options,
    onChange,
    placeholder = "Select...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle Click Away
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`space-y-1 relative z-10 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-semibold text-secondary uppercase block">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Trigger Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm border transition-all duration-200 ${isOpen
                            ? 'border-primary/50 ring-2 ring-primary/10 bg-white dark:bg-[#1A1A1A] text-primary'
                            : 'border-secondary/10 bg-secondary/5 hover:border-secondary/30 text-text-light dark:text-text-dark'
                        }`}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : 'text-secondary'}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-[300] w-full mt-1 overflow-hidden bg-white dark:bg-[#121212] border border-secondary/30 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-secondary/20 hover:scrollbar-thumb-secondary/40">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <li key={option.value}>
                                        <button
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${isSelected
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-text-light dark:text-text-dark hover:bg-secondary/5'
                                                }`}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && <Check size={14} className="text-primary" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
