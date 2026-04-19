import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaCheck, FaHistory, FaTimes } from "react-icons/fa";

/**
 * Format helper for time strings
 */
const formatTime = (h, m, s = "00") => {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Parse helper for time strings
 */
const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return { h: 9, m: 0, s: 0 };
  const parts = timeStr.split(":");
  return {
    h: parseInt(parts[0]) || 0,
    m: parseInt(parts[1]) || 0,
    s: parseInt(parts[2]) || 0
  };
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const PRESETS = [
  { label: "09:00 AM", value: "09:00:00" },
  { label: "10:00 AM", value: "10:00:00" },
  { label: "01:00 PM", value: "13:00:00" },
  { label: "06:00 PM", value: "18:00:00" },
];

const TimeColumn = ({ items, selected, onSelect, label, columnRef }) => {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black text-slate-400 border-b border-slate-100 w-full text-center pb-1 mb-1.5 uppercase tracking-tighter">{label}</span>
      <div 
        ref={columnRef}
        className="h-28 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth w-10 bg-slate-50/50 rounded-lg border border-slate-100"
      >
        <div className="py-10">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full py-1 text-xs font-bold transition-all duration-150 flex items-center justify-center snap-center
                ${selected === item 
                  ? "bg-indigo-600 text-white shadow-sm scale-105 rounded-md mx-0.5 w-[calc(100%-4px)]" 
                  : "text-slate-400 hover:text-indigo-600"}
              `}
            >
              {String(item).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TimePicker = ({ value, onApply, onClose }) => {
  const { h: initialH, m: initialM, s: initialS } = parseTime(value);
  const [h, setH] = useState(initialH);
  const [m, setM] = useState(initialM);
  
  const hRef = useRef(null);
  const mRef = useRef(null);

  useEffect(() => {
    const scrollToSelected = () => {
      if (hRef.current) {
        const btn = hRef.current.children[0].children[h];
        if (btn) hRef.current.scrollTop = btn.offsetTop - hRef.current.offsetTop - 45;
      }
      if (mRef.current) {
        const btn = mRef.current.children[0].children[m];
        if (btn) mRef.current.scrollTop = btn.offsetTop - mRef.current.offsetTop - 45;
      }
    };
    
    const timer = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(timer);
  }, [h, m]);

  const handleApply = () => {
    const finalTime = formatTime(h, m, initialS);
    onApply(finalTime);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden w-full max-w-[200px] flex flex-col font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <FaClock size={11} className="text-indigo-500 shrink-0" />
          <span className="font-bold text-[9px] uppercase tracking-wider text-slate-500 truncate">Time</span>
        </div>
        <div className="text-sm font-mono font-bold tracking-tighter text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
        </div>
      </div>

      <div className="p-3 bg-white">
        <div className="mb-3 flex flex-wrap gap-1">
          {[
            { l: "09:00", v: "09:00:00" },
            { l: "10:00", v: "10:00:00" },
            { l: "18:00", v: "18:00:00" },
            { l: "19:00", v: "19:00:00" }
          ].map(p => (
            <button
              key={p.v + p.l}
              type="button"
              onClick={() => {
                const { h, m } = parseTime(p.v);
                setH(h); setM(m);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded text-[9px] font-bold text-slate-500 transition-colors"
            >
              {p.l}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
          <TimeColumn label="H" items={HOURS} selected={h} onSelect={setH} columnRef={hRef} />
          <div className="pt-5 text-lg font-black text-slate-200 self-start">:</div>
          <TimeColumn label="M" items={MINUTES} selected={m} onSelect={setM} columnRef={mRef} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center active:scale-90 border border-slate-200"
            title="Close"
          >
            <FaTimes size={10} />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-8 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95 gap-1.5"
            title="Save"
          >
            <FaCheck size={10} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Save</span>
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export const TimePickerField = ({ 
  value, 
  onChange, 
  placeholder = "Time", 
  label,
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const displayValue = (value && typeof value === 'string') ? value.substring(0, 5) : "";

  return (
    <div className={`flex flex-col min-w-0 ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div 
          onClick={() => setIsOpen(true)}
          className={`
            cursor-pointer flex items-center gap-2 px-2 h-[32px]
            bg-white border rounded-lg transition-all duration-200 group
            ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}
          `}
        >
          <div className={`p-1 rounded-md transition-all ${value ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
            <FaClock size={10} />
          </div>
          <span className={`text-xs font-bold flex-1 ${value ? 'text-slate-900' : 'text-slate-400'}`}>
            {displayValue || placeholder}
          </span>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 z-[100] w-full min-w-[200px]"
            >
              <TimePicker 
                value={value} 
                onApply={(val) => {
                  onChange(val);
                  setIsOpen(false);
                }}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TimePickerField;
