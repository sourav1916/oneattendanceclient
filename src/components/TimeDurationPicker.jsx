import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaClock, FaHourglassHalf, FaTimes } from "react-icons/fa";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const DURATION_HOURS = Array.from({ length: 24 }, (_, i) => i);
const PERIODS = ["AM", "PM"];

const pad = (value) => String(value).padStart(2, "0");

const format12h = (h, m) => {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${pad(h12)}:${pad(m)} ${ampm}`;
};

const parseTimeValue = (value) => {
  if (!value || typeof value !== "string") return { hours: 9, minutes: 0 };
  
  const normalized = value.trim().toUpperCase();
  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2]);
    const period = ampmMatch[3];
    
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  }

  const [hours = "09", minutes = "00"] = value.split(":");
  return {
    hours: Number.parseInt(hours, 10) || 0,
    minutes: Number.parseInt(minutes, 10) || 0,
  };
};

const parseDurationValue = (value) => {
  if (typeof value === "number") return Math.max(0, value);
  if (!value || typeof value !== "string") return 30;

  const parts = value.split(":");
  if (parts.length >= 2) {
    const hours = Number.parseInt(parts[0], 10) || 0;
    const minutes = Number.parseInt(parts[1], 10) || 0;
    return Math.max(0, hours * 60 + minutes);
  }

  const minutes = Number.parseInt(value, 10);
  return Number.isNaN(minutes) ? 30 : Math.max(0, minutes);
};

const formatTimeValue = (hours, minutes) => `${pad(hours)}:${pad(minutes)}:00`;

const formatDurationValue = (minutes) => {
  const totalMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${pad(hours)}:${pad(mins)}`;
};

const formatDurationDisplay = (value) => {
  const totalMinutes = parseDurationValue(value);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (totalMinutes === 0) return "0m";
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

function getAnchoredPopoverPosition(triggerEl, popoverEl, offset = 8) {
  if (!triggerEl || !popoverEl) return null;

  const triggerRect = triggerEl.getBoundingClientRect();
  const popoverRect = popoverEl.getBoundingClientRect();
  const margin = 8;

  let top = triggerRect.bottom + offset;
  let left = triggerRect.left;

  if (left + popoverRect.width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - popoverRect.width - margin);
  }

  if (left < margin) {
    left = margin;
  }

  if (top + popoverRect.height > window.innerHeight - margin) {
    top = Math.max(margin, triggerRect.top - popoverRect.height - offset);
  }

  if (top < margin) {
    top = margin;
  }

  return { top, left };
}

