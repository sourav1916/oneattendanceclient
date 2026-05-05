import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaCalendarAlt, FaTimes, FaCheck, FaUndo,
} from "react-icons/fa";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toIsoDate(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  if (typeof value !== "string") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(d) {
  if (!d) return null;
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ─── Calendar Grid (same logic as DatePicker.jsx) ────────────────────────────

function Calendar({ mode, viewDate, onViewChange, selectedSingle, onSelectSingle,
  rangeStart, rangeEnd, onRangeClick, onSinglePick }) {

  const [hoverDate, setHoverDate] = useState(null);
  const today = startOfDay(new Date());
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  function getDayClass(date) {
    const base =
      "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs select-none transition-colors duration-100 cursor-pointer ";

    if (mode === "single") {
      if (sameDay(date, selectedSingle)) return base + "bg-blue-500 text-white rounded-lg font-medium";
      if (sameDay(date, today)) return base + "bg-blue-100 text-blue-700 rounded-lg font-medium";
      return base + "hover:bg-gray-100 rounded-lg text-gray-700";
    }

    // range mode
    const lo = rangeStart && rangeEnd
      ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd)
      : rangeStart;
    const hi = rangeStart && rangeEnd
      ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart)
      : (rangeStart && hoverDate ? (hoverDate >= rangeStart ? hoverDate : null) : null);

    if (lo && sameDay(date, lo) && hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white rounded-lg font-medium";
    if (lo && sameDay(date, lo))
      return base + "bg-blue-500 text-white font-medium " + (hi ? "rounded-l-lg rounded-r-none" : "rounded-lg");
    if (hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white font-medium rounded-r-lg rounded-l-none";
    if (lo && hi && date > lo && date < hi)
      return base + "bg-blue-100 text-blue-700 rounded-none";
    if (sameDay(date, today)) return base + "bg-blue-100 text-blue-600 rounded-lg font-medium";
    return base + "hover:bg-gray-100 rounded-lg text-gray-700";
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div key={`p${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300">
        {prevMonthDays - firstDay + i + 1}
      </div>
    );
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = startOfDay(new Date(y, m, d));
    cells.push(
      <div
        key={d}
        className={getDayClass(date)}
        onClick={() => {
          if (mode === "single") {
            onSelectSingle?.(date);
            onSinglePick?.(date);
          } else {
            onRangeClick?.(date);
          }
        }}
        onMouseEnter={() => mode === "range" && setHoverDate(date)}
        onMouseLeave={() => mode === "range" && setHoverDate(null)}
      >
        {d}
      </div>
    );
  }
  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining && d <= 7; d++) {
    cells.push(
      <div key={`n${d}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300">{d}</div>
    );
  }

  return (
    <div>
      {/* Month/Year Nav */}
      <div className="flex items-center justify-between mb-2.5 gap-1.5">
        <button
          onClick={() => onViewChange(new Date(y, m - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0"
        >
          ‹
        </button>
        <span className="text-[11px] sm:text-xs font-medium text-gray-800 text-center flex-1 min-w-0 truncate">
          {MONTHS_FULL[m]} {y}
        </span>
        <button
          onClick={() => onViewChange(new Date(y, m + 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0"
        >
          ›
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="w-7 h-6 sm:w-8 sm:h-6 flex items-center justify-center text-[9px] sm:text-[10px] text-gray-400 font-medium">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells}
      </div>
      {/* Quick links */}
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => { onSelectSingle?.(null); onSinglePick?.(null); }}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => {
            const t = startOfDay(new Date());
            onSelectSingle?.(t);
            onViewChange?.(t);
            onSinglePick?.(t);
          }}
          className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// ─── Month Picker Grid ───────────────────────────────────────────────────────

function MonthYearPicker({ month, year, onMonthChange, onYearChange }) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div>
        <p className="text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-semibold">Year</p>
        <div className="grid grid-cols-4 gap-1">
          {years.map(y => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors ${
                year === y
                  ? "bg-blue-500 text-white"
                  : "border border-gray-100 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
      {/* Month selector */}
      <div>
        <p className="text-[9px] text-gray-400 mb-2 uppercase tracking-widest font-semibold">Month</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS_SHORT.map((name, idx) => {
            const val = idx + 1;
            return (
              <button
                key={name}
                onClick={() => onMonthChange(val)}
                className={`py-2 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${
                  month === val
                    ? "bg-blue-500 text-white"
                    : "border border-gray-100 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdvancedDateFilter Component ──────────────────────────────────────

export default function AdvancedDateFilter({
  value,
  onChange,
  placeholder = "Filter by date",
  buttonClassName = "",
  tabOptions = ["date", "month", "range"],
}) {
  const allowedTabs = Array.isArray(tabOptions) && tabOptions.length > 0
    ? tabOptions
    : ["date", "month", "range"];
  const hasMultipleTabs = allowedTabs.length > 1;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(allowedTabs[0]); // "date" | "month" | "range"
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const today = startOfDay(new Date());

  // --- Internal state for Date tab ---
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedSingle, setSelectedSingle] = useState(null);

  // --- Internal state for Month tab ---
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  // --- Internal state for Range tab ---
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [rangeViewDate, setRangeViewDate] = useState(new Date());

  // Sync internal state when opening
  useEffect(() => {
    if (isOpen && value) {
      if (value.date) {
        const d = parseDateValue(value.date);
        if (allowedTabs.includes("date")) {
          setSelectedSingle(d);
          if (d) setViewDate(d);
          setActiveTab("date");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (value.month && value.year) {
        if (allowedTabs.includes("month")) {
          setTempMonth(Number(value.month));
          setTempYear(Number(value.year));
          setActiveTab("month");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (value.from_date && value.to_date) {
        if (allowedTabs.includes("range")) {
          setRangeStart(parseDateValue(value.from_date));
          setRangeEnd(parseDateValue(value.to_date));
          setActiveTab("range");
        } else if (allowedTabs[0]) {
          setActiveTab(allowedTabs[0]);
        }
      } else if (!allowedTabs.includes(activeTab) && allowedTabs[0]) {
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [isOpen, value, allowedTabs, activeTab]);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab) && allowedTabs[0]) {
      setActiveTab(allowedTabs[0]);
    }
  }, [allowedTabs, activeTab]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e) => {
      if (popoverRef.current?.contains(e.target)) return;
      if (triggerRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleRangeClick(date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else {
      if (date < rangeStart) { setRangeEnd(rangeStart); setRangeStart(date); }
      else setRangeEnd(date);
    }
  }

  function handleApply() {
    let result = {};
    if (activeTab === "date") {
      result = { date: toIsoDate(selectedSingle), month: "", year: "", from_date: "", to_date: "" };
    } else if (activeTab === "month") {
      result = { date: "", month: tempMonth, year: tempYear, from_date: "", to_date: "" };
    } else if (activeTab === "range") {
      result = {
        date: "", month: "", year: "",
        from_date: toIsoDate(rangeStart),
        to_date: toIsoDate(rangeEnd),
      };
    }
    onChange?.(result);
    setIsOpen(false);
  }

  function handleClear() {
    setSelectedSingle(null);
    setRangeStart(null);
    setRangeEnd(null);
    onChange?.({ date: "", month: "", year: "", from_date: "", to_date: "" });
    setIsOpen(false);
  }

  // --- Display label on trigger button ---
  function getDisplayLabel() {
    if (!value) return placeholder;
    if (value.date) return fmt(parseDateValue(value.date)) || placeholder;
    if (value.month && value.year) return `${MONTHS_FULL[value.month - 1]} ${value.year}`;
    if (value.from_date && value.to_date) {
      const s = parseDateValue(value.from_date);
      const e = parseDateValue(value.to_date);
      return s && e ? `${fmt(s)} – ${fmt(e)}` : placeholder;
    }
    return placeholder;
  }

  const hasFilter = value && (value.date || (value.month && value.year) || (value.from_date && value.to_date));

  // --- Tab label ---
  function getTabLabel() {
    if (activeTab === "date") {
      return selectedSingle ? fmt(selectedSingle) : "Pick a date";
    }
    if (activeTab === "month") {
      return `${MONTHS_FULL[tempMonth - 1]} ${tempYear}`;
    }
    if (rangeStart && rangeEnd) return `${fmt(rangeStart)} → ${fmt(rangeEnd)}`;
    if (rangeStart) return `${fmt(rangeStart)} → …`;
    return "Pick start date";
  }

  const tabs = [
    { key: "date", label: "Single date" },
    { key: "month", label: "Month & year" },
    { key: "range", label: "Date range" },
  ].filter((tab) => allowedTabs.includes(tab.key));

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`${buttonClassName} flex items-center justify-between gap-2`.trim()}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={`min-w-0 flex-1 truncate text-left text-xs sm:text-sm flex items-center gap-1.5 ${hasFilter ? "" : "text-gray-400"}`}>
          <FaCalendarAlt className={`flex-shrink-0 text-[11px] ${hasFilter ? "text-blue-500" : "text-gray-400"}`} />
          {getDisplayLabel()}
        </span>
        <span className="flex-shrink-0 text-[10px] text-gray-400">▾</span>
      </button>

      {/* Modal Portal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: "fadeIn 0.2s ease-out" }}
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div
            ref={popoverRef}
            data-advanced-date-filter="true"
            className="relative z-[10002]"
            style={{
              width: window.innerWidth < 640 ? "90%" : "100%",
              maxWidth: "22rem",
              animation: "zoomIn 0.2s ease-out",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm hover:bg-white hover:text-red-500 transition-colors"
              title="Close"
            >
              <FaTimes size={12} />
            </button>

            {/* Panel (same structure as DatePicker.jsx) */}
            <div className="w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden font-sans flex flex-col">

              {/* Header — selected label */}
              <div className="px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 border-b border-gray-100">
                <p className="text-[9px] text-gray-400 mb-1.5 uppercase tracking-widest font-semibold">Selected</p>
                <p className="text-xs sm:text-sm font-medium text-gray-800 break-words">{getTabLabel()}</p>
              </div>

              {/* Tabs */}
              {hasMultipleTabs && (
                <div className="flex border-b border-gray-100">
                  {tabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`min-w-0 flex-1 py-2 text-[10px] sm:text-[11px] font-medium transition-colors border-b-2 ${
                        activeTab === t.key
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="px-3 sm:px-4 py-3.5 overflow-y-auto">

                {/* DATE TAB — inline calendar */}
                {activeTab === "date" && (
                  <Calendar
                    mode="single"
                    viewDate={viewDate}
                    onViewChange={setViewDate}
                    selectedSingle={selectedSingle}
                    onSelectSingle={setSelectedSingle}
                    onSinglePick={(date) => {
                      // Auto-apply on single pick like DatePicker does
                      if (date) setSelectedSingle(date);
                    }}
                  />
                )}

                {/* MONTH TAB */}
                {activeTab === "month" && (
                  <MonthYearPicker
                    month={tempMonth}
                    year={tempYear}
                    onMonthChange={setTempMonth}
                    onYearChange={setTempYear}
                  />
                )}

                {/* RANGE TAB */}
                {activeTab === "range" && (
                  <div>
                    <p className="text-[10px] text-center text-gray-400 mb-2 h-4 px-1">
                      {!rangeStart ? "Click to set start date" :
                        !rangeEnd ? "Click to set end date" :
                          `${fmt(rangeStart)} → ${fmt(rangeEnd)}`}
                    </p>
                    <Calendar
                      mode="range"
                      viewDate={rangeViewDate}
                      onViewChange={setRangeViewDate}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      onRangeClick={handleRangeClick}
                    />
                  </div>
                )}
              </div>

              {/* Footer — same as DatePicker.jsx */}
              <div className="px-3 sm:px-4 py-2.5 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-1.5">
                <button
                  onClick={handleClear}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  title="Clear filter"
                >
                  <FaUndo className="text-[11px]" />
                </button>
                <button
                  onClick={handleApply}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto"
                  title="Apply filter"
                >
                  <FaCheck className="text-[11px]" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
