import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
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

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const AMPM = ["AM", "PM"];

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
        className="h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth w-16 bg-slate-50/30 rounded-xl border border-slate-100/50"
      >
        <div className="py-12">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full py-2 text-[11px] font-bold transition-all duration-200 flex items-center justify-center snap-center
                ${selected === item
                  ? "bg-indigo-600 text-white shadow-md scale-110 rounded-lg mx-1.5 w-[calc(100%-12px)]"
                  : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100/50"}
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
  const { h: initialH24, m: initialM, s: initialS } = parseTime(value);

  // Convert 24h to 12h + AM/PM
  const initialAMPM = initialH24 >= 12 ? "PM" : "AM";
  const initialH12 = initialH24 % 12 || 12;

  const [h, setH] = useState(initialH12);
  const [m, setM] = useState(initialM);
  const [ampm, setAmpm] = useState(initialAMPM);

  const hRef = useRef(null);
  const mRef = useRef(null);
  const ampmRef = useRef(null);

  useEffect(() => {
    const scrollToSelected = () => {
      if (hRef.current) {
        const idx = HOURS.indexOf(h);
        const btn = hRef.current.children[0].children[idx];
        if (btn) hRef.current.scrollTop = btn.offsetTop - hRef.current.offsetTop - 45;
      }
      if (mRef.current) {
        const btn = mRef.current.children[0].children[m];
        if (btn) mRef.current.scrollTop = btn.offsetTop - mRef.current.offsetTop - 45;
      }
      if (ampmRef.current) {
        const idx = AMPM.indexOf(ampm);
        const btn = ampmRef.current.children[0].children[idx];
        if (btn) ampmRef.current.scrollTop = btn.offsetTop - ampmRef.current.offsetTop - 45;
      }
    };

    const timer = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(timer);
  }, [h, m, ampm]);

  const handleApply = () => {
    let finalH = h;
    if (ampm === "PM" && h < 12) finalH += 12;
    if (ampm === "AM" && h === 12) finalH = 0;
    const finalTime = formatTime(finalH, m, initialS);
    onApply(finalTime);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden w-full max-w-[300px] max-h-[400px] flex flex-col font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <FaClock size={14} className="text-indigo-600" />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">Set Time</span>
        </div>
        <div className="text-[11px] font-mono font-black tracking-tight text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm uppercase">
          {h % 12 || 12}:{String(m).padStart(2, "0")} {h >= 12 ? 'PM' : 'AM'}
        </div>
      </div>

      <div className="p-4 bg-white">
        <div className="mb-3 flex flex-wrap gap-1">
          {[
            { h: 9, m: "00", v: "09:00:00" },
            { h: 10, m: "00", v: "10:00:00" },
            { h: 13, m: "00", v: "13:00:00" },
            { h: 18, m: "00", v: "18:00:00" },
            { h: 19, m: "00", v: "19:00:00" }
          ].map(p => (
            <button
              key={p.v + p.l}
              type="button"
              onClick={() => {
                const { h: h24, m: mm } = parseTime(p.v);
                setH(h24 % 12 || 12);
                setM(mm);
                setAmpm(h24 >= 12 ? "PM" : "AM");
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded text-[9px] font-bold text-slate-500 transition-colors uppercase"
            >
              {p.h % 12 || 12}:{p.m} {p.h >= 12 ? 'PM' : 'AM'}
            </button>
          ))}
        </div>

        <div className="flex justify-center items-center gap-2 mb-4 py-3 bg-slate-50/30 rounded-2xl border border-slate-100">
          <TimeColumn label="Hour" items={HOURS} selected={h} onSelect={setH} columnRef={hRef} />
          <div className="pt-8 text-2xl font-black text-slate-200">:</div>
          <TimeColumn label="Min" items={MINUTES} selected={m} onSelect={setM} columnRef={mRef} />
          <div className="w-px h-10 bg-slate-200/50 mx-1" />
          <TimeColumn label="Period" items={AMPM} selected={ampm} onSelect={setAmpm} columnRef={ampmRef} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center active:scale-90 border border-slate-100"
            title="Close"
          >
            <FaTimes size={12} />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95 gap-2 group"
            title="Save"
          >
            <FaCheck size={12} />
            <span className="text-[11px] font-black uppercase tracking-wider">Save Time</span>
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
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handlePointerDown = (event) => {
        if (
          popoverRef.current?.contains(event.target) ||
          triggerRef.current?.contains(event.target)
        ) {
          return;
        }
        setIsOpen(false);
      };

      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const toAMPM = (timeStr) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const displayValue = value ? toAMPM(value) : "";

  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      {label && (
        <label className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          ref={triggerRef}
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

        {isOpen &&
          createPortal(
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 overflow-hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
                onClick={() => setIsOpen(false)}
                style={{ animation: "fadeIn 0.2s ease-out" }}
              />

              {/* Popover/Modal */}
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-[10002]"
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

              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default TimePickerField;