const TimeColumn = ({ items, selected, onSelect, label, columnRef }) => {
  return (
    <div className="flex flex-col items-center flex-1 min-w-[50px]">
      <span className="text-[8px] font-black text-slate-400 border-b border-slate-100 w-full text-center pb-1 mb-1.5 uppercase tracking-tighter">{label}</span>
      <div
        ref={columnRef}
        className="h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory scroll-smooth w-full bg-slate-50/30 rounded-xl border border-slate-100/50"
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
              {typeof item === 'number' ? String(item).padStart(2, "0") : item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TimeDurationPicker = ({ value, onApply, onClose, mode = "time" }) => {
  const isTimeMode = mode === "time";
  
  const initialTime = useMemo(() => parseTimeValue(value), [value]);
  const initialDuration = useMemo(() => parseDurationValue(value), [value]);

  const [hours, setHours] = useState(initialTime.hours % 12 || 12);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [ampm, setAmpm] = useState(initialTime.hours >= 12 ? "PM" : "AM");

  const [durHours, setDurHours] = useState(Math.floor(initialDuration / 60));
  const [durMins, setDurMins] = useState(initialDuration % 60);

  const hRef = useRef(null);
  const mRef = useRef(null);
  const ampmRef = useRef(null);

  const dhRef = useRef(null);
  const dmRef = useRef(null);

  useEffect(() => {
    if (isTimeMode) {
      const next = parseTimeValue(value);
      setHours(next.hours % 12 || 12);
      setMinutes(next.minutes);
      setAmpm(next.hours >= 12 ? "PM" : "AM");
    } else {
      const nextDur = parseDurationValue(value);
      setDurHours(Math.floor(nextDur / 60));
      setDurMins(nextDur % 60);
    }
  }, [mode, value, isTimeMode]);

  useEffect(() => {
    const scrollToSelected = () => {
      if (isTimeMode) {
        if (hRef.current) {
          const idx = HOURS_12.indexOf(hours);
          const btn = hRef.current.children[0]?.children[idx];
          if (btn) hRef.current.scrollTop = btn.offsetTop - hRef.current.offsetTop - 45;
        }
        if (mRef.current) {
          const btn = mRef.current.children[0]?.children[minutes];
          if (btn) mRef.current.scrollTop = btn.offsetTop - mRef.current.offsetTop - 45;
        }
        if (ampmRef.current) {
          const idx = PERIODS.indexOf(ampm);
          const btn = ampmRef.current.children[0]?.children[idx];
          if (btn) ampmRef.current.scrollTop = btn.offsetTop - ampmRef.current.offsetTop - 45;
        }
      } else {
        if (dhRef.current) {
          const btn = dhRef.current.children[0]?.children[durHours];
          if (btn) dhRef.current.scrollTop = btn.offsetTop - dhRef.current.offsetTop - 45;
        }
        if (dmRef.current) {
          const btn = dmRef.current.children[0]?.children[durMins];
          if (btn) dmRef.current.scrollTop = btn.offsetTop - dmRef.current.offsetTop - 45;
        }
      }
    };

    const timer = setTimeout(scrollToSelected, 100);
    return () => clearTimeout(timer);
  }, [hours, minutes, ampm, durHours, durMins, isTimeMode]);

  const handleApply = () => {
    if (isTimeMode) {
      let finalH = hours;
      if (ampm === "PM" && hours < 12) finalH += 12;
      if (ampm === "AM" && hours === 12) finalH = 0;
      onApply(formatTimeValue(finalH, minutes));
    } else {
      onApply(formatDurationValue(durHours * 60 + durMins));
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden w-full max-w-[280px] max-h-[400px] flex flex-col font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            {isTimeMode ? (
              <FaClock size={14} className="text-indigo-600" />
            ) : (
              <FaHourglassHalf size={14} className="text-indigo-600" />
            )}
          </div>
          <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {isTimeMode ? "Set Time" : "Set Duration"}
          </span>
        </div>
        <div className="text-[11px] font-mono font-black tracking-tight text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm uppercase">
          {isTimeMode ? `${pad(hours)}:${pad(minutes)} ${ampm}` : `${durHours}h ${durMins}m`}
        </div>
      </div>

      <div className="p-4 bg-white">
        {isTimeMode ? (
          <div className="flex justify-center items-center gap-1.5 mb-4 py-3 bg-slate-50/30 rounded-2xl border border-slate-100 px-2">
            <TimeColumn label="Hour" items={HOURS_12} selected={hours} onSelect={setHours} columnRef={hRef} />
            <div className="pt-8 text-2xl font-black text-slate-200">:</div>
            <TimeColumn label="Min" items={MINUTES} selected={minutes} onSelect={setMinutes} columnRef={mRef} />
            <div className="w-px h-10 bg-slate-200/50 mx-1" />
            <TimeColumn label="Period" items={PERIODS} selected={ampm} onSelect={setAmpm} columnRef={ampmRef} />
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2 mb-4 py-3 bg-slate-50/30 rounded-2xl border border-slate-100 px-4">
            <TimeColumn label="Hours" items={DURATION_HOURS} selected={durHours} onSelect={setDurHours} columnRef={dhRef} />
            <div className="pt-8 text-xl font-black text-slate-300">h</div>
            <div className="w-px h-10 bg-slate-200/50 mx-2" />
            <TimeColumn label="Mins" items={MINUTES} selected={durMins} onSelect={setDurMins} columnRef={dmRef} />
            <div className="pt-8 text-xl font-black text-slate-300">m</div>
          </div>
        )}

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
            <span className="text-[11px] font-black uppercase tracking-wider">Save</span>
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

export const TimeDurationPickerField = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className = "",
  mode = "time",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const nextPosition = getAnchoredPopoverPosition(triggerRef.current, popoverRef.current);
      if (nextPosition) {
        setPosition(nextPosition);
      }
    };

    const handlePointerDown = (event) => {
      if (popoverRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    updatePosition();
    const rafId = window.requestAnimationFrame(updatePosition);

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const displayValue = useMemo(() => {
    if (mode === "time") {
      if (!value || typeof value !== "string") return "";
      const normalized = value.trim().toUpperCase();
      if (normalized.includes("AM") || normalized.includes("PM")) {
        return value;
      }
      const [h, m] = value.split(":").map(Number);
      return format12h(h || 0, m || 0);
    }
    return formatDurationDisplay(value);
  }, [mode, value]);

  const defaultPlaceholder = mode === "time" ? "Select time" : "Select minutes";

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      {label && (
        <label className="mb-1 text-[10px] font-bold uppercase tracking-tight text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          ref={triggerRef}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
          className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 transition-all duration-200 ${
            isOpen
              ? "border-indigo-500 ring-2 ring-indigo-50"
              : "border-slate-200 bg-white shadow-sm hover:border-indigo-300"
          } ${disabled ? "cursor-not-allowed bg-slate-50 opacity-60 hover:border-slate-200" : ""}`}
        >
          <div className={`rounded-md transition-all ${value ? "text-indigo-600" : "text-slate-400"}`}>
            {mode === "time" ? <FaClock size={12} /> : <FaHourglassHalf size={12} />}
          </div>
          <span className={`flex-1 text-sm ${value ? "text-slate-900" : "text-slate-400"}`}>
            {displayValue || placeholder || defaultPlaceholder}
          </span>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              disabled={disabled}
              className="group/clear rounded-md p-1 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
              title="Clear time"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        {isOpen &&
          createPortal(
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 overflow-hidden">
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity"
                onClick={() => setIsOpen(false)}
                style={{ animation: "fadeIn 0.2s ease-out" }}
              />
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-[10002]"
              >
                <TimeDurationPicker
                  value={value}
                  mode={mode}
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

export default TimeDurationPickerField;
