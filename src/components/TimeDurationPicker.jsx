import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FaCheck, FaClock, FaHourglassHalf, FaTimes } from "react-icons/fa";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];

const pad = (value) => String(value).padStart(2, "0");

const parseTimeValue = (value) => {
  if (!value || typeof value !== "string") return { hours: 9, minutes: 0 };
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

const SelectColumn = ({ label, value, options, onChange, className = "" }) => (
  <label className={`flex flex-col gap-1 ${className}`}>
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {String(option).padStart(2, "0")}
        </option>
      ))}
    </select>
  </label>
);

export const TimeDurationPicker = ({ value, onApply, onClose, mode = "time" }) => {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const initialTime = useMemo(() => parseTimeValue(value), [value]);
  const initialDuration = useMemo(() => parseDurationValue(value), [value]);

  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);

  useEffect(() => {
    if (mode === "time") {
      const next = parseTimeValue(value);
      setHours(next.hours);
      setMinutes(next.minutes);
    } else {
      setDurationMinutes(parseDurationValue(value));
    }
  }, [mode, value]);

  const updatePosition = () => {
    const nextPosition = getAnchoredPopoverPosition(triggerRef.current, popoverRef.current);
    if (nextPosition) {
      setPosition(nextPosition);
    }
  };

  const handleApply = () => {
    const nextValue = mode === "time" ? formatTimeValue(hours, minutes) : formatDurationValue(durationMinutes);
    onApply(nextValue);
  };

  const isTimeMode = mode === "time";

  return (
    <div
      className="w-full max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.15)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          {isTimeMode ? (
            <FaClock className="h-3 w-3 text-indigo-500" />
          ) : (
            <FaHourglassHalf className="h-3 w-3 text-indigo-500" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            {isTimeMode ? "Select Time" : "Select Minutes"}
          </span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-mono font-bold text-indigo-600">
          {isTimeMode ? `${pad(hours)}:${pad(minutes)}` : formatDurationDisplay(durationMinutes)}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {isTimeMode ? (
          <div className="grid grid-cols-2 gap-3">
            <SelectColumn label="Hour" value={hours} options={HOURS} onChange={setHours} />
            <SelectColumn label="Minute" value={minutes} options={MINUTES} onChange={setMinutes} />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Minutes
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(0, Number(e.target.value) || 0))}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationMinutes(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    durationMinutes === preset
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  {formatDurationDisplay(preset)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            title="Close"
          >
            <FaTimes className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
            title="Save"
          >
            <FaCheck className="h-3 w-3" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">Save</span>
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
      return typeof value === "string" ? value.substring(0, 5) : "";
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
          onClick={() => setIsOpen(true)}
          className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 transition-all duration-200 ${
            isOpen
              ? "border-indigo-500 ring-2 ring-indigo-50"
              : "border-slate-200 bg-white shadow-sm hover:border-indigo-300"
          }`}
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
              className="group/clear rounded-md p-1 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
              title="Clear time"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        {isOpen &&
          createPortal(
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[9999] w-[min(calc(100vw-1rem),280px)]"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
              }}
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
            </motion.div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default TimeDurationPickerField;
