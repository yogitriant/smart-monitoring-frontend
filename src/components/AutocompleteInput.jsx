import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X } from "lucide-react";

export default function AutocompleteInput({ 
    options,      // Expecting array of strings ["A"] OR objects [{label: "A", value: "A"}]
    value,        // Currently selected value (string)
    onChange,     // Callback onChange(string)
    placeholder = "Pilih atau ketik...", 
    disabled = false,
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Convert all options to { label, value } format internally for easier handling
    const normalizedOptions = useMemo(() => {
        return options.map(opt => {
            if (typeof opt === "object" && opt !== null) return opt;
            return { label: String(opt), value: String(opt) };
        });
    }, [options]);

    // Find the label for the current value
    const currentLabel = useMemo(() => {
        if (!value) return "";
        const found = normalizedOptions.find(o => o.value === value);
        return found ? found.label : String(value);
    }, [value, normalizedOptions]);

    const [searchTerm, setSearchTerm] = useState(currentLabel);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Initial sync
    useEffect(() => {
        setSearchTerm(currentLabel);
    }, [currentLabel, isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Snap back to strict matched value on blur if invalid typed
                setSearchTerm(currentLabel); 
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [currentLabel]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return normalizedOptions;
        return normalizedOptions.filter((opt) => 
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [normalizedOptions, searchTerm]);

    const handleSelect = (opt) => {
        onChange(opt.value);
        setSearchTerm(opt.label);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
        inputRef.current?.focus();
        setIsOpen(true);
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const inputClass = `w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${className} ${disabled ? "opacity-60 cursor-not-allowed bg-zinc-50" : ""}`;

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => { if (!disabled) setIsOpen(true); }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`${inputClass} pr-8`}
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {value && !disabled ? (
                        <button type="button" onClick={handleClear} className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded">
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <ChevronDown className={`w-4 h-4 text-zinc-400 pointer-events-none transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    )}
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-2.5 text-sm text-zinc-500 text-center">Data tidak ditemukan</div>
                    ) : (
                        <ul className="py-1">
                            {filteredOptions.map((opt, i) => (
                                <li
                                    key={i}
                                    onClick={() => handleSelect(opt)}
                                    className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-primary-50 hover:text-primary-700 transition-colors ${value === opt.value ? "bg-primary-50 text-primary-700 font-medium" : "text-zinc-700"}`}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
