import { useState, useEffect } from "react";
import { FaCheck, FaUndo } from "react-icons/fa";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  if (typeof value !== "string") return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function toIsoDate(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// ── Quick-select presets ──────────────────────────────────────────────
function getPresets() {
  const t = startOfDay(new Date());
  const yesterday = new Date(t); yesterday.setDate(t.getDate() - 1);
  const last7start = new Date(t); last7start.setDate(t.getDate() - 6);
  const last30start = new Date(t); last30start.setDate(t.getDate() - 29);
  const thisMonthStart = new Date(t.getFullYear(), t.getMonth(), 1);
  const thisMonthEnd = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  const lastMonthStart = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const lastMonthEnd = new Date(t.getFullYear(), t.getMonth(), 0);

  return [
    { key: "today",     label: "Today",        sub: fmt(t),                         single: t },
    { key: "yesterday", label: "Yesterday",    sub: fmt(yesterday),                  single: yesterday },
    { key: "last7",     label: "Last 7 days",  sub: `${fmt(last7start)} – ${fmt(t)}`, range: [last7start, t] },
    { key: "last30",    label: "Last 30 days", sub: `${fmt(last30start)} – ${fmt(t)}`, range: [last30start, t] },
    { key: "thisMonth", label: "This month",   sub: `${fmt(thisMonthStart)} – ${fmt(thisMonthEnd)}`, range: [thisMonthStart, thisMonthEnd] },
    { key: "lastMonth", label: "Last month",   sub: `${fmt(lastMonthStart)} – ${fmt(lastMonthEnd)}`, range: [lastMonthStart, lastMonthEnd] },
  ];
}

function filterPresets(presets, mode) {
  if (mode === "single") {
    return presets.filter((preset) => preset.single);
  }

  if (mode === "range") {
    return presets.filter((preset) => preset.range);
  }

  return presets;
}

// ── Calendar grid ─────────────────────────────────────────────────────
function Calendar({ mode, viewDate, onViewChange, selectedSingle, onSelectSingle,
  rangeStart, rangeEnd, onRangeClick }) {

  const [hoverDate, setHoverDate] = useState(null);
  const today = startOfDay(new Date());
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  function getDayClass(date) {
    const base = "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs cursor-pointer select-none transition-colors duration-100 ";
    if (mode === "single") {
      if (sameDay(date, selectedSingle)) return base + "bg-blue-500 text-white rounded-lg font-medium";
      if (sameDay(date, today)) return base + "bg-blue-100 text-blue-700 rounded-lg font-medium";
      return base + "hover:bg-gray-100 rounded-lg text-gray-700";
    }
    // range mode
    const lo = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeStart : rangeEnd) : rangeStart;
    const hi = rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? rangeEnd : rangeStart) :
      (rangeStart && hoverDate ? (hoverDate >= rangeStart ? hoverDate : null) : null);

    if (lo && sameDay(date, lo) && hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white rounded-lg font-medium";
    if (lo && sameDay(date, lo))
      return base + "bg-blue-500 text-white font-medium " + (hi ? "rounded-l-lg rounded-r-none" : "rounded-lg");
    if (hi && sameDay(date, hi))
      return base + "bg-blue-500 text-white font-medium rounded-r-lg rounded-l-none";
    if (lo && hi && date > lo && date < hi)
      return base + "bg-blue-100 text-blue-700 rounded-none";
    if (sameDay(date, today)) return base + "bg-blue-50 text-blue-600 rounded-lg font-medium";
    return base + "hover:bg-gray-100 rounded-lg text-gray-700";
  }

  const cells = [];
  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div key={`p${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300">
        {prevMonthDays - firstDay + i + 1}
      </div>
    );
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = startOfDay(new Date(y, m, d));
    cells.push(
      <div
        key={d}
        className={getDayClass(date)}
        onClick={() => {
          if (mode === "single") onSelectSingle(date);
          else onRangeClick(date);
        }}
        onMouseEnter={() => mode === "range" && setHoverDate(date)}
        onMouseLeave={() => mode === "range" && setHoverDate(null)}
      >
        {d}
      </div>
    );
  }
  // Next month padding
  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining && d <= 7; d++) {
    cells.push(
      <div key={`n${d}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs text-gray-300">{d}</div>
    );
  }

  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between mb-2.5 gap-1.5">
        <button
          onClick={() => onViewChange(new Date(y, m - 1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex-shrink-0"
        >
          ‹
        </button>
        <span className="text-[11px] sm:text-xs font-medium text-gray-800 text-center flex-1 min-w-0 truncate">{MONTHS[m]} {y}</span>
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
    </div>
  );
}

// ── Main DatePicker ───────────────────────────────────────────────────
export default function DatePicker({
  mode = "both",
  onApply,
  initialTab = "quick",
  initialQuickKey = "today",
  initialSingle = null,
  initialRangeStart = null,
  initialRangeEnd = null,
}) {
  const [tab, setTab] = useState(initialTab);
  const [quickKey, setQuickKey] = useState(initialQuickKey);
  const [viewDate, setViewDate] = useState(parseDateValue(initialSingle) || parseDateValue(initialRangeStart) || new Date());
  const [selectedSingle, setSelectedSingle] = useState(parseDateValue(initialSingle));
  const [rangeStart, setRangeStart] = useState(parseDateValue(initialRangeStart));
  const [rangeEnd, setRangeEnd] = useState(parseDateValue(initialRangeEnd));
  const [feedback, setFeedback] = useState("");

  const presets = filterPresets(getPresets(), mode);
  const today = startOfDay(new Date());
  const tabs = [
    { key: "quick", label: "Quick select" },
    ...(mode !== "range" ? [{ key: "single", label: "Single date" }] : []),
    ...(mode !== "single" ? [{ key: "range", label: "Date range" }] : []),
  ];

  function handleRangeClick(date) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
    } else {
      if (date < rangeStart) { setRangeEnd(rangeStart); setRangeStart(date); }
      else setRangeEnd(date);
    }
  }

  function getLabel() {
    if (tab === "quick") {
      return presets.find(p => p.key === quickKey)?.label || "";
    }
    if (tab === "single") {
      return selectedSingle ? fmt(selectedSingle) : "Pick a date";
    }
    if (rangeStart && rangeEnd) return `${fmt(rangeStart)} → ${fmt(rangeEnd)}`;
    if (rangeStart) return `${fmt(rangeStart)} → …`;
    return "Pick start date";
  }

  function handleApply() {
    let result = null;
    if (tab === "quick") {
      const p = presets.find(p => p.key === quickKey);
      if (p?.single) {
        result = { type: "single", date: p.single };
      } else if (p?.range) {
        result = { type: "range", start: p.range[0], end: p.range[1] };
      }
    } else if (tab === "single") {
      if (!selectedSingle) { setFeedback("Please select a date."); setTimeout(() => setFeedback(""), 2000); return; }
      result = { type: "single", date: selectedSingle };
    } else {
      if (!rangeStart || !rangeEnd) { setFeedback("Please select a date range."); setTimeout(() => setFeedback(""), 2000); return; }
      result = { type: "range", start: rangeStart, end: rangeEnd };
    }
    setFeedback("✓ Applied!");
    setTimeout(() => setFeedback(""), 2000);
    onApply?.(result);
  }

  function handleReset() {
    setQuickKey("today");
    setSelectedSingle(null);
    setRangeStart(null);
    setRangeEnd(null);
    setViewDate(new Date());
    setFeedback("");
  }

  useEffect(() => {
    if (mode === "single" && tab === "range") {
      setTab("single");
    }
    if (mode === "range" && tab === "single") {
      setTab("range");
    }
  }, [mode, tab]);

  useEffect(() => {
    if (tab === "quick" && presets.length > 0) {
      const hasQuick = presets.some((preset) => preset.key === quickKey);
      if (!hasQuick) {
        setQuickKey(presets[0].key);
      }
    }
  }, [presets, quickKey, tab]);

  return (
    <div className="w-[min(calc(100vw-0.5rem),19rem)] sm:w-[19rem] max-w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden font-sans max-h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Selected</p>
        <p className="text-xs sm:text-sm font-medium text-gray-800 break-words">
          {feedback || getLabel()}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-100">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`min-w-0 flex-1 py-2 text-[10px] sm:text-[11px] font-medium transition-colors border-b-2 ${
              tab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 py-3.5 overflow-y-auto">
        {tab === "quick" && (
          <div className="space-y-1.5 max-h-[46vh]">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => setQuickKey(p.key)}
                className={`w-full flex flex-col items-start px-2.5 py-2 rounded-lg border text-left transition-all ${
                  quickKey === p.key
                    ? "bg-blue-50 border-blue-300"
                    : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                }`}
              >
                <span className={`text-xs font-medium ${quickKey === p.key ? "text-blue-700" : "text-gray-700"}`}>
                  {p.label}
                </span>
                <span className={`text-[10px] mt-0.5 ${quickKey === p.key ? "text-blue-400" : "text-gray-400"}`}>
                  {p.sub}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "single" && (
          <Calendar
            mode="single"
            viewDate={viewDate}
            onViewChange={setViewDate}
            selectedSingle={selectedSingle}
            onSelectSingle={setSelectedSingle}
          />
        )}

        {tab === "range" && (
          <div>
            <p className="text-[10px] text-center text-gray-400 mb-2 h-4 px-1">
              {!rangeStart ? "Click to set start date" :
                !rangeEnd ? "Click to set end date" :
                `${fmt(rangeStart)} → ${fmt(rangeEnd)}`}
            </p>
            <Calendar
              mode="range"
              viewDate={viewDate}
              onViewChange={setViewDate}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onRangeClick={handleRangeClick}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2.5 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-1.5">
        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
          title="Reset"
          aria-label="Reset"
        >
          <FaUndo className="text-[11px]" />
        </button>
        <button
          onClick={handleApply}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors w-full sm:w-auto"
          title="Apply"
          aria-label="Apply"
        >
          <FaCheck className="text-[11px]" />
        </button>
      </div>
    </div>
  );
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Select date",
  buttonClassName = "",
  wrapperClassName = "",
  popoverClassName = "",
  initialTab = "single",
  mode = "single",
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${buttonClassName} flex items-center justify-between gap-2`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`min-w-0 flex-1 truncate text-left text-xs sm:text-sm ${value ? "" : "text-gray-400"}`}>
          {value ? fmt(selectedDate) : placeholder}
        </span>
        <span className="flex-shrink-0 text-[10px] text-gray-400">▾</span>
      </button>

      {open && (
        <div className={`absolute left-0 right-0 top-full z-30 mt-1.5 ${popoverClassName}`.trim()}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm hover:bg-white hover:text-gray-700"
            >
              Close
            </button>
            <DatePicker
              mode={mode}
              initialTab={initialTab}
              initialSingle={selectedDate}
              onApply={(result) => {
                if (result?.type === "single") {
                  onChange?.(toIsoDate(result.date));
                } else if (result?.type === "range") {
                  onChange?.({
                    start: toIsoDate(result.start),
                    end: toIsoDate(result.end),
                  });
                }
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function DateRangePickerField({
  value,
  onChange,
  placeholder = "Select date range",
  buttonClassName = "",
  wrapperClassName = "",
  popoverClassName = "",
  initialTab = "range",
}) {
  const [open, setOpen] = useState(false);
  const startValue = value?.start || value?.start_date || value?.from || "";
  const endValue = value?.end || value?.end_date || value?.to || "";
  const startDate = parseDateValue(startValue);
  const endDate = parseDateValue(endValue);

  const displayValue = startDate && endDate
    ? `${fmt(startDate)} to ${fmt(endDate)}`
    : startDate
      ? `${fmt(startDate)} to ...`
      : placeholder;

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${buttonClassName} flex items-center justify-between gap-2`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`min-w-0 flex-1 truncate text-left text-xs sm:text-sm ${startDate ? "" : "text-gray-400"}`}>
          {displayValue}
        </span>
        <span className="flex-shrink-0 text-[10px] text-gray-400">▾</span>
      </button>

      {open && (
        <div className={`absolute left-0 right-0 top-full z-30 mt-1.5 ${popoverClassName}`.trim()}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-1.5 top-1.5 z-10 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shadow-sm hover:bg-white hover:text-gray-700"
            >
              Close
            </button>
            <DatePicker
              mode="range"
              initialTab={initialTab}
              initialRangeStart={startDate}
              initialRangeEnd={endDate}
              onApply={(result) => {
                if (result?.type === "range") {
                  onChange?.({
                    start: toIsoDate(result.start),
                    end: toIsoDate(result.end),
                  });
                }
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
